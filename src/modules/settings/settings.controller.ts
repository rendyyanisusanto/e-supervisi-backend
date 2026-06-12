import { Request, Response } from 'express';
import { settingsService } from './settings.service';
import { successResponse, asyncHandler } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';

export const settingsController = {
  getSchoolProfile: asyncHandler(async (_req: Request, res: Response) => {
    successResponse(res, await settingsService.getSchoolProfile());
  }),
  updateSchoolProfile: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await settingsService.updateSchoolProfile(req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  getReportSettings: asyncHandler(async (_req: Request, res: Response) => {
    successResponse(res, await settingsService.getReportSettings());
  }),
  updateReportSettings: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await settingsService.updateReportSettings(req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  getAppPreferences: asyncHandler(async (_req: Request, res: Response) => {
    successResponse(res, await settingsService.getAppPreferences());
  }),
  updateAppPreferences: asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, await settingsService.updateAppPreferences(req.body), MESSAGES.SUCCESS.UPDATE);
  }),
  uploadLogo: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Tidak ada file yang diupload' });
      return;
    }
    
    const { validateImageFile, compressSchoolLogo } = require('../../common/utils/image');
    
    validateImageFile(req.file);
    const logoPath = await compressSchoolLogo(req.file, 'school-logo');
    
    successResponse(res, await settingsService.updateSchoolLogo(logoPath), 'Logo sekolah berhasil diupload dan dikompres');
  }),
};
