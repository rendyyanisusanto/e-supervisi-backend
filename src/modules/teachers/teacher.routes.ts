import { Router } from 'express';
import { teacherController } from './teacher.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createTeacherSchema, updateTeacherSchema, updateRolesSchema } from './teacher.validation';
import { upload } from '../../common/utils/image';

const router = Router();
router.use(authMiddleware);

router.get('/', teacherController.getAll);
router.get('/:id', teacherController.getById);
router.post('/', requireRole('admin', 'kurikulum'), validate(createTeacherSchema), teacherController.create);
router.put('/:id', requireRole('admin', 'kurikulum'), validate(updateTeacherSchema), teacherController.update);
router.delete('/:id', requireRole('admin'), teacherController.delete);
router.patch('/:id/status', requireRole('admin', 'kurikulum'), teacherController.toggleStatus);
router.patch('/:id/roles', requireRole('admin'), validate(updateRolesSchema), teacherController.updateRoles);
router.post('/:id/reset-password', requireRole('admin'), teacherController.resetPassword);
router.post('/:id/photo', requireRole('admin', 'kurikulum'), upload.single('photo'), teacherController.uploadPhoto);

export default router;
