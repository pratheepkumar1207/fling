const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sequelize = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const requireAuth = require('../middleware/requireAuth');
const { sendPushToUser } = require('../services/push');

// Constructed lazily (on first real use) rather than at module load, so a
// missing RAZORPAY_KEY_ID/SECRET doesn't crash the entire backend before
// you've had a chance to add real payment keys — it only affects the
// buy/verify routes below, which will return a clear error instead.
let razorpay = null;
function getRazorpay() {
  if (razorpay) return razorpay;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable buying coins.');
  }
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return razorpay;
}

const COINS_PER_RUPEE = parseFloat(process.env.COINS_PER_RUPEE_ON_BUY || '2');
const CASHOUT_FRACTION = parseFloat(process.env.CASHOUT_FRACTION_OF_BUY_RATE || '0.3333');
const MIN_CASHOUT_COINS = parseFloat(process.env.MIN_COINS_FOR_CASHOUT || '500');

router.use(requireAuth);

// GET /wallet/balance
router.get('/balance', async (req, res) => {
  const user = await User.findByPk(req.userId);
  res.json({ coinBalance: parseFloat(user.coinBalance) });
});

// POST /wallet/buy/order — create a Razorpay order for rupees -> coins
router.post('/buy/order', async (req, res) => {
  const { rupees } = req.body;
  if (!rupees || rupees <= 0) return res.status(400).json({ error: 'Invalid amount' });

  let razorpayClient;
  try {
    razorpayClient = getRazorpay();
  } catch (e) {
    return res.status(503).json({ error: e.message });
  }

  const order = await razorpayClient.orders.create({
    amount: Math.round(rupees * 100), // paise
    currency: 'INR',
    notes: { userId: req.userId, coins: rupees * COINS_PER_RUPEE },
  });

  // Record a pending transaction so we can reconcile if verify never comes back.
  await Transaction.create({
    userId: req.userId,
    type: 'buy',
    coins: rupees * COINS_PER_RUPEE,
    rupees,
    razorpayOrderId: order.id,
    status: 'pending',
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// POST /wallet/buy/verify — verify Razorpay signature, then credit coins atomically
router.post('/buy/verify', async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  const result = await sequelize.transaction(async (t) => {
    const txn = await Transaction.findOne({
      where: { razorpayOrderId: orderId, userId: req.userId, status: 'pending' },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!txn) throw new Error('Transaction not found or already processed');

    txn.status = 'completed';
    txn.razorpayPaymentId = paymentId;
    await txn.save({ transaction: t });

    const user = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    user.coinBalance = parseFloat(user.coinBalance) + parseFloat(txn.coins);
    await user.save({ transaction: t });

    return user.coinBalance;
  });

  res.json({ coinBalance: result });
});

// POST /wallet/gift — send coins to another user in a room
router.post('/gift', async (req, res) => {
  const { roomId, toUserId, coins } = req.body;
  if (!coins || coins <= 0) return res.status(400).json({ error: 'Invalid gift amount' });
  if (toUserId === req.userId) return res.status(400).json({ error: 'Cannot gift yourself' });

  try {
    await sequelize.transaction(async (t) => {
      const sender = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
      if (parseFloat(sender.coinBalance) < coins) throw new Error('Insufficient balance');

      const receiver = await User.findByPk(toUserId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!receiver) throw new Error('Recipient not found');

      sender.coinBalance = parseFloat(sender.coinBalance) - coins;
      receiver.coinBalance = parseFloat(receiver.coinBalance) + coins;
      await sender.save({ transaction: t });
      await receiver.save({ transaction: t });

      await Transaction.create(
        { userId: sender.id, type: 'gift_sent', coins, relatedRoomId: roomId, relatedUserId: toUserId, status: 'completed' },
        { transaction: t }
      );
      await Transaction.create(
        { userId: receiver.id, type: 'gift_received', coins, relatedRoomId: roomId, relatedUserId: sender.id, status: 'completed' },
        { transaction: t }
      );
    });

    // Broadcast to the room over sockets (see src/sockets/syncHandler.js)
    req.app.get('io').to(roomId).emit('gift:received', { fromName: req.userName, coins });

    // Also push-notify the recipient in case they've backgrounded the app
    // (e.g. switched tabs during a call, or the app was minimized).
    const receiver = await User.findByPk(toUserId);
    sendPushToUser(receiver, {
      title: 'You got a gift! 🎁',
      body: `${req.userName} sent you ${coins} coins`,
      data: { type: 'gift', roomId, coins: String(coins) },
    });

    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /wallet/cashout — request redemption of coins for rupees
// Gate this behind KYC in production; this endpoint only queues the request.
router.post('/cashout', async (req, res) => {
  const { coins } = req.body;
  if (!coins || coins < MIN_CASHOUT_COINS) {
    return res.status(400).json({ error: `Minimum cash-out is ${MIN_CASHOUT_COINS} coins` });
  }

  const user = await User.findByPk(req.userId);
  if (!user.kycVerified) {
    return res.status(403).json({ error: 'KYC verification required before cashing out' });
  }
  if (parseFloat(user.coinBalance) < coins) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const rupees = (coins / COINS_PER_RUPEE) * CASHOUT_FRACTION;

  await sequelize.transaction(async (t) => {
    const u = await User.findByPk(req.userId, { transaction: t, lock: t.LOCK.UPDATE });
    u.coinBalance = parseFloat(u.coinBalance) - coins;
    await u.save({ transaction: t });

    await Transaction.create(
      { userId: req.userId, type: 'cashout_requested', coins, rupees, status: 'pending' },
      { transaction: t }
    );
  });

  // Actual payout (bank transfer / UPI) should be handled by a manual or
  // automated payout job that flips the transaction to 'cashout_paid'.
  res.json({ success: true, rupeesQueued: rupees });
});

module.exports = router;
