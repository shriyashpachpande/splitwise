const express = require('express');
const router = express.Router();
const {
  createExpense,
  getGroupExpenses,
  getExpenseDetails,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const { isGroupMember } = require('../middleware/groupAuthMiddleware');

router.use(protect);

// Group-specific expense endpoints
router.post('/groups/:groupId/expenses', isGroupMember, createExpense);
router.get('/groups/:groupId/expenses', isGroupMember, getGroupExpenses);

// Direct expense ID endpoints
router.route('/expenses/:id')
  .get(getExpenseDetails)
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
