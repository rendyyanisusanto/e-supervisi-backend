import { Request, Response } from 'express';
import { auditLogService } from './audit-log.service';
import { paginatedResponse, asyncHandler } from '../../common/utils/response';

export const auditLogController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await auditLogService.getAll(req);
    paginatedResponse(res, data, meta, 'Audit log berhasil dimuat');
  })
};
