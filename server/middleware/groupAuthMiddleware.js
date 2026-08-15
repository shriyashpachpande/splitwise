const Group = require('../models/Group');

const isGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.params.id;
    if (!groupId) {
      return res.status(400).json({ message: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const userIdStr = req.user._id.toString();
    const isMember = group.members.some(m => m.toString() === userIdStr);

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this group.' });
    }

    req.group = group;
    next();
  } catch (error) {
    console.error('Group member validation error:', error);
    res.status(500).json({ message: 'Server error checking group access' });
  }
};

module.exports = { isGroupMember };
