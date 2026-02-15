'use strict';

const winston = require('winston');
const path = require('path');
const env = require('../config/env');

const logDir = env.LOG_DIR;

// Format personnalisé : timestamp + level + message (sans données sensibles)
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      // Filtrer les données sensibles
      const safeMeta = { ...meta };
      const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'authorization'];
      sensitiveKeys.forEach((key) => {
        if (safeMeta[key]) safeMeta[key] = '[REDACTED]';
      });
      log += ` ${JSON.stringify(safeMeta)}`;
    }
    return log;
  }),
);

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'govcom-api' },
  transports: [
    // Console — toujours actif
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat,
      ),
    }),

    // Fichier erreurs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Fichier combiné
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  // Ne pas quitter sur les erreurs non gérées
  exitOnError: false,
});

// Stream pour morgan (si besoin HTTP logging)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
