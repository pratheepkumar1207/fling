const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const requireAuth = require('../middleware/requireAuth');

router.use(requireAuth);

router.post('/', async (req, res) => {
  const { title, sourceType, videoUrl } = req.body;
  const room = await Room.create({ hostId: req.userId, title, sourceType, videoUrl });
  res.json(room);
});

router.post('/:id/join', async (req, res) => {
  const room = await Room.findByPk(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

router.get('/:id', async (req, res) => {
  const room = await Room.findByPk(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

module.exports = router;
