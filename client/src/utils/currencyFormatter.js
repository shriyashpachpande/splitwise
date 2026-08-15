/**
 * Formats a monetary amount into a clean currency string.
 * @param {number} amount 
 * @param {string} currency - 'INR' | 'USD' | etc.
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  const symbolMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const symbol = symbolMap[currency] || '₹';
  const formattedNum = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${symbol}${formattedNum}`;
};

/**
 * Returns formatted signed balance string.
 * e.g. +₹850.00, -₹450.00, Settled
 */
export const formatSignedBalance = (amount, currency = 'INR') => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  if (Math.abs(num) < 0.01) {
    return 'Settled';
  }
  const sign = num > 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(num), currency)}`;
};
