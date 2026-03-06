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
  JWT_ACCESS_EXPIRES_IN: str({ default: '3d' }),
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
  RATE_LIMIT_MAX: num({ default: 30000 }),
  AUTH_RATE_LIMIT_MAX: num({ default: 20 }),

  // Swagger
  SWAGGER_ENABLED: bool({ default: true }),

  // Notifications — jours avant deadline pour les avertissements
  NOTIF_PUBLICATION_FIRST_WARNING_DAYS: num({ default: 3 }),
  NOTIF_PUBLICATION_LAST_WARNING_DAYS: num({ default: 1 }),
  NOTIF_TASK_FIRST_WARNING_DAYS: num({ default: 3 }),
  NOTIF_TASK_LAST_WARNING_DAYS: num({ default: 1 }),

  // Email (optionnel — si non renseigné, les envois sont ignorés)
  EMAIL_BRAND_NAME: str({ default: 'Qidoo' }),
  EMAIL_HOST: str({ default: '' }),
  EMAIL_PORT: num({ default: 587 }),
  EMAIL_USER: str({ default: '' }),
  EMAIL_APP_PASSWORD: str({ default: '' }),
  EMAIL_FROM: str({ default: '' }),

  // Lien frontend dans les emails (optionnel)
  FRONTEND_URL: str({ default: 'http://localhost:5173' }),
  // Alias optionnel (si vous préférez utiliser APP_URL au lieu de FRONTEND_URL)
  APP_URL: str({ default: '' }),
});

module.exports = env;
