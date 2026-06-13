import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { config } from '../config/environment';
import { AppError } from './errorHandler';
import { AuthTokenPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    clientId?: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('INVALID_TOKEN', 401, 'Missing or invalid authorization token');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;

    req.user = {
      userId: decoded.userId,
      clientId: decoded.clientId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired', { userId: (error as any).decoded?.userId });
      throw new AppError('TOKEN_EXPIRED', 401, 'Authorization token has expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', { error: error.message });
      throw new AppError('INVALID_TOKEN', 401, 'Invalid authorization token');
    }

    if (error instanceof AppError) {
      throw error;
    }

    logger.error('Auth middleware error', { error });
    throw new AppError('INTERNAL_SERVER_ERROR', 500, 'Authentication failed');
  }
};

/**
 * Generate JWT token
 */
export function generateToken(userId: string, clientId?: string): string {
  const payload: AuthTokenPayload = {
    userId,
    clientId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + config.jwtExpiry,
  };

  return jwt.sign(payload, config.jwtSecret);
}
