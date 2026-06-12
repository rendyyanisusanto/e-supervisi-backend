import { Router } from 'express';
import { auditLogController } from './audit-log.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('admin', 'kurikulum'));

router.get('/', auditLogController.getAll);

export default router;
