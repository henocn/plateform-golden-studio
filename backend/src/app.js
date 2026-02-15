'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');

const app = express();

// ─── Security Headers ────────────────────────────────────────
app.use(helmet());

// ─── CORS ────────────────────────────────────────────────────
const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Rate Limiting (global) ─────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
      details: [],
    },
  },
});
app.use(globalLimiter);

// ─── Body Parsers ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Swagger Documentation ──────────────────────────────────
if (env.SWAGGER_ENABLED) {
  app.use(
    `${env.API_PREFIX}/api-docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'GovCom Platform — API Docs',
    }),
  );
  logger.info(`Swagger docs available at ${env.API_PREFIX}/api-docs`);
}

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    },
    message: 'Server is running',
  });
});

// ─── API Routes ──────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
require('./modules/auth/auth.swagger'); // Load swagger JSDoc comments
app.use(`${env.API_PREFIX}/auth`, authRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist.',
      details: [],
    },
  });
});

// ─── Global Error Handler ────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(err.message, { stack: err.stack });

  // ApiError (erreur métier)
  if (err.isOperational) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Erreur Sequelize validation
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors ? err.errors.map((e) => ({ field: e.path, message: e.message })) : [];
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Database validation error',
        details,
      },
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
        details: [],
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        details: [],
      },
    });
  }

  // Erreur inattendue (500)
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      details: [],
    },
  });
});

module.exports = app;
