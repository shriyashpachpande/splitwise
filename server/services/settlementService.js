const { roundToCents } = require('../utils/moneyUtils');

/**
 * Handles creation and validation of settlements between group members.
 */
const validateSettlement = ({ fromUser, toUser, amount, memberIds }) => {
  const fromStr = fromUser.toString();
  const toStr = toUser.toString();
  const validMembers = memberIds.map(id => id.toString());

  if (!validMembers.includes(fromStr)) {
    throw new Error('Payer does not belong to this group.');
  }
  if (!validMembers.includes(toStr)) {
    throw new Error('Recipient does not belong to this group.');
  }
  if (fromStr === toStr) {
    throw new Error('Cannot settle up with yourself.');
  }

  const roundedAmount = roundToCents(amount);
  if (roundedAmount <= 0) {
    throw new Error('Settlement amount must be positive.');
  }

  return {
    fromUser: fromStr,
    toUser: toStr,
    amount: roundedAmount
  };
};

module.exports = {
  validateSettlement
};
