import { Request, Response, NextFunction } from 'express';
import { announcementService } from './announcement.service';
import { successResponse } from '../../common/utils/response';

export const announcementController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await announcementService.getAll();
      successResponse(res, data, 'Pengumuman berhasil diambil');
    } catch (error) {
      next(error);
    }
  }
};
