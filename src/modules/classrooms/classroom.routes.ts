import { Router } from 'express';
import { classroomController } from './classroom.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createClassroomSchema, updateClassroomSchema } from './classroom.validation';

const router = Router();
router.use(authMiddleware);

router.get('/', classroomController.getAll);
router.get('/:id', classroomController.getById);
router.post('/', requireRole('admin', 'kurikulum'), validate(createClassroomSchema), classroomController.create);
router.put('/:id', requireRole('admin', 'kurikulum'), validate(updateClassroomSchema), classroomController.update);
router.delete('/:id', requireRole('admin'), classroomController.delete);
router.patch('/:id/status', requireRole('admin', 'kurikulum'), classroomController.toggleStatus);

export default router;
