const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const SecurityLog = require('../models/SecurityLog');
const { generate6DigitOtp, sendRegisterOtpEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_12345', {
    expiresIn: '30d'
  });
};

// Send JWT Token response in both HttpOnly Cookie & JSON payload
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token
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

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (With Account Lockout Security Policy)
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');
    if (!user) {
      // Security Log for invalid email login
      await SecurityLog.create({
        eventType: 'FAILED_LOGIN',
        email: cleanEmail,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        details: 'Login attempted with unregistered email address'
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 1. SECURITY LOCKOUT CHECK: Is the account locked due to too many failed attempts?
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMs = user.lockUntil.getTime() - Date.now();
      const remainingMins = Math.ceil(remainingMs / (60 * 1000));

      await SecurityLog.create({
        eventType: 'ACCOUNT_LOCKED',
        email: cleanEmail,
        userId: user._id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        details: `Blocked login attempt on locked account. Lock expires in ${remainingMins} mins`
      });

      return res.status(423).json({
        message: `Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in ${remainingMins} minute(s).`
      });
    }

    // 2. PASSWORD CHECK
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed login counter
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Lock account if failed attempts hit 5
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        await user.save();

        await SecurityLog.create({
          eventType: 'ACCOUNT_LOCKED',
          email: cleanEmail,
          userId: user._id,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          details: 'Account locked for 15 minutes after 5 consecutive failed login attempts'
        });

        return res.status(423).json({
          message: 'Account has been locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }

      await user.save();

      await SecurityLog.create({
        eventType: 'FAILED_LOGIN',
        email: cleanEmail,
        userId: user._id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown',
        details: `Incorrect password attempt ${user.failedLoginAttempts}/5`
      });

      const attemptsRemaining = 5 - user.failedLoginAttempts;
      return res.status(401).json({
        message: `Invalid password. ${attemptsRemaining} attempt(s) remaining before account lockout.`
      });
    }

    // 3. SUCCESSFUL LOGIN: Reset lockout counters
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
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
    sendTokenResponse(updatedUser, 200, res);
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
