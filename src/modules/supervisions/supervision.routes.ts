import { Router } from 'express';
import { supervisionController } from './supervision.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { upload } from '../../common/utils/image';

const router = Router();

router.use(authMiddleware);

router.get('/', supervisionController.getAll);
router.get('/summary', supervisionController.getSummary);
router.get('/completed', supervisionController.getCompleted);
router.post('/', requireRole('admin', 'kurikulum', 'penilai'), supervisionController.create);

router.get('/:id', supervisionController.getById);
router.get('/:id/result', supervisionController.getResult);
router.get('/:id/items', supervisionController.getItems);

router.put('/:id/schedule', requireRole('admin', 'kurikulum', 'penilai'), supervisionController.updateSchedule);
router.patch('/:id/cancel', requireRole('admin', 'kurikulum', 'penilai'), supervisionController.cancel);
router.post('/:id/upload', requireRole('admin', 'kurikulum', 'penilai'), upload.single('documentation'), supervisionController.uploadDocumentation);

router.put('/:id/draft', requireRole('admin', 'kurikulum', 'penilai'), supervisionController.saveDraft);
router.post('/:id/submit', requireRole('admin', 'kurikulum', 'penilai'), supervisionController.submitFinal);

export default router;
