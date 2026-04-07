const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createTrip, getTrips, addMember, deleteTrip } = require('../controllers/tripController');
const { addTransaction, getTransactions, deleteTransaction, updateTransaction } = require('../controllers/transactionController');
const { getSettlement } = require('../controllers/settlementController');

// Trip Routes
router.route('/')
  .post(protect, createTrip)
  .get(protect, getTrips);

router.delete('/:trip_id', protect, deleteTrip);

// Member Routes
router.post('/:trip_id/members', protect, addMember);

// Transaction Routes
router.route('/:trip_id/transactions')
  .post(protect, addTransaction)
  .get(protect, getTransactions);

router.route('/:trip_id/transactions/:tx_id')
  .delete(protect, deleteTransaction)
  .put(protect, updateTransaction);

// Settlement Routes
router.get('/:trip_id/settlement', protect, getSettlement);

module.exports = router;
