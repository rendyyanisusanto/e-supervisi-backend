import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { validationErrorResponse } from '../utils/response';

type ValidateTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: ValidateTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      result.error.errors.forEach((err) => {
        const key = err.path.join('.') || 'general';
        if (!errors[key]) errors[key] = [];
        errors[key].push(err.message);
      });
      validationErrorResponse(res, errors);
      return;
    }

    req[target] = result.data;
    next();
  };
