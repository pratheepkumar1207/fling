const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  // <video>/<img> tags can't set an Authorization header, so authenticated
  // streaming endpoints (e.g. /drive/stream/:fileId) are also reachable via
  // ?token=... on the URL. Prefer the header when both are present.
  const token = header ? header.replace('Bearer ', '') : req.query.token;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.userName = payload.name;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
