import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';
import { MESSAGES } from '../constants/messages';

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, MESSAGES.ERROR.UNAUTHORIZED, 401);
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      errorResponse(res, MESSAGES.ERROR.FORBIDDEN, 403);
      return;
    }

    next();
  };
};

export const requireAnyRole = (roles: string[]) => requireRole(...roles);
