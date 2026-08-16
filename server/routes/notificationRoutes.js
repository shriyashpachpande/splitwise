const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAllAsRead,
  markAsRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllAsRead);
router.put('/notifications/:id/read', protect, markAsRead);

module.exports = router;
