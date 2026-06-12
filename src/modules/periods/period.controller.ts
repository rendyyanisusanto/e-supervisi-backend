import { Request, Response } from 'express';
import { periodService } from './period.service';
import { successResponse, paginatedResponse } from '../../common/utils/response';
import { asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const periodController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await periodService.getAll(req);
    paginatedResponse(res, data, meta);
  }),

  getActive: asyncHandler(async (_req: Request, res: Response) => {
    const data = await periodService.getActive();
    successResponse(res, data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const data = await periodService.getById(req.params['id'] as string);
    successResponse(res, data);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = await periodService.create(req.body);
    successResponse(res, data, MESSAGES.SUCCESS.CREATE, 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = await periodService.update(req.params['id'] as string, req.body);
    successResponse(res, data, MESSAGES.SUCCESS.UPDATE);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await periodService.delete(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),

  activate: asyncHandler(async (req: Request, res: Response) => {
    const data = await periodService.activate(req.params['id'] as string);
    successResponse(res, data, 'Periode berhasil diaktifkan');
  }),
};
