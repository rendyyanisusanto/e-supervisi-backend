import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { successResponse, paginatedResponse, asyncHandler } from '../../common/utils/response';

export const notificationController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await notificationService.getAll(req);
    paginatedResponse(res, data, meta);
  }),
  markRead: asyncHandler(async (req: Request, res: Response) => {
    const data = await notificationService.markRead(req.params['id'] as string, req.user!.sub);
    successResponse(res, data, 'Notifikasi ditandai dibaca');
  }),
  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.sub);
    successResponse(res, null, 'Semua notifikasi ditandai dibaca');
  }),
};
