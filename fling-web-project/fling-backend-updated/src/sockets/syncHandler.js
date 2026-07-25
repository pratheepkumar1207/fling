/// Relays playback sync and chat events to everyone else in the room.
/// Gifting is intentionally NOT handled here — coin movements go through
/// the REST /wallet/gift endpoint so they hit the DB transaction + ledger;
/// this file only re-broadcasts the result via req.app.get('io') in wallet.js.
// In-memory only (roomId -> Map(userId -> name)). Fine for presence, which
// doesn't need to survive a restart; the DB is not touched here.
const rosters = new Map();

function rosterList(roomId) {
  const roster = rosters.get(roomId);
  return roster ? Array.from(roster, ([userId, name]) => ({ userId, name })) : [];
}

module.exports = function registerSyncHandlers(io) {
  io.on('connection', (socket) => {
    const { userId } = socket.handshake.query;
    let currentRoomId = null;

    socket.on('room:join', ({ roomId, name }) => {
      socket.join(roomId);
      currentRoomId = roomId;
      if (!rosters.has(roomId)) rosters.set(roomId, new Map());
      rosters.get(roomId).set(userId, name || 'Guest');
      io.to(roomId).emit('presence:roster', rosterList(roomId));
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);
      rosters.get(roomId)?.delete(userId);
      io.to(roomId).emit('presence:roster', rosterList(roomId));
    });

    for (const event of ['playback:play', 'playback:pause', 'playback:seek']) {
      socket.on(event, ({ roomId, position }) => {
        socket.to(roomId).emit(event, { position, userId });
      });
    }

    socket.on('chat:message', ({ roomId, senderId, text }) => {
      io.to(roomId).emit('chat:message', { senderId, text, ts: Date.now() });
    });

    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      rosters.get(currentRoomId)?.delete(userId);
      io.to(currentRoomId).emit('presence:roster', rosterList(currentRoomId));
    });
  });
};
