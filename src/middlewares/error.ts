import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { ApiError } from '../utils/apiError';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof ApiError ? err.message : 'Internal server error';

  const response: any = {
    success: false,
    message,
  };

  if (err instanceof ApiError && err.details) {
    response.details = err.details;
  }

  if (config.nodeEnv !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
