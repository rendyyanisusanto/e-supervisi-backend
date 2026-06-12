import { Router } from 'express';
import { reportController } from './report.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/basic-summary', requireRole('admin', 'kurikulum'), reportController.getBasicSummary);
router.get('/supervision-recap', requireRole('admin', 'kurikulum', 'penilai'), reportController.getSupervisionRecap);
router.get('/weakness-map', requireRole('admin', 'kurikulum', 'penilai'), reportController.getWeaknessMap);
router.get('/indicators', requireRole('admin', 'kurikulum', 'penilai'), reportController.getIndicatorReport);

router.get('/teacher/:teacherId', reportController.getTeacherReport);
router.get('/teacher/:teacherId/competency', reportController.getTeacherCompetency);

export default router;
