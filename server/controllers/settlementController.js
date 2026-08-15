const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { validateSettlement } = require('../services/settlementService');
const { calculateGroupBalances } = require('../services/balanceService');
const { simplifyBalances } = require('../services/balanceSimplificationService');

// @desc    Create a settlement (Settle Up)
// @route   POST /api/groups/:groupId/settlements
const createSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { fromUser, toUser, amount, date, note } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const validated = validateSettlement({
      fromUser: fromUser || req.user._id,
      toUser,
      amount: Number(amount),
      memberIds: group.members
    });

    const settlement = await Settlement.create({
      groupId,
      fromUser: validated.fromUser,
      toUser: validated.toUser,
      amount: validated.amount,
      date: date || new Date(),
      note: note || '',
      createdBy: req.user._id
    });

    const payer = await User.findById(validated.fromUser);
    const recipient = await User.findById(validated.toUser);

    await Activity.create({
      groupId,
      user: req.user._id,
      actionType: 'SETTLEMENT_CREATED',
      description: `${payer ? payer.name : 'A member'} paid ${recipient ? recipient.name : 'a member'} ₹${validated.amount.toFixed(2)}`
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(400).json({ message: error.message || 'Error creating settlement' });
  }
};

// @desc    Get all settlements for a group
// @route   GET /api/groups/:groupId/settlements
const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;
    const settlements = await Settlement.find({ groupId })
      .populate('fromUser', 'name email avatar')
      .populate('toUser', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ date: -1, createdAt: -1 });

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching settlements' });
  }
};

// @desc    Get raw group balances & raw debts
// @route   GET /api/groups/:groupId/balances
const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'name email avatar');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ groupId });
    const settlements = await Settlement.find({ groupId });

    const memberIds = group.members.map(m => m._id);
    const { memberBalances, rawDebts, invariantPassed } = calculateGroupBalances(memberIds, expenses, settlements);

    // Populate user info in rawDebts
    const populatedDebts = rawDebts.map(debt => {
      const fromMember = group.members.find(m => m._id.toString() === debt.fromUser);
      const toMember = group.members.find(m => m._id.toString() === debt.toUser);
      return {
        fromUser: fromMember ? { _id: fromMember._id, name: fromMember.name, avatar: fromMember.avatar } : debt.fromUser,
        toUser: toMember ? { _id: toMember._id, name: toMember.name, avatar: toMember.avatar } : debt.toUser,
        amount: debt.amount
      };
    });

    const populatedBalances = memberBalances.map(bal => {
      const memberObj = group.members.find(m => m._id.toString() === bal.userId);
      return {
        user: memberObj ? { _id: memberObj._id, name: memberObj.name, email: memberObj.email, avatar: memberObj.avatar } : bal.userId,
        totalPaid: bal.totalPaid,
        totalShare: bal.totalShare,
        netBalance: bal.netBalance
      };
    });

    res.json({
      memberBalances: populatedBalances,
      debts: populatedDebts,
      invariantPassed
    });
  } catch (error) {
    console.error('Get group balances error:', error);
    res.status(500).json({ message: 'Server error fetching group balances' });
  }
};

// @desc    Get simplified balances for group
// @route   GET /api/groups/:groupId/simplified-balances
const getGroupSimplifiedBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate('members', 'name email avatar');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const expenses = await Expense.find({ groupId });
    const settlements = await Settlement.find({ groupId });

    const memberIds = group.members.map(m => m._id);
    const { memberBalances } = calculateGroupBalances(memberIds, expenses, settlements);

    const simplifiedTx = simplifyBalances(memberBalances);

    // Populate user profiles in simplified transactions
    const populatedTx = simplifiedTx.map(tx => {
      const fromMember = group.members.find(m => m._id.toString() === tx.fromUser);
      const toMember = group.members.find(m => m._id.toString() === tx.toUser);
      return {
        fromUser: fromMember ? { _id: fromMember._id, name: fromMember.name, avatar: fromMember.avatar } : tx.fromUser,
        toUser: toMember ? { _id: toMember._id, name: toMember.name, avatar: toMember.avatar } : tx.toUser,
        amount: tx.amount
      };
    });

    res.json({
      simplifiedTransactions: populatedTx
    });
  } catch (error) {
    console.error('Get simplified balances error:', error);
    res.status(500).json({ message: 'Server error computing simplified balances' });
  }
};

module.exports = {
  createSettlement,
  getGroupSettlements,
  getGroupBalances,
  getGroupSimplifiedBalances
};
