const admin = require('firebase-admin');

// TODO: download a service account key from Firebase Console
// (Project Settings > Service Accounts > Generate new private key),
// save it as serviceAccountKey.json in this folder, and keep it out of git.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../../serviceAccountKey.json')),
  });
}

module.exports = admin;
