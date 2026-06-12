import { Request, Response } from 'express';
import { subjectService } from './subject.service';
import { successResponse, paginatedResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const subjectController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await subjectService.getAll(req);
    paginatedResponse(res, data, meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await subjectService.getById(req.params['id'] as string));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await subjectService.create(req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await subjectService.update(req.params['id'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await subjectService.delete(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),
  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await subjectService.toggleStatus(req.params['id'] as string), MESSAGES.SUCCESS.UPDATE);
  }),
};
