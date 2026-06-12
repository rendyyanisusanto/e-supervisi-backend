import { Router } from 'express';
import { periodController } from './period.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createPeriodSchema, updatePeriodSchema } from './period.validation';

const router = Router();
router.use(authMiddleware);

router.get('/', periodController.getAll);
router.get('/active', periodController.getActive);
router.get('/:id', periodController.getById);
router.post('/', requireRole('admin', 'kurikulum'), validate(createPeriodSchema), periodController.create);
router.put('/:id', requireRole('admin', 'kurikulum'), validate(updatePeriodSchema), periodController.update);
router.delete('/:id', requireRole('admin'), periodController.delete);
router.patch('/:id/activate', requireRole('admin', 'kurikulum'), periodController.activate);

export default router;
