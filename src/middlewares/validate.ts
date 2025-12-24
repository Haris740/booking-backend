import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

export const validate = (schema: any, dataType: 'body' | 'query' | 'params' = 'body') => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = dataType === 'body' ? req.body : req.query;
      schema.parse(data);
      next();
    } catch (error: any) {
      console.log('Validation error:', error);
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => ({
          path: issue.path,
          message: issue.message,
        }));
        next(new ApiError(400, 'Validation failed', issues));
      } else {
        next(error);
      }
    }
  };
