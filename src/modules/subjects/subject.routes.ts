import { Router } from 'express';
import { subjectController } from './subject.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createSubjectSchema, updateSubjectSchema } from './subject.validation';

const router = Router();
router.use(authMiddleware);

router.get('/', subjectController.getAll);
router.get('/:id', subjectController.getById);
router.post('/', requireRole('admin', 'kurikulum'), validate(createSubjectSchema), subjectController.create);
router.put('/:id', requireRole('admin', 'kurikulum'), validate(updateSubjectSchema), subjectController.update);
router.delete('/:id', requireRole('admin'), subjectController.delete);
router.patch('/:id/status', requireRole('admin', 'kurikulum'), subjectController.toggleStatus);

export default router;
