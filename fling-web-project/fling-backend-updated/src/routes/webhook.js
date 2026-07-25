const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const sequelize = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

/// Safety net alongside /wallet/buy/verify: if a user pays but closes the
/// app before the client-side verify call completes, this webhook still
/// credits their coins. Configure this URL in the Razorpay dashboard under
/// Settings > Webhooks, subscribed to "payment.captured".
///
/// IMPORTANT: this route needs the raw request body for signature
/// verification, so it's mounted in server.js with express.raw(),
/// BEFORE the global express.json() middleware runs on other routes.
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw Buffer
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString());

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    try {
      await sequelize.transaction(async (t) => {
        const txn = await Transaction.findOne({
          where: { razorpayOrderId: orderId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        // Already credited by /wallet/buy/verify, or unknown order — skip.
        if (!txn || txn.status === 'completed') return;

        txn.status = 'completed';
        txn.razorpayPaymentId = paymentId;
        await txn.save({ transaction: t });

        const user = await User.findByPk(txn.userId, { transaction: t, lock: t.LOCK.UPDATE });
        user.coinBalance = parseFloat(user.coinBalance) + parseFloat(txn.coins);
        await user.save({ transaction: t });
      });
    } catch (e) {
      console.error('Webhook processing error:', e);
      // Still return 200 so Razorpay doesn't retry-storm us; log for manual reconciliation.
    }
  }

  res.json({ received: true });
});

module.exports = router;
