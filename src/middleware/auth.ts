import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  // 1. Try httpOnly cookie first
  const cookieToken = req.cookies?.auth_token;
  // 2. Fallback to Bearer header
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;

  const token = cookieToken || bearerToken;

  if (!token) {
    next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token', 'AUTH_TOKEN_INVALID'));
  }
}
