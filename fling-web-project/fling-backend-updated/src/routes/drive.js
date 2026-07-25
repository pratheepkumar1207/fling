const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const requireAuth = require('../middleware/requireAuth');

// TODO: set up a Google Cloud service account with Drive API access, and
// either share the relevant Drive files/folder with the service account's
// email, or use domain-wide delegation if these are Workspace files.
//
// Two ways to supply the key, same pattern as firebaseAdmin.js:
//   - DRIVE_SERVICE_ACCOUNT_JSON env var (whole JSON file's contents,
//     single line) — use this on Railway/any host without the file committed
//   - a local driveServiceAccount.json file (gitignored) for local dev
const auth = new google.auth.GoogleAuth(
  process.env.DRIVE_SERVICE_ACCOUNT_JSON
    ? {
        credentials: JSON.parse(process.env.DRIVE_SERVICE_ACCOUNT_JSON),
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      }
    : {
        keyFile: './driveServiceAccount.json',
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      }
);
const drive = google.drive({ version: 'v3', auth });

router.use(requireAuth);

// GET /drive/stream/:fileId
// Streams the file through our server instead of exposing a public Drive
// link — this is what lets you use private ("restricted") Drive files
// and avoids Drive's public-download quota limits.
router.get('/stream/:fileId', async (req, res) => {
  const { fileId } = req.params;

  try {
    const metaRes = await drive.files.get({ fileId, fields: 'mimeType,size,name' });
    const { mimeType, size } = metaRes.data;

    res.setHeader('Content-Type', mimeType || 'video/mp4');
    if (size) res.setHeader('Content-Length', size);
    res.setHeader('Accept-Ranges', 'bytes');

    // Support range requests so seeking/scrubbing works properly.
    const range = req.headers.range;
    const requestOptions = range ? { headers: { Range: range } } : {};

    const fileRes = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream', ...requestOptions }
    );

    fileRes.data
      .on('error', (err) => {
        console.error('Drive stream error:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (e) {
    console.error(e);
    res.status(404).json({ error: 'File not found or not accessible to service account' });
  }
});

module.exports = router;
