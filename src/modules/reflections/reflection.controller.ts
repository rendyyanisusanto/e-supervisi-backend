import { Request, Response, NextFunction } from 'express';
import { reflectionService } from './reflection.service';
import { submitReflectionSchema } from './reflection.validation';
import { JwtPayload as AuthUser } from '../../config/jwt';

interface AuthRequest extends Request {
  user?: AuthUser;
}

export const reflectionController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await reflectionService.getAll(req, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Data refleksi berhasil dimuat',
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  async getBySupervisionId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await reflectionService.getBySupervisionId(req.params.supervisionId as string, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Detail refleksi berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = submitReflectionSchema.parse(req.body);
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await reflectionService.submit(req.params.supervisionId as string, dto, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Refleksi berhasil disimpan',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await reflectionService.markAsRead(req.params.id as string, role);
      res.json({
        success: true,
        message: 'Refleksi ditandai sudah dibaca',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
