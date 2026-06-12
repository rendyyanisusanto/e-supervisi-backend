import { Request, Response } from 'express';
import { waService } from './wa.service';
import { waGatewayService } from './wa-gateway.service';
import { successResponse, paginatedResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const waController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await waService.getAll(req);
    paginatedResponse(res, data, meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await waService.getById(req.params['id'] as string));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await waService.create(req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await waService.update(req.params['id'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await waService.toggleStatus(req.params['id'] as string), MESSAGES.SUCCESS.UPDATE);
  }),
  sendTest: asyncHandler(async (req: Request, res: Response) => {
    const templateId = req.params['id'] as string;
    const { phone, variables } = req.body;
    
    if (!phone || !variables) {
      res.status(400).json({ success: false, message: 'Nomor WA dan variables wajib diisi' });
      return;
    }
    
    const result = await waGatewayService.sendTestTemplate(templateId, { phone, variables });
    successResponse(res, result, 'Pesan test berhasil dikirim');
  }),
  getLogs: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await waGatewayService.getWaLogs(req);
    paginatedResponse(res, data, meta, 'Log WA berhasil dimuat');
  }),
  retryLog: asyncHandler(async (req: Request, res: Response) => {
    const logId = req.params['id'] as string;
    const result = await waGatewayService.retryWaLog(logId);
    successResponse(res, result, 'Pesan berhasil dikirim ulang');
  }),
};
