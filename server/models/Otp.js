const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  inviteCode: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 600 // Automatically deletes document from MongoDB after 10 mins (600s)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Otp', otpSchema);
