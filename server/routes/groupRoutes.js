const express = require('express');
const router = express.Router();
const {
  createGroup,
  getUserGroups,
  getGroupDetails,
  addMemberToGroup,
  removeMemberFromGroup,
  getGroupInviteInfo,
  sendInviteOtp,
  verifyInviteOtp,
  deleteGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/authMiddleware');
const { isGroupMember } = require('../middleware/groupAuthMiddleware');

// Public Group Invite & 6-Digit OTP Routes (No Auth Needed)
router.get('/invite-info/:inviteCode', getGroupInviteInfo);
router.post('/invite/send-otp', sendInviteOtp);
router.post('/invite/verify-otp', verifyInviteOtp);

// Protected Routes (Auth Token Required)
router.use(protect);

router.route('/')
  .post(createGroup)
  .get(getUserGroups);

router.route('/:id')
  .get(isGroupMember, getGroupDetails)
  .delete(isGroupMember, deleteGroup);

router.post('/:id/members', isGroupMember, addMemberToGroup);
router.delete('/:id/members/:userId', isGroupMember, removeMemberFromGroup);

module.exports = router;
