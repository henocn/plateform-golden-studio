'use strict';

const { cleanEnv, str, port, num, bool } = require('envalid');
const dotenv = require('dotenv');

dotenv.config();

const env = cleanEnv(process.env, {
  // Server
  NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
  PORT: port({ default: 3000 }),
  API_PREFIX: str({ default: '/api/v1' }),

  // Database
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_NAME: str({ default: 'govcom_db' }),
  DB_USER: str({ default: 'postgres' }),
  DB_PASSWORD: str({ default: 'postgres' }),
  DB_POOL_MAX: num({ default: 10 }),

  // JWT
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),

  // 2FA
  TWO_FACTOR_APP_NAME: str({ default: 'GovCom Platform' }),

  // Upload
  UPLOAD_DIR: str({ default: './uploads' }),
  MAX_FILE_SIZE: num({ default: 52428800 }), // 50MB

  // CORS
  ALLOWED_ORIGINS: str({ default: 'http://localhost:5173,http://localhost:5174' }),

  // Logs
  LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'http', 'debug'], default: 'debug' }),
  LOG_DIR: str({ default: './logs' }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }), // 15 min
  RATE_LIMIT_MAX: num({ default: 100 }),
  AUTH_RATE_LIMIT_MAX: num({ default: 5 }),

  // Swagger
  SWAGGER_ENABLED: bool({ default: true }),
});

module.exports = env;
