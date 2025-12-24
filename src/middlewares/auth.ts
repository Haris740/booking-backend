import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { verifyAccessToken } from '../utils/jwt';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authorization header missing or invalid'));
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const payload = verifyAccessToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user || (req as any).user.role !== 'ADMIN') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
}
