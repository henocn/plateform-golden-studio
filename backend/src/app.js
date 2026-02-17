'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler.middleware');

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
// const globalLimiter = rateLimit({
//   windowMs: env.RATE_LIMIT_WINDOW_MS,
//   max: env.RATE_LIMIT_MAX,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: {
//     success: false,
//     error: {
//       code: 'RATE_LIMIT_EXCEEDED',
//       message: 'Too many requests, please try again later.',
//       details: [],
//     },
//   },
// });
// app.use(globalLimiter);

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
const orgRoutes = require('./modules/organizations/organization.routes');
const userRoutes = require('./modules/users/user.routes');
const projectRoutes = require('./modules/projects/project.routes');
const briefRoutes = require('./modules/briefs/brief.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const proposalRoutes = require('./modules/proposals/proposal.routes');
const publicationRoutes = require('./modules/publications/publication.routes');
const calendarRoutes = require('./modules/calendar/calendar.routes');
const mediaRoutes = require('./modules/media/media.routes');
const reportingRoutes = require('./modules/reporting/reporting.routes');
const auditRoutes = require('./modules/audit/audit.routes');
require('./modules/auth/auth.swagger');
require('./modules/organizations/organization.swagger');
require('./modules/users/user.swagger');
require('./modules/projects/project.swagger');
require('./modules/briefs/brief.swagger');
require('./modules/tasks/task.swagger');
require('./modules/proposals/proposal.swagger');
require('./modules/publications/publication.swagger');
require('./modules/calendar/calendar.swagger');
require('./modules/media/media.swagger');
require('./modules/reporting/reporting.swagger');
require('./modules/audit/audit.swagger');
app.use(`${env.API_PREFIX}/auth`, authRoutes);
app.use(`${env.API_PREFIX}/organizations`, orgRoutes);
app.use(`${env.API_PREFIX}/users`, userRoutes);
app.use(`${env.API_PREFIX}/projects`, projectRoutes);
app.use(`${env.API_PREFIX}/projects/:projectId/briefs`, briefRoutes);
app.use(`${env.API_PREFIX}/tasks`, taskRoutes);
app.use(`${env.API_PREFIX}/projects/:projectId/proposals`, proposalRoutes);
app.use(`${env.API_PREFIX}/projects/:projectId/publications`, publicationRoutes);
app.use(`${env.API_PREFIX}/calendar`, calendarRoutes);
app.use(`${env.API_PREFIX}/media`, mediaRoutes);
app.use(`${env.API_PREFIX}/reporting`, reportingRoutes);
app.use(`${env.API_PREFIX}/audit`, auditRoutes);

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
app.use(errorHandler);

module.exports = app;
