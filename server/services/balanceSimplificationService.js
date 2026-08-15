const { roundToCents } = require('../utils/moneyUtils');

/**
 * Debt Simplification Algorithm
 * Minimizes total number of transactions required to settle all debts in a group.
 * Preserves exact individual net balances.
 * 
 * @param {Array<{userId: string, netBalance: number}>} memberBalances 
 * 
 * @returns {Array<{
 *   fromUser: string,
 *   toUser: string,
 *   amount: number
 * }>} List of simplified payment transactions
 */
const simplifyBalances = (memberBalances) => {
  // 1. Separate into creditors and debtors
  const creditors = [];
  const debtors = [];

  memberBalances.forEach(m => {
    const net = roundToCents(m.netBalance);
    const sId = m.userId.toString();
    if (net > 0.005) {
      creditors.push({ userId: sId, credit: net });
    } else if (net < -0.005) {
      debtors.push({ userId: sId, debt: Math.abs(net) });
    }
  });

  // Sort creditors descending by credit, debtors descending by debt
  creditors.sort((a, b) => b.credit - a.credit);
  debtors.sort((a, b) => b.debt - a.debt);

  const transactions = [];

  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const amount = roundToCents(Math.min(creditor.credit, debtor.debt));

    if (amount > 0) {
      transactions.push({
        fromUser: debtor.userId,
        toUser: creditor.userId,
        amount: amount
      });
    }

    creditor.credit = roundToCents(creditor.credit - amount);
    debtor.debt = roundToCents(debtor.debt - amount);

    if (creditor.credit <= 0.005) {
      cIdx++;
    }
    if (debtor.debt <= 0.005) {
      dIdx++;
    }
  }

  // Verification step: Ensure net change for each user in transactions matches original netBalance
  verifySimplificationCorrectness(memberBalances, transactions);

  return transactions;
};

/**
 * Validates that simplified transactions yield identical net balances.
 */
const verifySimplificationCorrectness = (originalBalances, transactions) => {
  const checkMap = new Map();
  originalBalances.forEach(m => checkMap.set(m.userId.toString(), 0));

  transactions.forEach(tx => {
    const fromId = tx.fromUser.toString();
    const toId = tx.toUser.toString();
    const amt = tx.amount;

    checkMap.set(fromId, roundToCents((checkMap.get(fromId) || 0) - amt));
    checkMap.set(toId, roundToCents((checkMap.get(toId) || 0) + amt));
  });

  originalBalances.forEach(m => {
    const orig = roundToCents(m.netBalance);
    const simplified = roundToCents(checkMap.get(m.userId.toString()) || 0);
    if (Math.abs(orig - simplified) > 0.01) {
      console.error(`SIMPLIFICATION ERROR for user ${m.userId}: Original=${orig}, Simplified=${simplified}`);
    }
  });
};

module.exports = {
  simplifyBalances
};
