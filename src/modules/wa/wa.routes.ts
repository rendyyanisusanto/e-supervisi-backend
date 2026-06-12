import { Router } from 'express';
import { waController } from './wa.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createWaTemplateSchema, updateWaTemplateSchema } from './wa.validation';

const router = Router();
router.use(authMiddleware);

router.get('/templates', waController.getAll);
router.get('/templates/:id', waController.getById);
router.post('/templates', requireRole('admin', 'kurikulum'), validate(createWaTemplateSchema), waController.create);
router.put('/templates/:id', requireRole('admin', 'kurikulum'), validate(updateWaTemplateSchema), waController.update);
router.patch('/templates/:id/status', requireRole('admin', 'kurikulum'), waController.toggleStatus);
router.post('/templates/:id/send-test', requireRole('admin', 'kurikulum'), waController.sendTest);

router.get('/logs', requireRole('admin', 'kurikulum'), waController.getLogs);
router.post('/logs/:id/retry', requireRole('admin', 'kurikulum'), waController.retryLog);

export default router;
