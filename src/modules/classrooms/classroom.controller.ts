import { Request, Response } from 'express';
import { classroomService } from './classroom.service';
import { successResponse, paginatedResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const classroomController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await classroomService.getAll(req);
    paginatedResponse(res, data, meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await classroomService.getById(req.params['id'] as string));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await classroomService.create(req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await classroomService.update(req.params['id'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await classroomService.delete(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),
  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await classroomService.toggleStatus(req.params['id'] as string), MESSAGES.SUCCESS.UPDATE);
  }),
};
