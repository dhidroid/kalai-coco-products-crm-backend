import { Response, NextFunction, RequestHandler } from 'express';
import type { AuthRequest } from '../types/index';
import { UserRole } from '../types/index';
import { verifyToken } from '@utils/jwt';
import { UnauthorizedError, ForbiddenError } from '@utils/errors';

export const authenticate: RequestHandler = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('No token provided');
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
};

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
};

export const optionalAuth: RequestHandler = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // Continue without authentication
    }
  }

  next();
};
