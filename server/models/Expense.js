const mongoose = require('mongoose');

const payerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payer amount cannot be negative']
  }
}, { _id: false });

const participantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareAmount: {
    type: Number,
    required: true,
    min: [0, 'Share amount cannot be negative']
  }
}, { _id: false });

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Item price cannot be negative']
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    enum: [
      'Food',
      'Travel',
      'Hotel',
      'Tickets',
      'Music',
      'Entertainment',
      'Shopping',
      'Fuel',
      'Drinks',
      'Activities',
      'Other'
    ],
    default: 'Other'
  },
  amount: {
    type: Number,
    required: [true, 'Total expense amount is required'],
    min: [0.01, 'Expense amount must be positive']
  },
  date: {
    type: Date,
    default: Date.now
  },
  payers: [payerSchema],
  splitType: {
    type: String,
    enum: ['EQUAL', 'UNEQUAL', 'ITEM_WISE'],
    required: true
  },
  participants: [participantSchema],
  items: [itemSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
