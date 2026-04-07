const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TripMember',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  date: {
    type: Date,
    default: Date.now
  },
  contributors: [{
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TripMember',
      required: true
    },
    shareAmount: {
      type: Number,
      required: true,
      min: 0
    }
  }]
});

module.exports = mongoose.model('Transaction', transactionSchema);
