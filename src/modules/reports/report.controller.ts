import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';

export const reportController = {
  async getSupervisionRecap(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getSupervisionRecap(req);
      res.json({
        success: true,
        message: 'Rekap supervisi berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getTeacherReport(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.teacherId as string;
      const periodId = req.query.period_id as string;
      if (!periodId) throw new Error('period_id diperlukan');
      
      const result = await reportService.getTeacherReport(teacherId, periodId);
      res.json({
        success: true,
        message: 'Laporan guru berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getTeacherCompetency(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = req.params.teacherId as string;
      const periodId = req.query.period_id as string;
      if (!periodId) throw new Error('period_id diperlukan');
      
      const result = await reportService.getTeacherCompetency(teacherId, periodId);
      res.json({
        success: true,
        message: 'Peta kompetensi guru berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getWeaknessMap(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getWeaknessMap(req);
      res.json({
        success: true,
        message: 'Peta kelemahan berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getBasicSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getBasicSummary(req);
      res.json({
        success: true,
        message: 'Ringkasan laporan berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getIndicatorReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportService.getIndicatorReport(req);
      res.json({
        success: true,
        message: 'Laporan per indikator berhasil dimuat',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
};
