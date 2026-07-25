const express = require('express');
const router = express.Router();
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

// POST /calls/token — mint a short-lived Agora RTC token for a channel.
// Keeping this server-side means the App Certificate never ships in the app.
router.post('/token', (req, res) => {
  const { channelName, uid } = req.body;
  if (!channelName || uid === undefined) {
    return res.status(400).json({ error: 'channelName and uid are required' });
  }

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const expireSeconds = 3600; // 1 hour — reasonable for a watch-party session

  const currentTs = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTs + expireSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpireTs
  );

  res.json({ token, expiresAt: privilegeExpireTs });
});

module.exports = router;
