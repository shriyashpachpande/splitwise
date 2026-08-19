const mongoose = require('mongoose');
const Itinerary = require('../models/Itinerary');
const Group = require('../models/Group');

// @desc    Get all itinerary items for a group
// @route   GET /api/groups/:groupId/itineraries
// @access  Private
exports.getGroupItineraries = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid Group ID' });
    }

    // Check if group exists and user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => (m._id || m).toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to access group itinerary' });
    }

    const itineraries = await Itinerary.find({ groupId })
      .populate('createdBy', 'name email avatar')
      .populate('confirmedMembers', 'name email avatar')
      .sort({ date: 1, startTime: 1 });

    res.json(itineraries);
  } catch (error) {
    console.error('Error fetching group itineraries:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create new itinerary item
// @route   POST /api/groups/:groupId/itineraries
// @access  Private
exports.createItinerary = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: 'Invalid Group ID' });
    }

    const {
      title,
      description,
      location,
      date,
      startDate,
      endDate,
      startTime,
      endTime,
      category,
      estimatedCost
    } = req.body;

    const sDate = startDate || date || new Date().toISOString().split('T')[0];
    const eDate = endDate || sDate;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => (m._id || m).toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to add plans to this group' });
    }

    const itinerary = await Itinerary.create({
      groupId,
      title,
      description: description || '',
      location: location || '',
      date: sDate,
      startDate: sDate,
      endDate: eDate,
      startTime: startTime || '',
      endTime: endTime || '',
      category: category || 'ACTIVITY',
      status: 'UPCOMING',
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      createdBy: req.user._id,
      confirmedMembers: [req.user._id]
    });

    const populated = await Itinerary.findById(itinerary._id)
      .populate('createdBy', 'name email avatar')
      .populate('confirmedMembers', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating itinerary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update itinerary item / status
// @route   PUT /api/itineraries/:id
// @access  Private
exports.updateItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Itinerary ID' });
    }

    let itinerary = await Itinerary.findById(id);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }

    const {
      title,
      description,
      location,
      date,
      startDate,
      endDate,
      startTime,
      endTime,
      category,
      status,
      estimatedCost
    } = req.body;

    if (title !== undefined) itinerary.title = title;
    if (description !== undefined) itinerary.description = description;
    if (location !== undefined) itinerary.location = location;
    if (date !== undefined) itinerary.date = date;
    if (startDate !== undefined) itinerary.startDate = startDate;
    if (endDate !== undefined) itinerary.endDate = endDate;
    if (startTime !== undefined) itinerary.startTime = startTime;
    if (endTime !== undefined) itinerary.endTime = endTime;
    if (category !== undefined) itinerary.category = category;
    if (status !== undefined) itinerary.status = status;
    if (estimatedCost !== undefined) itinerary.estimatedCost = Number(estimatedCost);

    await itinerary.save();

    const updated = await Itinerary.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('confirmedMembers', 'name email avatar');

    res.json(updated);
  } catch (error) {
    console.error('Error updating itinerary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Toggle user attendance RSVP ("I'm Going 👍")
// @route   PUT /api/itineraries/:id/rsvp
// @access  Private
exports.toggleRSVP = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Itinerary ID' });
    }

    const itinerary = await Itinerary.findById(id);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }

    const isAttending = itinerary.confirmedMembers.some(
      (mId) => mId.toString() === userId.toString()
    );

    if (isAttending) {
      itinerary.confirmedMembers = itinerary.confirmedMembers.filter(
        (mId) => mId.toString() !== userId.toString()
      );
    } else {
      itinerary.confirmedMembers.push(userId);
    }

    await itinerary.save();

    const updated = await Itinerary.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('confirmedMembers', 'name email avatar');

    res.json(updated);
  } catch (error) {
    console.error('Error toggling RSVP:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete itinerary item
// @route   DELETE /api/itineraries/:id
// @access  Private
exports.deleteItinerary = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Itinerary ID' });
    }

    const itinerary = await Itinerary.findById(id);
    if (!itinerary) {
      return res.status(404).json({ message: 'Itinerary item not found' });
    }

    await itinerary.deleteOne();
    res.json({ message: 'Itinerary item removed successfully' });
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
