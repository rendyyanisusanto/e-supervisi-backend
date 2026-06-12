import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../config/jwt';
import { errorResponse } from '../utils/response';
import { MESSAGES } from '../constants/messages';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err: unknown) {
    const isExpired = err instanceof Error && err.message === 'jwt expired';
    errorResponse(
      res,
      isExpired ? MESSAGES.ERROR.TOKEN_EXPIRED : MESSAGES.ERROR.TOKEN_INVALID,
      401
    );
  }
};
