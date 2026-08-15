const express = require('express');
const router = express.Router();
const {
  createSettlement,
  getGroupSettlements,
  getGroupBalances,
  getGroupSimplifiedBalances
} = require('../controllers/settlementController');
const { protect } = require('../middleware/authMiddleware');
const { isGroupMember } = require('../middleware/groupAuthMiddleware');

router.use(protect);

router.post('/groups/:groupId/settlements', isGroupMember, createSettlement);
router.get('/groups/:groupId/settlements', isGroupMember, getGroupSettlements);
router.get('/groups/:groupId/balances', isGroupMember, getGroupBalances);
router.get('/groups/:groupId/simplified-balances', isGroupMember, getGroupSimplifiedBalances);

module.exports = router;
