const express = require('express');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

// POST /kyc/submit
router.post('/submit', async (req, res) => {
  const { panNumber, bankAccountNumber, ifsc, accountHolderName } = req.body;
  if (!panNumber || !bankAccountNumber || !ifsc || !accountHolderName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const user = await User.findByPk(req.userId);
  user.panNumber = panNumber;
  user.bankAccountNumber = bankAccountNumber;
  user.ifsc = ifsc;
  user.accountHolderName = accountHolderName;
  user.kycStatus = 'pending';
  await user.save();

  // TODO: this is where you'd call a real KYC verification provider
  // (e.g. Cashfree Verification, Signzy, IDfy, or Karza) to validate the
  // PAN + bank account (penny-drop verification), then flip kycStatus
  // to 'verified' or 'rejected' via their webhook, and set kycVerified = true.

  res.json({ success: true, status: 'pending' });
});

// GET /kyc/status
router.get('/status', async (req, res) => {
  const user = await User.findByPk(req.userId);
  res.json({ status: user.kycStatus });
});

// --- Manual admin review endpoints (protect these behind an admin-only auth
// layer in production — e.g. a separate admin JWT scope or IP allowlist) ---

// POST /kyc/admin/:userId/approve
router.post('/admin/:userId/approve', async (req, res) => {
  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.kycStatus = 'verified';
  user.kycVerified = true;
  await user.save();
  res.json({ success: true });
});

// POST /kyc/admin/:userId/reject
router.post('/admin/:userId/reject', async (req, res) => {
  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.kycStatus = 'rejected';
  user.kycVerified = false;
  await user.save();
  res.json({ success: true });
});

module.exports = router;
