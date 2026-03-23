import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new ValidationError(message));
      }
      return next(error);
    }
  };
};
