const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: [
      'GROUP_CREATED',
      'MEMBER_ADDED',
      'EXPENSE_ADDED',
      'EXPENSE_EDITED',
      'EXPENSE_DELETED',
      'SETTLEMENT_CREATED'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);
