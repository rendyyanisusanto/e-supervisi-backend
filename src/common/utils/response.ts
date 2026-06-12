import { Request, Response, NextFunction } from 'express';
import { MESSAGES } from '../constants/messages';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiListResponse<T = unknown> {
  success: true;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]> | unknown;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = MESSAGES.SUCCESS.FETCH,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  } as ApiSuccessResponse<T>);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = MESSAGES.SUCCESS.FETCH
): Response => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  } as ApiListResponse<T>);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]> | unknown
): Response => {
  const body: ApiErrorResponse = { success: false, message };
  if (errors) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
};

export const validationErrorResponse = (
  res: Response,
  errors: Record<string, string[]>
): Response => {
  return errorResponse(res, MESSAGES.ERROR.VALIDATION, 422, errors);
};

// Express async handler wrapper — catches async errors
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
