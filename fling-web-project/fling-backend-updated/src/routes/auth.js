const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { admin, ensureInitialized } = require('../config/firebaseAdmin');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

// POST /auth/firebase — verify a Firebase ID token (from phone OTP sign-in),
// find-or-create the matching User row, and issue our own JWT.
router.post('/firebase', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    ensureInitialized();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const phone = decoded.phone_number;
    if (!phone) return res.status(400).json({ error: 'Token has no phone number' });

    let user = await User.findOne({ where: { phone } });
    let isNewUser = false;
    if (!user) {
      user = await User.create({ name: 'New User', phone });
      isNewUser = true;
    }

    const token = jwt.sign(
      { userId: user.id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      isNewUser,
      user: { id: user.id, name: user.name, phone: user.phone, coinBalance: user.coinBalance },
    });
  } catch (e) {
    res.status(401).json({ error: e.message || 'Invalid Firebase token' });
  }
});

// POST /auth/dev-login — TEST-ONLY bypass of Firebase phone verification.
// Disabled unless ALLOW_DEV_LOGIN=true, and only works for phone numbers
// listed in DEV_LOGIN_PHONES (comma-separated, e.g. "+918220785431"). This
// exists purely so you can exercise the app before Firebase is wired up —
// remove/disable it before going live with real users.
router.post('/dev-login', async (req, res) => {
  if (process.env.ALLOW_DEV_LOGIN !== 'true') {
    return res.status(403).json({ error: 'Dev login is disabled' });
  }
  const { phone } = req.body;
  const allowed = (process.env.DEV_LOGIN_PHONES || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!phone || !allowed.includes(phone)) {
    return res.status(403).json({ error: 'This phone number is not enabled for dev login' });
  }

  let user = await User.findOne({ where: { phone } });
  let isNewUser = false;
  if (!user) {
    user = await User.create({ name: 'Test User', phone });
    isNewUser = true;
  }

  const token = jwt.sign(
    { userId: user.id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    token,
    isNewUser,
    user: { id: user.id, name: user.name, phone: user.phone, coinBalance: user.coinBalance },
  });
});

router.use(requireAuth);

// PATCH /auth/me — update profile (e.g. display name after first sign-in)
router.patch('/me', async (req, res) => {
  const { name } = req.body;
  const user = await User.findByPk(req.userId);
  if (name) user.name = name;
  await user.save();
  res.json({ id: user.id, name: user.name, phone: user.phone });
});

// POST /auth/fcm-token — register/refresh this device's push token
router.post('/fcm-token', async (req, res) => {
  const { fcmToken } = req.body;
  const user = await User.findByPk(req.userId);
  user.fcmToken = fcmToken;
  await user.save();
  res.json({ success: true });
});

module.exports = router;
