import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', notificationController.getAll);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

export default router;
