import { Router } from 'express';
import { scoreRangeController } from './score-range.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createScoreRangeSchema, updateScoreRangeSchema } from './score-range.validation';

const router = Router();
router.use(authMiddleware);

router.get('/', scoreRangeController.getAll);
router.get('/:id', scoreRangeController.getById);
router.post('/', requireRole('admin', 'kurikulum'), validate(createScoreRangeSchema), scoreRangeController.create);
router.put('/:id', requireRole('admin', 'kurikulum'), validate(updateScoreRangeSchema), scoreRangeController.update);
router.delete('/:id', requireRole('admin'), scoreRangeController.delete);

export default router;
