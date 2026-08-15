const Expense = require('../models/Expense');
const Activity = require('../models/Activity');
const { computeGroupAnalytics } = require('../services/analyticsService');

// @desc    Get category analytics and spending metrics for a group
// @route   GET /api/groups/:groupId/analytics
const getGroupAnalyticsData = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await Expense.find({ groupId });

    const analytics = computeGroupAnalytics(expenses, req.user._id);
    res.json(analytics);
  } catch (error) {
    console.error('Get group analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

// @desc    Get activity feed for a group
// @route   GET /api/groups/:groupId/activity
const getGroupActivities = async (req, res) => {
  try {
    const { groupId } = req.params;
    const activities = await Activity.find({ groupId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching activity feed' });
  }
};

module.exports = {
  getGroupAnalyticsData,
  getGroupActivities
};
