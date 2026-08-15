const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { generate6DigitOtp, sendRegisterOtpEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
    expiresIn: '30d'
  });
};

// @desc    Send 6-Digit OTP to Email for Registration
// @route   POST /api/auth/send-register-otp
const sendRegisterOtp = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Please provide both full name and email address' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check if user already registered with custom password
    const userExists = await User.findOne({ email: cleanEmail }).select('+password');
    if (userExists) {
      const isAutoUser = await bcrypt.compare('otpauthuser123', userExists.password) ||
                         await bcrypt.compare('guestpassword123', userExists.password);
      if (!isAutoUser) {
        return res.status(400).json({ message: 'An account already exists with this email address. Please sign in instead.' });
      }
    }

    // Generate 6-Digit OTP
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await Otp.deleteMany({ email: cleanEmail, inviteCode: 'REGISTER' });
    await Otp.create({
      email: cleanEmail,
      name: cleanName,
      otp,
      inviteCode: 'REGISTER',
      expiresAt
    });

    await sendRegisterOtpEmail({
      email: cleanEmail,
      name: cleanName,
      otp
    });

    res.json({
      message: `6-Digit verification OTP code has been sent to ${cleanEmail}`,
      devOtp: otp
    });
  } catch (error) {
    console.error('Send register OTP error:', error);
    res.status(500).json({ message: 'Server error generating registration OTP' });
  }
};

// @desc    Register a new user (Requires valid 6-digit OTP verification)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, avatar, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and 6-digit OTP code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    // Verify OTP code
    const otpRecord = await Otp.findOne({
      email: cleanEmail,
      inviteCode: 'REGISTER',
      otp: cleanOtp
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired 6-Digit OTP code. Please check your email and try again.' });
    }

    let userExists = await User.findOne({ email: cleanEmail }).select('+password');
    let user;

    if (userExists) {
      // If auto-created placeholder user from group invite, claim and upgrade password
      const isAutoUser = await bcrypt.compare('otpauthuser123', userExists.password) ||
                         await bcrypt.compare('guestpassword123', userExists.password);
      
      if (isAutoUser) {
        const salt = await bcrypt.genSalt(10);
        userExists.password = await bcrypt.hash(password, salt);
        userExists.name = name || userExists.name;
        if (avatar) userExists.avatar = avatar;
        user = await userExists.save();
      } else {
        return res.status(400).json({ message: 'An account already exists with this email' });
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = await User.create({
        name,
        email: cleanEmail,
        password: hashedPassword,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      });
    }

    // Clean up used OTP
    await Otp.deleteMany({ email: cleanEmail, inviteCode: 'REGISTER' });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Search users by name or email
// @route   GET /api/auth/search?query=...
const searchUsers = async (req, res) => {
  try {
    const query = req.query.query || '';
    if (!query.trim()) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('name email avatar').limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error searching users' });
  }
};

module.exports = {
  sendRegisterOtp,
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  searchUsers
};
