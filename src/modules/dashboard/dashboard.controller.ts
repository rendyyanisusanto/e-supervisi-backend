import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';

import { JwtPayload as AuthUser } from '../../config/jwt';

interface AuthRequest extends Request {
  user?: AuthUser;
}

export const dashboardController = {
  async getDashboardData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const userRole = user.roles?.[0]?.toLowerCase() || 'guru';
      const teacherId = user.teacher_id ? String(user.teacher_id) : undefined;

      const data = await dashboardService.getDashboardData(userRole, teacherId);

      res.json({
        success: true,
        message: 'Data dashboard berhasil diambil',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};
