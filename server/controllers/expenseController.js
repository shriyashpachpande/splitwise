const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Activity = require('../models/Activity');
const { calculateExpenseShares } = require('../services/expenseCalculationService');

// Helper to check group membership authorization (IDOR Security Guard)
const verifyGroupMember = (group, userId) => {
  if (!group) return false;
  return group.members.some(m => m.toString() === userId.toString());
};

// @desc    Create new expense in a group
// @route   POST /api/groups/:groupId/expenses
const createExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, category, amount, date, payers, splitType, participants, items } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Security Check: Only active group members can create expenses
    if (!verifyGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const memberIds = group.members.map(m => m.toString());

    // Validate financial calculations on backend
    const validatedData = calculateExpenseShares({
      amount: Number(amount),
      payers,
      splitType,
      participants,
      items,
      allMemberIds: memberIds
    });

    const expense = await Expense.create({
      groupId,
      description,
      category: category || 'Other',
      amount: Number(amount),
      date: date || new Date(),
      payers: validatedData.payers,
      splitType,
      participants: validatedData.participants,
      items: validatedData.items,
      createdBy: req.user._id
    });

    await Activity.create({
      groupId,
      user: req.user._id,
      actionType: 'EXPENSE_ADDED',
      description: `${req.user.name} added "${description}" (₹${Number(amount).toFixed(2)})`
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('createdBy', 'name email avatar')
      .populate('payers.userId', 'name email avatar')
      .populate('participants.userId', 'name email avatar');

    res.status(201).json(populatedExpense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(400).json({ message: error.message || 'Error creating expense' });
  }
};

// @desc    Get all expenses for a group
// @route   GET /api/groups/:groupId/expenses
const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { category, search, userId } = req.query;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Security Check: Only active group members can view expenses
    if (!verifyGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const filter = { groupId };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    if (userId) {
      filter.$or = [
        { 'payers.userId': userId },
        { 'participants.userId': userId }
      ];
    }

    const expenses = await Expense.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('payers.userId', 'name email avatar')
      .populate('participants.userId', 'name email avatar')
      .sort({ date: -1, createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Get group expenses error:', error);
    res.status(500).json({ message: 'Server error fetching expenses' });
  }
};

// @desc    Get expense details
// @route   GET /api/expenses/:id
const getExpenseDetails = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('payers.userId', 'name email avatar')
      .populate('participants.userId', 'name email avatar');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    if (!verifyGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching expense details' });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    if (!verifyGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const memberIds = group.members.map(m => m.toString());
    const { description, category, amount, date, payers, splitType, participants, items } = req.body;

    const newAmount = amount !== undefined ? Number(amount) : expense.amount;
    const newPayers = payers || expense.payers;
    const newSplitType = splitType || expense.splitType;
    const newParticipants = participants || expense.participants;
    const newItems = items || expense.items;

    const validatedData = calculateExpenseShares({
      amount: newAmount,
      payers: newPayers,
      splitType: newSplitType,
      participants: newParticipants,
      items: newItems,
      allMemberIds: memberIds
    });

    expense.description = description !== undefined ? description : expense.description;
    expense.category = category !== undefined ? category : expense.category;
    expense.amount = newAmount;
    expense.date = date !== undefined ? date : expense.date;
    expense.payers = validatedData.payers;
    expense.splitType = newSplitType;
    expense.participants = validatedData.participants;
    expense.items = validatedData.items;

    await expense.save();

    await Activity.create({
      groupId: expense.groupId,
      user: req.user._id,
      actionType: 'EXPENSE_EDITED',
      description: `${req.user.name} edited "${expense.description}"`
    });

    const updated = await Expense.findById(expense._id)
      .populate('createdBy', 'name email avatar')
      .populate('payers.userId', 'name email avatar')
      .populate('participants.userId', 'name email avatar');

    res.json(updated);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(400).json({ message: error.message || 'Error updating expense' });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const group = await Group.findById(expense.groupId);
    if (!verifyGroupMember(group, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this group' });
    }

    const groupId = expense.groupId;
    const desc = expense.description;

    await expense.deleteOne();

    await Activity.create({
      groupId,
      user: req.user._id,
      actionType: 'EXPENSE_DELETED',
      description: `${req.user.name} deleted expense "${desc}"`
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error deleting expense' });
  }
};

module.exports = {
  createExpense,
  getGroupExpenses,
  getExpenseDetails,
  updateExpense,
  deleteExpense
};
