const admin = require('firebase-admin');

// Firebase is only initialized the first time it's actually needed (i.e. the
// first real /auth/firebase request), not at server startup. That means a
// missing/unset credential doesn't crash the whole backend — it only affects
// real phone-OTP login, while everything else (including the dev-login test
// bypass) keeps working normally.
let initialized = false;

function ensureInitialized() {
  if (initialized) return;

  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
  } else {
    try {
      // eslint-disable-next-line global-require
      credential = admin.credential.cert(require('../../serviceAccountKey.json'));
    } catch {
      throw new Error(
        'Firebase is not configured — set FIREBASE_SERVICE_ACCOUNT_JSON (or add serviceAccountKey.json locally) to enable real phone login.'
      );
    }
  }

  admin.initializeApp({ credential });
  initialized = true;
}

module.exports = { admin, ensureInitialized };
