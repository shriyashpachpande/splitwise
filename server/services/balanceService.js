const { roundToCents } = require('../utils/moneyUtils');

/**
 * Calculates net financial balances for all members in a group.
 * 
 * @param {Array<string>} memberIds - List of member user IDs in the group
 * @param {Array<Object>} expenses - List of expense objects
 * @param {Array<Object>} settlements - List of settlement objects
 * 
 * @returns {{
 *   memberBalances: Array<{
 *     userId: string,
 *     totalPaid: number,
 *     totalShare: number,
 *     netBalance: number
 *   }>,
 *   rawDebts: Array<{
 *     fromUser: string,
 *     toUser: string,
 *     amount: number
 *   }>,
 *   invariantPassed: boolean
 * }}
 */
const calculateGroupBalances = (memberIds, expenses = [], settlements = []) => {
  const memberMap = new Map();

  // Initialize all group members with 0 balances
  memberIds.forEach(id => {
    const sId = id.toString();
    memberMap.set(sId, {
      userId: sId,
      totalPaid: 0,
      totalShare: 0,
      netBalance: 0
    });
  });

  // 1. Process Expenses
  expenses.forEach(expense => {
    // Add Payer amounts
    (expense.payers || []).forEach(payer => {
      const pId = payer.userId ? payer.userId.toString() : payer.toString();
      if (!memberMap.has(pId)) {
        memberMap.set(pId, { userId: pId, totalPaid: 0, totalShare: 0, netBalance: 0 });
      }
      const current = memberMap.get(pId);
      current.totalPaid = roundToCents(current.totalPaid + (payer.amount || 0));
    });

    // Add Participant shares
    (expense.participants || []).forEach(participant => {
      const uId = participant.userId ? participant.userId.toString() : participant.toString();
      if (!memberMap.has(uId)) {
        memberMap.set(uId, { userId: uId, totalPaid: 0, totalShare: 0, netBalance: 0 });
      }
      const current = memberMap.get(uId);
      current.totalShare = roundToCents(current.totalShare + (participant.shareAmount || 0));
    });
  });

  // 2. Process Settlements
  // When User A settles with User B (paying amount $A):
  // User A has effectively paid extra money into the group pool (+totalPaid or +settlement)
  // User B has received money from User A (+totalShare or -netBalance offset)
  settlements.forEach(settlement => {
    const fromId = settlement.fromUser ? settlement.fromUser.toString() : '';
    const toId = settlement.toUser ? settlement.toUser.toString() : '';
    const amount = roundToCents(settlement.amount || 0);

    if (memberMap.has(fromId)) {
      const fromMember = memberMap.get(fromId);
      fromMember.totalPaid = roundToCents(fromMember.totalPaid + amount);
    }
    if (memberMap.has(toId)) {
      const toMember = memberMap.get(toId);
      toMember.totalShare = roundToCents(toMember.totalShare + amount);
    }
  });

  // 3. Compute Net Balances
  const memberBalances = [];
  let sumNetBalances = 0;

  for (const [userId, record] of memberMap.entries()) {
    const net = roundToCents(record.totalPaid - record.totalShare);
    record.netBalance = net;
    sumNetBalances = roundToCents(sumNetBalances + net);
    memberBalances.push(record);
  }

  // 4. Invariant Check: SUM(netBalances) must equal 0
  const invariantPassed = Math.abs(sumNetBalances) < 0.01;
  if (!invariantPassed) {
    console.error(`CRITICAL ERROR: Balance invariant failed! Sum of net balances = ${sumNetBalances}`);
  }

  // 5. Generate Raw Pairwise Debts (Before Simplification)
  const rawDebts = generateRawDebts(memberBalances);

  return {
    memberBalances,
    rawDebts,
    invariantPassed
  };
};

/**
 * Helper to produce raw pairwise debts without transaction minimization.
 */
const generateRawDebts = (memberBalances) => {
  const creditors = memberBalances
    .filter(m => m.netBalance > 0.001)
    .map(m => ({ userId: m.userId, amount: m.netBalance }));
  const debtors = memberBalances
    .filter(m => m.netBalance < -0.001)
    .map(m => ({ userId: m.userId, amount: Math.abs(m.netBalance) }));

  const debts = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const transfer = roundToCents(Math.min(creditor.amount, debtor.amount));
    if (transfer > 0) {
      debts.push({
        fromUser: debtor.userId,
        toUser: creditor.userId,
        amount: transfer
      });
    }

    creditor.amount = roundToCents(creditor.amount - transfer);
    debtor.amount = roundToCents(debtor.amount - transfer);

    if (creditor.amount <= 0.001) cIdx++;
    if (debtor.amount <= 0.001) dIdx++;
  }

  return debts;
};

module.exports = {
  calculateGroupBalances
};
