import { Request, Response } from 'express';
import { scoreRangeService } from './score-range.service';
import { successResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const scoreRangeController = {
  getAll: asyncHandler(async (_req: Request, res: Response) => {
    successResponse(res, await scoreRangeService.getAll());
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await scoreRangeService.getById(req.params['id'] as string));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await scoreRangeService.create(req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await scoreRangeService.update(req.params['id'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await scoreRangeService.delete(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),
};
