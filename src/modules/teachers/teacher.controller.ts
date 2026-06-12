import { Request, Response } from 'express';
import { teacherService } from './teacher.service';
import { successResponse, paginatedResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const teacherController = {
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const { data, meta } = await teacherService.getAll(req);
    paginatedResponse(res, data, meta);
  }),
  getById: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await teacherService.getById(req.params['id'] as string));
  }),
  create: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await teacherService.create(req.body), MESSAGES.SUCCESS.CREATE, 201);
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await teacherService.update(req.params['id'] as string, req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  delete: asyncHandler(async (req: Request, res: Response) => {
    await teacherService.delete(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.DELETE);
  }),
  toggleStatus: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await teacherService.toggleStatus(req.params['id'] as string), MESSAGES.SUCCESS.UPDATE);
  }),
  updateRoles: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await teacherService.updateRoles(req.params['id'] as string, req.body), 'Role berhasil diperbarui');
  }),
  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await teacherService.resetPassword(req.params['id'] as string);
    successResponse(res, null, MESSAGES.SUCCESS.PASSWORD_RESET);
  }),
  uploadPhoto: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
      return;
    }
    
    // Import here to avoid circular dependencies if any, or better add at top of file
    const { validateImageFile, compressTeacherPhoto } = require('../../common/utils/image');
    
    validateImageFile(req.file);
    const photoPath = await compressTeacherPhoto(req.file, `teacher-${req.params['id']}`);
    
    successResponse(res, await teacherService.updatePhoto(req.params['id'] as string, photoPath), 'Foto guru berhasil diupload dan dikompres');
  }),
};
