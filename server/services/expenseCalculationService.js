const { roundToCents, distributeAmountEqually, isEqualMoney } = require('../utils/moneyUtils');

/**
 * Validates payers and split distribution for an expense.
 * 
 * @param {Object} params
 * @param {number} params.amount - Total expense amount
 * @param {Array<{userId: string, amount: number}>} params.payers - Array of payers
 * @param {string} params.splitType - 'EQUAL' | 'UNEQUAL' | 'ITEM_WISE'
 * @param {Array<{userId: string, shareAmount?: number}>} [params.participants] - For EQUAL or UNEQUAL
 * @param {Array<{name: string, price: number, participants: Array<string>}>} [params.items] - For ITEM_WISE
 * @param {Array<string>} [params.allMemberIds] - Fallback list of member IDs if equal split with no participants specified
 * 
 * @returns {{ payers: Array, participants: Array, items: Array }} Validated & calculated data
 */
const calculateExpenseShares = ({ amount, payers, splitType, participants = [], items = [], allMemberIds = [] }) => {
  const totalAmount = roundToCents(amount);
  if (totalAmount <= 0) {
    throw new Error('Expense amount must be positive.');
  }

  // 1. Validate Payers
  if (!payers || !Array.isArray(payers) || payers.length === 0) {
    throw new Error('At least one payer must be specified.');
  }

  let totalPaid = 0;
  const processedPayers = payers.map(p => {
    const pAmt = roundToCents(p.amount);
    if (pAmt < 0) {
      throw new Error(`Payer amount cannot be negative.`);
    }
    totalPaid += pAmt;
    return {
      userId: p.userId.toString(),
      amount: pAmt
    };
  });
  totalPaid = roundToCents(totalPaid);

  if (!isEqualMoney(totalPaid, totalAmount)) {
    throw new Error(`Paid amount (₹${totalPaid.toFixed(2)}) must equal total expense amount (₹${totalAmount.toFixed(2)}).`);
  }

  // 2. Process Split Type
  let processedParticipants = [];
  let processedItems = [];

  if (splitType === 'EQUAL') {
    // If no participants specified, split among all group members
    let userIdsToSplit = (participants && participants.length > 0)
      ? participants.map(p => (typeof p === 'string' || p instanceof String ? p.toString() : (p.userId ? p.userId.toString() : p.toString())))
      : allMemberIds.map(id => id.toString());

    // Deduplicate userIds
    userIdsToSplit = [...new Set(userIdsToSplit)];

    if (userIdsToSplit.length === 0) {
      throw new Error('No participants specified for equal split.');
    }

    const shareArray = distributeAmountEqually(totalAmount, userIdsToSplit.length);
    processedParticipants = userIdsToSplit.map((userId, index) => ({
      userId,
      shareAmount: shareArray[index]
    }));

  } else if (splitType === 'UNEQUAL') {
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      throw new Error('Participants and individual share amounts are required for unequal split.');
    }

    let totalSplit = 0;
    processedParticipants = participants.map(p => {
      const share = roundToCents(p.shareAmount);
      if (share < 0) {
        throw new Error('Split amount cannot be negative.');
      }
      totalSplit += share;
      return {
        userId: (p.userId ? p.userId.toString() : p.toString()),
        shareAmount: share
      };
    });
    totalSplit = roundToCents(totalSplit);

    if (!isEqualMoney(totalSplit, totalAmount)) {
      throw new Error(`Split amounts (₹${totalSplit.toFixed(2)}) must equal total expense amount (₹${totalAmount.toFixed(2)}).`);
    }

  } else if (splitType === 'ITEM_WISE') {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items list is required for item-wise split.');
    }

    let itemsTotal = 0;
    const userSharesMap = new Map();

    processedItems = items.map(item => {
      const itemPrice = roundToCents(item.price);
      if (itemPrice < 0) {
        throw new Error(`Item price cannot be negative for item "${item.name}".`);
      }
      itemsTotal += itemPrice;

      const itemParticipants = (item.participants || []).map(p => p.toString());
      if (itemParticipants.length === 0) {
        throw new Error(`Item "${item.name}" must have at least one participant.`);
      }

      const itemShares = distributeAmountEqually(itemPrice, itemParticipants.length);
      itemParticipants.forEach((userId, idx) => {
        const share = itemShares[idx];
        const currentSum = userSharesMap.get(userId) || 0;
        userSharesMap.set(userId, roundToCents(currentSum + share));
      });

      return {
        name: item.name,
        price: itemPrice,
        participants: itemParticipants
      };
    });

    itemsTotal = roundToCents(itemsTotal);
    if (!isEqualMoney(itemsTotal, totalAmount)) {
      throw new Error(`Sum of items (₹${itemsTotal.toFixed(2)}) must equal total expense amount (₹${totalAmount.toFixed(2)}).`);
    }

    // Convert map to processedParticipants array
    for (const [userId, shareAmount] of userSharesMap.entries()) {
      processedParticipants.push({
        userId,
        shareAmount: roundToCents(shareAmount)
      });
    }

    // Final check that total calculated participant shares equal expense total
    const finalParticipantSum = roundToCents(
      processedParticipants.reduce((sum, p) => sum + p.shareAmount, 0)
    );

    if (!isEqualMoney(finalParticipantSum, totalAmount)) {
      // Fix tiny remainder rounding difference on user totals if any
      const diff = roundToCents(totalAmount - finalParticipantSum);
      if (processedParticipants.length > 0 && Math.abs(diff) <= 0.05) {
        processedParticipants[0].shareAmount = roundToCents(processedParticipants[0].shareAmount + diff);
      }
    }

  } else {
    throw new Error(`Unsupported split type: ${splitType}`);
  }

  return {
    payers: processedPayers,
    participants: processedParticipants,
    items: processedItems
  };
};

module.exports = {
  calculateExpenseShares
};
