const mongoose = require('mongoose');

const itinerarySchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please add an activity title'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: String,
      required: [true, 'Please select a date']
    },
    startDate: {
      type: String,
      default: ''
    },
    endDate: {
      type: String,
      default: ''
    },
    startTime: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      enum: ['FOOD', 'ACTIVITY', 'TRAVEL', 'STAY', 'SHOPPING', 'OTHER'],
      default: 'ACTIVITY'
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'UPCOMING'
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    confirmedMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Itinerary', itinerarySchema);
