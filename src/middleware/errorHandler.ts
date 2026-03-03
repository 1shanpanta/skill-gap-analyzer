import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });
}
