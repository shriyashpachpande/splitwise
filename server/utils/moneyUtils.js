/**
 * Safe Financial Math Utilities
 * Prevents JavaScript floating point issues (e.g. 0.1 + 0.2 != 0.3)
 */

/**
 * Rounds a number to exactly 2 decimal places safely.
 * @param {number} num 
 * @returns {number}
 */
const roundToCents = (num) => {
  if (typeof num !== 'number' || isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Distributes totalAmount equally among 'count' participants.
 * Handles remainder cents so that SUM(shares) === totalAmount EXACTLY.
 * 
 * @param {number} totalAmount 
 * @param {number} count 
 * @returns {number[]} Array of shares of length 'count'
 */
const distributeAmountEqually = (totalAmount, count) => {
  const roundedTotal = roundToCents(totalAmount);
  if (count <= 0) return [];
  if (count === 1) return [roundedTotal];

  const totalCents = Math.round(roundedTotal * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainderCents = totalCents - (baseCents * count);

  const shares = [];
  for (let i = 0; i < count; i++) {
    // Add 1 extra cent to the first 'remainderCents' participants
    const shareInCents = i < remainderCents ? baseCents + 1 : baseCents;
    shares.push(shareInCents / 100);
  }

  return shares;
};

/**
 * Checks if two monetary amounts are equal within half a cent tolerance.
 */
const isEqualMoney = (a, b) => {
  return Math.abs(roundToCents(a) - roundToCents(b)) < 0.005;
};

module.exports = {
  roundToCents,
  distributeAmountEqually,
  isEqualMoney
};
