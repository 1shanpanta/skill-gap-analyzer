import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import { findById } from '../db/queries/users';
import { AppError } from './errorHandler';

export async function rateLimitMiddleware(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId) {
      next(new AppError(401, 'Authentication required', 'AUTH_REQUIRED'));
      return;
    }

    const user = await findById(req.userId);
    if (!user) {
      next(new AppError(401, 'User not found', 'AUTH_REQUIRED'));
      return;
    }

    if (user.credits <= 0) {
      next(new AppError(429, 'No analysis credits remaining. Purchase more to continue.', 'NO_CREDITS'));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
