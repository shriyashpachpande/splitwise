const express = require('express');
const router = express.Router();
const {
  sendRegisterOtp,
  registerUser,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPasswordWithOtp,
  loginUser,
  getUserProfile,
  updateUserProfile,
  searchUsers
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/send-register-otp', sendRegisterOtp);
router.post('/register', registerUser);
router.post('/send-forgot-password-otp', sendForgotPasswordOtp);
router.post('/verify-forgot-password-otp', verifyForgotPasswordOtp);
router.post('/reset-password-with-otp', resetPasswordWithOtp);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);
router.put('/me', protect, updateUserProfile);
router.get('/search', protect, searchUsers);

module.exports = router;
