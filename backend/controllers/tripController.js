const Trip = require('../models/Trip');
const TripMember = require('../models/TripMember');
const User = require('../models/User');

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Please provide a title for the trip' });
    }

    // Create the trip
    const trip = await Trip.create({
      title,
      owner: req.user._id,
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all trips for user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    // Find all TripMembers matching the current user
    const memberships = await TripMember.find({ user: req.user._id });
    const tripIds = memberships.map(m => m.trip);

    const trips = await Trip.find({
      $or: [
        { owner: req.user._id },
        { _id: { $in: tripIds } }
      ]
    })
      .populate({
        path: 'members',
        select: 'nameInTrip user',
      });

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add member to a trip
// @route   POST /api/trips/:trip_id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const tripId = req.params.trip_id;
    const { userId, name } = req.body; // Either userId or name to create a shadow member

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const isOwner = trip.owner.toString() === req.user._id.toString();
    const isMember = await TripMember.findOne({ trip: tripId, user: req.user._id });
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to add members to this trip' });
    }

    let memberData = {
      trip: trip._id,
    };

    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const existingMember = await TripMember.findOne({ trip: tripId, user: userId });
      if (existingMember) {
        return res.status(400).json({ message: 'User is already a member of this trip' });
      }

      memberData.user = user._id;
      memberData.nameInTrip = user.name;
    } else if (name) {
      memberData.nameInTrip = name;
    } else {
      return res.status(400).json({ message: 'Please provide either userId or name' });
    }

    const newMember = await TripMember.create(memberData);

    trip.members.push(newMember._id);
    await trip.save();

    res.status(201).json(newMember);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a trip
// @route   DELETE /api/trips/:trip_id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const tripId = req.params.trip_id;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify ownership
    if (trip.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the trip owner can delete it' });
    }

    // Delete cascading references
    const Transaction = require('../models/Transaction'); // Require locally to avoid cyclic dependency if possible or use standard require
    await TripMember.deleteMany({ trip: tripId });
    await Transaction.deleteMany({ trip: tripId });
    await trip.deleteOne();

    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTrip,
  getTrips,
  addMember,
  deleteTrip
};
