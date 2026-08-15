const { roundToCents } = require('../utils/moneyUtils');

/**
 * Computes category breakdown and spending stats for a group.
 * 
 * @param {Array<Object>} expenses 
 * @param {string} [currentUserId] 
 * 
 * @returns {Object} Analytics summary
 */
const computeGroupAnalytics = (expenses = [], currentUserId = null) => {
  const categoryTotals = {
    Food: 0,
    Travel: 0,
    Hotel: 0,
    Tickets: 0,
    Music: 0,
    Entertainment: 0,
    Shopping: 0,
    Fuel: 0,
    Drinks: 0,
    Activities: 0,
    Other: 0
  };

  let totalGroupSpending = 0;
  let currentUserPaid = 0;
  let currentUserShare = 0;

  const currentStr = currentUserId ? currentUserId.toString() : null;

  expenses.forEach(exp => {
    const amt = roundToCents(exp.amount || 0);
    totalGroupSpending = roundToCents(totalGroupSpending + amt);

    const cat = exp.category || 'Other';
    if (categoryTotals.hasOwnProperty(cat)) {
      categoryTotals[cat] = roundToCents(categoryTotals[cat] + amt);
    } else {
      categoryTotals['Other'] = roundToCents(categoryTotals['Other'] + amt);
    }

    if (currentStr) {
      // Check how much current user paid in this expense
      (exp.payers || []).forEach(p => {
        if (p.userId && p.userId.toString() === currentStr) {
          currentUserPaid = roundToCents(currentUserPaid + (p.amount || 0));
        }
      });

      // Check current user's share in this expense
      (exp.participants || []).forEach(p => {
        if (p.userId && p.userId.toString() === currentStr) {
          currentUserShare = roundToCents(currentUserShare + (p.shareAmount || 0));
        }
      });
    }
  });

  const othersSpending = roundToCents(Math.max(0, totalGroupSpending - currentUserPaid));

  return {
    totalGroupSpending,
    currentUserPaid,
    currentUserShare,
    othersSpending,
    categoryBreakdown: categoryTotals
  };
};

module.exports = {
  computeGroupAnalytics
};
