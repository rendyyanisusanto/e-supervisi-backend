import { Request, Response } from 'express';
import { instrumentService } from './instrument.service';
import { successResponse, paginatedResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const instrumentController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await instrumentService.getAll(req);
    paginatedResponse(res, data, meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.getById(req.params['id'] as string));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.create(req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.update(req.params['id'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await instrumentService.delete(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),
  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.toggleStatus(req.params['id'] as string), MESSAGES.SUCCESS.UPDATE);
  }),
  duplicate: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.duplicate(req.params['id'] as string), 'Instrumen berhasil diduplikasi', 201);
  }),
  // Items
  getItems: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.getItems(req.params['id'] as string));
  }),
  createItem: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.createItem(req.params['id'] as string, req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  updateItem: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await instrumentService.updateItem(req.params['id'] as string, req.params['itemId'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  deleteItem: asyncHandler(async (req: Request, res: Response) => {
    await instrumentService.deleteItem(req.params['id'] as string, req.params['itemId'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),
  reorderItems: asyncHandler(async (req: Request, res: Response) => {
    await instrumentService.reorderItems(req.params['id'] as string, req.body);
    successResponse(res, null, 'Urutan berhasil disimpan');
  }),
};
