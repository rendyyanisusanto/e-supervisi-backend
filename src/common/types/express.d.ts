import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../../config/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
