import { Request, Response, NextFunction } from 'express';
import { supervisionService } from './supervision.service';
import { createSupervisionSchema, updateScheduleSchema, saveDraftSchema, submitFinalSchema } from './supervision.validation';
import { JwtPayload as AuthUser } from '../../config/jwt';

interface AuthRequest extends Request {
  user?: AuthUser;
}

export const supervisionController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.getAll(req, role, String(user.sub), String(user.teacher_id));
      res.json({
        success: true,
        message: 'Data supervisi berhasil dimuat',
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  async getCompleted(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      req.query.status = 'SELESAI';
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.getAll(req, role, String(user.sub), String(user.teacher_id));
      res.json({
        success: true,
        message: 'Data hasil supervisi berhasil dimuat',
        ...result
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.getById(req.params.id as string, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Detail supervisi berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = createSupervisionSchema.parse(req.body);
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.create(dto, String(user.sub), role);
      res.status(201).json({
        success: true,
        message: 'Jadwal supervisi berhasil dibuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = updateScheduleSchema.parse(req.body);
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.updateSchedule(req.params.id as string, dto, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Jadwal supervisi berhasil diperbarui',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.cancel(req.params.id as string, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Supervisi berhasil dibatalkan',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getItems(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      await supervisionService.getById(req.params.id as string, role, String(user.teacher_id));
      const items = await supervisionService.getItems(req.params.id as string);
      res.json({
        success: true,
        message: 'Item supervisi berhasil dimuat',
        data: items
      });
    } catch (error) {
      next(error);
    }
  },

  async saveDraft(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = saveDraftSchema.parse(req.body);
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.saveDraft(req.params.id as string, dto, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Draft supervisi berhasil disimpan',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async submitFinal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = submitFinalSchema.parse(req.body);
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.submitFinal(req.params.id as string, dto, String(user.sub), role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Penilaian supervisi berhasil disubmit',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getResult(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const role = user.roles[0] || '';
      const result = await supervisionService.getById(req.params.id as string, role, String(user.teacher_id));
      res.json({
        success: true,
        message: 'Hasil supervisi berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
