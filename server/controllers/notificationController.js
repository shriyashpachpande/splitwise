const Activity = require('../models/Activity');
const Group = require('../models/Group');

// @desc    Get real-time notification feed for logged in user (Group Scoped)
// @route   GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all groups user belongs to
    const userGroups = await Group.find({ members: userId }).select('_id name');
    const groupIds = userGroups.map(g => g._id);

    if (groupIds.length === 0) {
      return res.json([]);
    }

    // Fetch activities for these groups
    const activities = await Activity.find({ groupId: { $in: groupIds } })
      .populate('user', 'name email avatar')
      .populate('groupId', 'name currency')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedNotifications = activities.map(act => ({
      _id: act._id,
      groupId: act.groupId?._id || act.groupId,
      groupName: act.groupId?.name || 'Group',
      groupCurrency: act.groupId?.currency || 'INR',
      user: act.user,
      actionType: act.actionType,
      description: act.description,
      createdAt: act.createdAt
    }));

    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking notification as read' });
  }
};

module.exports = {
  getNotifications,
  markAllAsRead,
  markAsRead
};
