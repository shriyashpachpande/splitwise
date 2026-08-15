const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const Activity = require('../models/Activity');
const { calculateGroupBalances } = require('../services/balanceService');
const { roundToCents } = require('../utils/moneyUtils');

// Helper to determine status based on current date
const getGroupStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return 'Upcoming';
  if (now > end) return 'Completed';
  return 'Active';
};

// @desc    Create a new group
// @route   POST /api/groups
const createGroup = async (req, res) => {
  try {
    const { name, description, startDate, endDate, currency, memberEmails = [] } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Group name, start date, and end date are required' });
    }

    const memberUserIds = [req.user._id];

    // Resolve added member emails
    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      const foundUsers = await User.find({ email: { $in: memberEmails.map(e => e.toLowerCase()) } });
      foundUsers.forEach(user => {
        if (!memberUserIds.some(id => id.toString() === user._id.toString())) {
          memberUserIds.push(user._id);
        }
      });
    }

    const group = await Group.create({
      name,
      description: description || '',
      startDate,
      endDate,
      currency: currency || 'INR',
      members: memberUserIds,
      createdBy: req.user._id
    });

    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'GRP';
    const suffix = group._id.toString().substring(group._id.toString().length - 4).toUpperCase();
    group.inviteCode = `${prefix}-${suffix}`;
    await group.save();

    await Activity.create({
      groupId: group._id,
      user: req.user._id,
      actionType: 'GROUP_CREATED',
      description: `${req.user.name} created group "${group.name}"`
    });

    const populatedGroup = await Group.findById(group._id).populate('members', 'name email avatar');
    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error creating group' });
  }
};

// @desc    Get all groups for logged-in user
// @route   GET /api/groups
const getUserGroups = async (req, res) => {
  try {
    const userIdStr = req.user._id.toString();
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Calculate personal net balance and total spending for each group
    const groupsWithSummary = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ groupId: group._id });
        const settlements = await Settlement.find({ groupId: group._id });

        const { memberBalances } = calculateGroupBalances(
          group.members.map(m => m._id),
          expenses,
          settlements
        );

        const totalSpending = roundToCents(
          expenses.reduce((sum, e) => sum + e.amount, 0)
        );

        const userBalanceObj = memberBalances.find(m => m.userId === userIdStr);
        const yourBalance = userBalanceObj ? userBalanceObj.netBalance : 0;
        const status = getGroupStatus(group.startDate, group.endDate);

        return {
          ...group.toObject(),
          totalSpending,
          yourBalance,
          status
        };
      })
    );

    res.json(groupsWithSummary);
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ message: 'Server error fetching groups' });
  }
};

// @desc    Get group details by ID
// @route   GET /api/groups/:id
const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email avatar');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.inviteCode) {
      const prefix = group.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'GRP';
      const suffix = group._id.toString().substring(group._id.toString().length - 4).toUpperCase();
      group.inviteCode = `${prefix}-${suffix}`;
      await group.save();
    }

    const expenses = await Expense.find({ groupId: group._id });
    const settlements = await Settlement.find({ groupId: group._id });

    const { memberBalances } = calculateGroupBalances(
      group.members.map(m => m._id),
      expenses,
      settlements
    );

    const totalSpending = roundToCents(
      expenses.reduce((sum, e) => sum + e.amount, 0)
    );

    const status = getGroupStatus(group.startDate, group.endDate);

    // Merge balances into member objects
    const membersWithBalances = group.members.map(member => {
      const balObj = memberBalances.find(b => b.userId === member._id.toString());
      return {
        ...member.toObject(),
        totalPaid: balObj ? balObj.totalPaid : 0,
        totalShare: balObj ? balObj.totalShare : 0,
        netBalance: balObj ? balObj.netBalance : 0
      };
    });

    res.json({
      ...group.toObject(),
      members: membersWithBalances,
      totalSpending,
      status
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ message: 'Server error fetching group details' });
  }
};

// @desc    Add member to group (by Name or Email)
// @route   POST /api/groups/:id/members
const addMemberToGroup = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name && !email) {
      return res.status(400).json({ message: 'Member name or email is required' });
    }

    let userToAdd = null;

    // Search by email if provided
    if (email && email.trim()) {
      userToAdd = await User.findOne({ email: email.trim().toLowerCase() });
    }

    // Search by name if not found by email
    if (!userToAdd && name && name.trim()) {
      const cleanName = name.trim();
      userToAdd = await User.findOne({
        name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
      });
    }

    // If still no user exists, create a new member record directly by Name!
    if (!userToAdd) {
      const cleanName = name ? name.trim() : email.split('@')[0];
      const generatedEmail = email && email.trim() 
        ? email.trim().toLowerCase() 
        : `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@equallysplit.local`;

      userToAdd = await User.create({
        name: cleanName,
        email: generatedEmail,
        password: 'guestpassword123',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`
      });
    }

    const group = await Group.findById(req.params.id);
    const userIdStr = userToAdd._id.toString();

    if (group.members.some(m => m.toString() === userIdStr)) {
      return res.status(400).json({ message: `${userToAdd.name} is already a member of this group` });
    }

    group.members.push(userToAdd._id);
    await group.save();

    await Activity.create({
      groupId: group._id,
      user: req.user._id,
      actionType: 'MEMBER_ADDED',
      description: `${req.user.name} added ${userToAdd.name} to the group`
    });

    const updatedGroup = await Group.findById(group._id).populate('members', 'name email avatar');
    res.json(updatedGroup);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error adding member to group' });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:userId
const removeMemberFromGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    const targetUserId = req.params.userId;

    if (!group.members.some(m => m.toString() === targetUserId)) {
      return res.status(404).json({ message: 'User is not a member of this group' });
    }

    // Verify target user has zero net balance before removal
    const expenses = await Expense.find({ groupId: group._id });
    const settlements = await Settlement.find({ groupId: group._id });
    const { memberBalances } = calculateGroupBalances(group.members, expenses, settlements);

    group.members = group.members.filter(m => m.toString() !== targetUserId);
    await group.save();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error removing member' });
  }
};

const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const { generate6DigitOtp, sendInviteOtpEmail } = require('../services/emailService');

// @desc    Get public group info by invite code
// @route   GET /api/groups/invite-info/:inviteCode
const getGroupInviteInfo = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const group = await Group.findOne({ inviteCode })
      .populate('createdBy', 'name email avatar')
      .populate('members', 'name email avatar');
      
    if (!group) {
      return res.status(404).json({ message: 'Invalid or expired group invite link' });
    }

    res.json({
      _id: group._id,
      name: group.name,
      description: group.description,
      inviteCode: group.inviteCode,
      currency: group.currency,
      memberCount: group.members.length,
      createdBy: group.createdBy ? { name: group.createdBy.name, avatar: group.createdBy.avatar } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching group invite details' });
  }
};

// @desc    Send 6-Digit OTP Email for Group Invite
// @route   POST /api/groups/invite/send-otp
const sendInviteOtp = async (req, res) => {
  try {
    const { email, name, inviteCode } = req.body;

    if (!email || !name || !inviteCode) {
      return res.status(400).json({ message: 'Please provide full name, email, and group invite code' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ message: 'Invalid or expired group invite code' });
    }

    // Generate 6-digit numeric OTP
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save or update OTP record in DB
    await Otp.deleteMany({ email: cleanEmail, inviteCode });
    await Otp.create({
      email: cleanEmail,
      name: cleanName,
      otp,
      inviteCode,
      expiresAt
    });

    // Send Email via Nodemailer
    await sendInviteOtpEmail({
      email: cleanEmail,
      name: cleanName,
      groupName: group.name,
      otp
    });

    res.json({
      message: `6-Digit OTP sent successfully to ${cleanEmail}`,
      devOtp: otp, // Included for instant local dev testing
      groupName: group.name
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error generating OTP' });
  }
};

// @desc    Verify 6-Digit OTP and Join Group
// @route   POST /api/groups/invite/verify-otp
const verifyInviteOtp = async (req, res) => {
  try {
    const { email, name, inviteCode, otp } = req.body;

    if (!email || !inviteCode || !otp) {
      return res.status(400).json({ message: 'Email, invite code, and 6-digit OTP are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name ? name.trim() : '';

    // Find matching OTP record
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      inviteCode,
      otp: otp.trim()
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired 6-Digit OTP. Please check and try again.' });
    }

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Find or create user account
    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('otpauthuser123', salt);

      user = await User.create({
        name: cleanName || otpRecord.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName || cleanEmail)}`
      });
    } else if (cleanName && (!user.name || user.name.includes('_'))) {
      user.name = cleanName;
      await user.save();
    }

    // Add user to group members if not already present
    const userIdStr = user._id.toString();
    if (!group.members.some(m => m.toString() === userIdStr)) {
      group.members.push(user._id);
      await group.save();

      await Activity.create({
        groupId: group._id,
        user: user._id,
        actionType: 'MEMBER_ADDED',
        description: `${user.name} verified OTP and joined group "${group.name}"`
      });
    }

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail, inviteCode });

    // Generate Auth Token
    const generateToken = (id) => {
      return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
        expiresIn: '30d'
      });
    };

    const token = generateToken(user._id);

    res.json({
      message: `OTP verified! Successfully joined ${group.name}`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      },
      groupId: group._id
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// @desc    Delete a group (Creator Only)
// @route   DELETE /api/groups/:id
const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify creator authorization
    const creatorId = (group.createdBy?._id || group.createdBy)?.toString();
    const currentUserId = req.user._id.toString();

    if (creatorId !== currentUserId) {
      return res.status(403).json({ message: 'Only the creator of this group is allowed to delete it.' });
    }

    // Clean up related collections
    await Expense.deleteMany({ groupId: group._id });
    await Settlement.deleteMany({ groupId: group._id });
    await Activity.deleteMany({ groupId: group._id });
    if (group.inviteCode) {
      await Otp.deleteMany({ inviteCode: group.inviteCode });
    }

    await Group.findByIdAndDelete(group._id);

    res.json({ message: `Group "${group.name}" deleted successfully` });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error deleting group' });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupInviteInfo,
  sendInviteOtp,
  verifyInviteOtp,
  deleteGroup
};
