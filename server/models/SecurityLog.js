const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: [
      'FAILED_LOGIN',
      'ACCOUNT_LOCKED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'XSS_ATTEMPT_DETECTED',
      'PASSWORD_CHANGED'
    ],
    required: true
  },
  email: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: {
    type: String,
    default: 'Unknown'
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  details: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SecurityLog', securityLogSchema);
