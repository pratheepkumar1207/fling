const { admin, ensureInitialized } = require('../config/firebaseAdmin');

/// Sends a push notification to a single user by their stored FCM token.
/// Safe to call even if the user has no token (no-op), and safe to call
/// even if Firebase isn't configured yet (logs and returns instead of
/// crashing — push notifications just won't go out until it is).
async function sendPushToUser(user, { title, body, data = {} }) {
  if (!user?.fcmToken) return;

  try {
    ensureInitialized();
    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data,
    });
  } catch (e) {
    console.error('Push send failed:', e.message);
    // Common cause: token expired/invalid — in production, catch the
    // specific "registration-token-not-registered" error and clear it
    // from the user record so you stop retrying a dead token.
  }
}

module.exports = { sendPushToUser };
