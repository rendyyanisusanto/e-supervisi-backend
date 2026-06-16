import { Request, Response } from 'express';
import { authService } from './auth.service';
import { successResponse, errorResponse } from '../../common/utils/response';
import { MESSAGES } from '../../common/constants/messages';
import { asyncHandler } from '../../common/utils/response';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const data = await authService.login(req.body);
    successResponse(res, data, MESSAGES.SUCCESS.LOGIN, 200);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const data = await authService.me(userId);
    successResponse(res, data);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    const data = await authService.updateProfile(userId, req.body, req.file);
    successResponse(res, data, 'Profil berhasil diperbarui');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
    const data = await authService.refresh(refresh_token);
    successResponse(res, data, 'Token diperbarui');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.sub;
    await authService.logout(userId);
    successResponse(res, null, MESSAGES.SUCCESS.LOGOUT);
  }),
};
