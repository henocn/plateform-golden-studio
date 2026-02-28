'use strict';

const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');
const { Sequelize } = require('sequelize');
const { initSocketIO } = require('./src/config/socket');
const { startCronJobs } = require('./src/config/cron');
const notificationService = require('./src/modules/notifications/notification.service');

const dbConfig = require('./src/config/database')[env.NODE_ENV];

// ─── Database Connection ─────────────────────────────────────
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
    define: dbConfig.define,
  },
);

// ─── Start Server ────────────────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info(`Database connected: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);

    const httpServer = http.createServer(app);

    const io = initSocketIO(httpServer);
    notificationService.setSocketIO(io);

    startCronJobs();

    httpServer.listen(env.PORT, () => {
      logger.info(`GovCom API running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`API prefix: ${env.API_PREFIX}`);

      if (env.SWAGGER_ENABLED) {
        logger.info(`Swagger: http://localhost:${env.PORT}${env.API_PREFIX}/api-docs`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ─── Graceful Shutdown ───────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  sequelize.close().then(() => {
    logger.info('Database connection closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
