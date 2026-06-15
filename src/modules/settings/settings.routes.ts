import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';

const router = Router();
import { upload } from '../../common/utils/image';

// Make school-profile public so LoginView can fetch App Customization
router.get('/school-profile', settingsController.getSchoolProfile);

router.use(authMiddleware);
router.put('/school-profile', requireRole('admin'), settingsController.updateSchoolProfile);
router.post('/school-profile/logo', requireRole('admin'), upload.single('logo'), settingsController.uploadLogo);

router.get('/report-settings', settingsController.getReportSettings);
router.put('/report-settings', requireRole('admin', 'kurikulum'), settingsController.updateReportSettings);

router.get('/app-preferences', settingsController.getAppPreferences);
router.put('/app-preferences', requireRole('admin'), settingsController.updateAppPreferences);

export default router;
