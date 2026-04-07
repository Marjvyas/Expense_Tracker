const Transaction = require('../models/Transaction');
const Trip = require('../models/Trip');
const TripMember = require('../models/TripMember');

// @desc    Add a shared transaction
// @route   POST /api/trips/:trip_id/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const tripId = req.params.trip_id;
    const { description, amount, date, contributorMemberIds, payerId } = req.body;

    if (!description || !amount || !payerId) {
      return res.status(400).json({ message: 'Description, amount and payer are required' });
    }

    const trip = await Trip.findById(tripId).populate('members');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify requested payer is an actual member of this trip
    const payerMember = await TripMember.findOne({ trip: tripId, _id: payerId });
    if (!payerMember) {
      return res.status(403).json({ message: 'The selected payer is not a member of this trip' });
    }

    // Determine contributors
    let targetMembers = [];
    if (contributorMemberIds && contributorMemberIds.length > 0) {
      targetMembers = await TripMember.find({
        _id: { $in: contributorMemberIds },
        trip: tripId
      });
      if (targetMembers.length !== contributorMemberIds.length) {
        return res.status(400).json({ message: 'Some contributor IDs are invalid or not in this trip' });
      }
    } else {
      targetMembers = trip.members;
    }

    if (targetMembers.length === 0) {
      return res.status(400).json({ message: 'No valid contributors found' });
    }

    const shareAmount = Number((amount / targetMembers.length).toFixed(2));
    
    // Adjust logic to ensure exact total sums up to `amount`
    let totalShares = shareAmount * targetMembers.length;
    let remainder = Number((amount - totalShares).toFixed(2));

    const contributors = targetMembers.map((member, index) => {
      let finalShare = shareAmount;
      if (index === 0 && remainder !== 0) {
        finalShare = Number((finalShare + remainder).toFixed(2));
      }
      return {
        memberId: member._id,
        shareAmount: finalShare
      };
    });

    const transaction = await Transaction.create({
      trip: tripId,
      payer: payerMember._id, // Now a TripMember!
      description,
      amount,
      date: date || Date.now(),
      contributors
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all transactions for a trip
// @route   GET /api/trips/:trip_id/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const tripId = req.params.trip_id;

    const transactions = await Transaction.find({ trip: tripId })
      .populate('payer', 'nameInTrip') // Populating from TripMember instead of User
      .populate('contributors.memberId', 'nameInTrip');

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/trips/:trip_id/transactions/:tx_id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const { trip_id, tx_id } = req.params;

    const transaction = await Transaction.findOne({ _id: tx_id, trip: trip_id });
    if (!transaction) {
       return res.status(404).json({ message: 'Transaction not found or does not belong to this trip' });
    }

    await Transaction.deleteOne({ _id: tx_id });

    res.status(200).json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a transaction
// @route   PUT /api/trips/:trip_id/transactions/:tx_id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const { trip_id, tx_id } = req.params;
    const { description, amount, date, contributorMemberIds, payerId } = req.body;

    if (!description || !amount || !payerId) {
      return res.status(400).json({ message: 'Description, amount and payer are required' });
    }

    const trip = await Trip.findById(trip_id).populate('members');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const transaction = await Transaction.findOne({ _id: tx_id, trip: trip_id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const payerMember = await TripMember.findOne({ trip: trip_id, _id: payerId });
    if (!payerMember) {
      return res.status(403).json({ message: 'The selected payer is not a member of this trip' });
    }

    let targetMembers = [];
    if (contributorMemberIds && contributorMemberIds.length > 0) {
      targetMembers = await TripMember.find({
        _id: { $in: contributorMemberIds },
        trip: trip_id
      });
      if (targetMembers.length !== contributorMemberIds.length) {
        return res.status(400).json({ message: 'Some contributor IDs are invalid or not in this trip' });
      }
    } else {
      targetMembers = trip.members;
    }

    if (targetMembers.length === 0) {
      return res.status(400).json({ message: 'No valid contributors found' });
    }

    const shareAmount = Number((amount / targetMembers.length).toFixed(2));
    let totalShares = shareAmount * targetMembers.length;
    let remainder = Number((amount - totalShares).toFixed(2));

    const contributors = targetMembers.map((member, index) => {
      let finalShare = shareAmount;
      if (index === 0 && remainder !== 0) {
        finalShare = Number((finalShare + remainder).toFixed(2));
      }
      return {
        memberId: member._id,
        shareAmount: finalShare
      };
    });

    transaction.description = description;
    transaction.amount = amount;
    transaction.payer = payerMember._id;
    transaction.contributors = contributors;
    if (date) transaction.date = date;

    await transaction.save();

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction
};
