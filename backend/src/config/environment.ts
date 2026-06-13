import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // Database
  mongodbUri:
    process.env.NODE_ENV === 'production'
      ? process.env.MONGODB_URI_PROD
      : process.env.NODE_ENV === 'staging'
        ? process.env.MONGODB_URI_STAGING
        : process.env.MONGODB_URI_DEV || 'mongodb://localhost:27017/budgetting-dev',

  // CORS
  frontendUrls: {
    dev: process.env.FRONTEND_URL_DEV || 'http://localhost:3000',
    staging: process.env.FRONTEND_URL_STAGING || 'https://staging.budgetting.app',
    prod: process.env.FRONTEND_URL_PROD || 'https://budgetting.app',
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpiry: parseInt(process.env.JWT_EXPIRY || '86400', 10),

  // Encryption
  encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  encryptionKey: process.env.ENCRYPTION_KEY,

  // Password hashing
  argon2: {
    time: parseInt(process.env.ARGON2_TIME || '3', 10),
    memory: parseInt(process.env.ARGON2_MEMORY || '65536', 10),
    parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
    syncWindowMs: parseInt(process.env.RATE_LIMIT_SYNC_WINDOW_MS || '60000', 10),
    syncMaxRequests: parseInt(process.env.RATE_LIMIT_SYNC_MAX_REQUESTS || '50', 10),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',

  // Sentry
  sentryDsn: process.env.SENTRY_DSN,

  // Sync
  sync: {
    enableDownload: process.env.SYNC_ENABLE_DOWNLOAD !== 'false',
    enableUpload: process.env.SYNC_ENABLE_UPLOAD !== 'false',
    conflictStrategy: process.env.SYNC_CONFLICT_STRATEGY || 'last-write-wins',
    retryMaxAttempts: parseInt(process.env.SYNC_RETRY_MAX_ATTEMPTS || '3', 10),
    retryBackoffBase: parseInt(process.env.SYNC_RETRY_BACKOFF_BASE || '1000', 10),
  },
};

export function getCorsOrigin(): string | RegExp {
  if (config.isDevelopment) {
    return '*'; // Allow all in development
  }
  const origins = Object.values(config.frontendUrls);
  return new RegExp(origins.join('|'));
}
