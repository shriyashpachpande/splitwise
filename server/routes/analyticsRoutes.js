const express = require('express');
const router = express.Router();
const {
  getGroupAnalyticsData,
  getGroupActivities
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { isGroupMember } = require('../middleware/groupAuthMiddleware');

router.use(protect);

router.get('/groups/:groupId/analytics', isGroupMember, getGroupAnalyticsData);
router.get('/groups/:groupId/activity', isGroupMember, getGroupActivities);

module.exports = router;
