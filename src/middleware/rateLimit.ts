import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';
import { config } from '../config/index.js';
import { pool } from '../db/connection.js';
import { findById, resetDailyCount } from '../db/queries/users.js';
import { AppError } from './errorHandler.js';

export async function rateLimitMiddleware(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.userId) {
      next(new AppError(401, 'Authentication required'));
      return;
    }

    const user = await findById(pool, req.userId);
    if (!user) {
      next(new AppError(401, 'User not found'));
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const lastDate = user.last_analysis_date
      ? new Date(user.last_analysis_date).toISOString().split('T')[0]
      : null;

    // Reset count if last analysis was before today
    if (lastDate && lastDate < today) {
      await resetDailyCount(pool, user.id);
      next();
      return;
    }

    // Check limit
    if (user.daily_analysis_count >= config.DAILY_ANALYSIS_LIMIT) {
      next(new AppError(429, `Daily analysis limit reached (${config.DAILY_ANALYSIS_LIMIT}/day). Try again tomorrow.`));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
