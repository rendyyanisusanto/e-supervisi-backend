import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service';
import { HttpError } from '../../common/middlewares/error.middleware';
import { MESSAGES } from '../../common/constants/messages';

export const profileController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.sub);
      const profile = await profileService.getProfile(userId);
      res.json({
        success: true,
        message: 'Profile berhasil dimuat',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.sub);
      const profile = await profileService.updateProfile(userId, req.body);
      res.json({
        success: true,
        message: 'Profile berhasil diperbarui',
        data: profile
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.sub);
      await profileService.changePassword(userId, req.body);
      res.json({
        success: true,
        message: 'Password berhasil diubah',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.sub);
      const file = req.file;
      
      if (!file) {
        throw new HttpError('File gambar wajib diunggah', 400);
      }

      const result = await profileService.updateAvatar(userId, file);
      
      res.json({
        success: true,
        message: 'Foto profil berhasil diperbarui',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async removeAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.sub);
      const result = await profileService.removeAvatar(userId);
      
      res.json({
        success: true,
        message: 'Foto profil berhasil dihapus',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
