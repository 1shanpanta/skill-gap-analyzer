import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { AppError } from './errorHandler';
import { logger } from '../lib/logger';

export interface AuthRequest extends Request {
  userId?: string;
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.auth_token;
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = cookieToken || bearerToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      // Invalid token — proceed without auth
    }
  }

  next();
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.auth_token;
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    logger.debug({ ip: req.ip, path: req.path }, 'Auth check without token');
    next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    logger.warn({ ip: req.ip, path: req.path }, 'Auth attempt with invalid token');
    next(new AppError(401, 'Invalid or expired token', 'AUTH_TOKEN_INVALID'));
  }
}
