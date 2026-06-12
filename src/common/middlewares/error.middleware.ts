import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { errorResponse } from '../utils/response';
import { MESSAGES } from '../constants/messages';

export interface AppError extends Error {
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export class HttpError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'HttpError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (!env.isDev()) {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? MESSAGES.ERROR.INTERNAL : (err.message || MESSAGES.ERROR.INTERNAL);

  errorResponse(res, message, statusCode, err.errors);
};

// 404 handler
export const notFoundMiddleware = (req: Request, res: Response): void => {
  errorResponse(res, `Route ${req.method} ${req.path} tidak ditemukan`, 404);
};
