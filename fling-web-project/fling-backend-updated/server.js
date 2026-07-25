require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const sequelize = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const walletRoutes = require('./src/routes/wallet');
const roomRoutes = require('./src/routes/room');
const callsRoutes = require('./src/routes/calls');
const driveRoutes = require('./src/routes/drive');
const kycRoutes = require('./src/routes/kyc');
const webhookRoutes = require('./src/routes/webhook');
const registerSyncHandlers = require('./src/sockets/syncHandler');

const app = express();
app.use(cors());

// Webhook routes need the RAW body for signature verification, so they're
// mounted with express.raw() BEFORE the global express.json() middleware.
app.use('/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Make io available to REST routes (used by wallet.js to broadcast gift events)
app.set('io', io);

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/rooms', roomRoutes);
app.use('/calls', callsRoutes);
app.use('/drive', driveRoutes);
app.use('/kyc', kycRoutes);

registerSyncHandlers(io);

const PORT = process.env.PORT || 4000;

sequelize.sync().then(() => {
  server.listen(PORT, () => console.log(`Fling backend running on port ${PORT}`));
});
