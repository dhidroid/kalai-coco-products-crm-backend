import { Response, NextFunction, ErrorRequestHandler } from 'express';
import type { AuthRequest, ApiResponse } from '../types/index';
import { AppError, InternalServerError } from '@utils/errors';
import { logger } from '@utils/logger';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error occurred', { message: err.message, stack: err.stack });

  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      success: false,
      message: err.message,
      error: err.message,
    };
    return res.status(err.statusCode).json(response);
  }

  const error = new InternalServerError('An unexpected error occurred');
  const response: ApiResponse<null> = {
    success: false,
    message: error.message,
    error: error.message,
  };
  return res.status(error.statusCode).json(response);
};
