import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';

/**
 * General API rate limiter
 * 1000 requests per hour per user/IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return (req as any).user?.userId || req.ip || '';
  },
  skip: (_req) => {
    // Skip rate limiting in development
    return config.isDevelopment;
  },
});

/**
 * Stricter rate limiter for sync endpoints
 * 50 requests per minute
 */
export const syncRateLimiter = rateLimit({
  windowMs: config.rateLimit.syncWindowMs,
  max: config.rateLimit.syncMaxRequests,
  message: 'Sync request limit exceeded, please wait before retrying',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (req as any).user?.userId || req.ip || '';
  },
  skip: (_req) => {
    return config.isDevelopment;
  },
});

/**
 * Strict rate limiter for login endpoint
 * 5 requests per 5 minutes per IP
 */
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || '',
  skip: (_req) => {
    return config.isDevelopment;
  },
});
