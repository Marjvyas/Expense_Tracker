const Transaction = require('../models/Transaction');
const Trip = require('../models/Trip');
const TripMember = require('../models/TripMember');

// @desc    Calculate and return settlement data
// @route   GET /api/trips/:trip_id/settlement
// @access  Private
const getSettlement = async (req, res) => {
  try {
    const tripId = req.params.trip_id;

    // Verify user is in trip and trip exists
    const trip = await Trip.findById(tripId).select('title owner');
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const isOwner = trip.owner && trip.owner.toString() === req.user._id.toString();
    const isMember = await TripMember.findOne({ trip: tripId, user: req.user._id });
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized for this trip' });
    }

    const members = await TripMember.find({ trip: tripId });
    const transactions = await Transaction.find({ trip: tripId });

    // Step 1: Calculate Net Position per Member
    // Initialize balances map
    const balances = {};
    members.forEach(m => {
      balances[m._id.toString()] = {
        memberId: m._id,
        name: m.nameInTrip,
        netPosition: 0
      };
    });

    // Calculate (Total Individual Expense - Total Money Sent)
    // Note: If user is payer, they "sent" money (net position decreases).
    // If user is contributor, they incurred "expense" (net position increases).
    transactions.forEach(t => {
      if (balances[t.payer.toString()]) {
        balances[t.payer.toString()].netPosition -= t.amount;
      }

      t.contributors.forEach(c => {
        if (balances[c.memberId.toString()]) {
          balances[c.memberId.toString()].netPosition += c.shareAmount;
        }
      });
    });

    // Formatting net positions
    const net_positions = [];
    const debtors = [];
    const creditors = [];

    Object.values(balances).forEach(b => {
      const net = Number(b.netPosition.toFixed(2));
      let action = 'settled';
      
      if (net > 0) {
        action = 'send';
        debtors.push({ ...b, net });
      } else if (net < 0) {
        action = 'take';
        creditors.push({ ...b, net: Math.abs(net) }); // Store positive absolute value for creditors
      }

      net_positions.push({
        member_id: b.memberId,
        name: b.name,
        net: net,
        action
      });
    });

    // Step 2: Generate Direct Payment Paths (Debt Simplification)
    // Sort debtors descending (highest amount to send first)
    debtors.sort((a, b) => b.net - a.net);
    // Sort creditors descending (highest absolute amount to receive first)
    creditors.sort((a, b) => b.net - a.net);

    const payment_paths = [];
    let i = 0; // index for debtors
    let j = 0; // index for creditors

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // Payment amount is the minimum of debtor's debt or creditor's credit
      const minAmount = Math.min(debtor.net, creditor.net);
      
      // We only care about cents up to 2 decimals
      const amount = Number(minAmount.toFixed(2));

      if (amount > 0) {
        payment_paths.push({
          from: debtor.name,
          to: creditor.name,
          amount: amount
        });
      }

      // Update remaining amounts
      debtor.net -= amount;
      creditor.net -= amount;
      
      // Fix tiny JS float issues before checking zero
      debtor.net = Number(debtor.net.toFixed(2));
      creditor.net = Number(creditor.net.toFixed(2));

      if (debtor.net === 0) i++;
      if (creditor.net === 0) j++;
    }

    res.status(200).json({
      trip_id: trip._id,
      title: trip.title,
      net_positions,
      payment_paths
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSettlement
};
