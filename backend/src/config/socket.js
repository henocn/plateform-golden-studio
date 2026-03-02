'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');
const logger = require('../utils/logger');


// ═══════════════════════════════════════════════════
//            Socket.IO Configuration
// ═══════════════════════════════════════════════════


/* Initialise Socket.IO sur le serveur HTTP */
function initSocketIO(httpServer) {
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  /* Authentification JWT sur la connexion WebSocket */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id || decoded.sub;
      return next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket;
    logger.debug(`WS connected: user=${userId} socket=${socket.id}`);

    socket.join(`user:${userId}`);

    socket.on('disconnect', (reason) => {
      logger.debug(`WS disconnected: user=${userId} reason=${reason}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

module.exports = { initSocketIO };
