const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const {
  getGroupItineraries,
  createItinerary,
  updateItinerary,
  toggleRSVP,
  deleteItinerary
} = require('../controllers/itineraryController');

// Specific Itinerary endpoints with protect middleware
router.get('/groups/:groupId/itineraries', protect, getGroupItineraries);
router.post('/groups/:groupId/itineraries', protect, createItinerary);
router.put('/itineraries/:id', protect, updateItinerary);
router.put('/itineraries/:id/rsvp', protect, toggleRSVP);
router.delete('/itineraries/:id', protect, deleteItinerary);

module.exports = router;
