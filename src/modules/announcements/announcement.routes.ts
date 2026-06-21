import { Router } from 'express';
import { announcementController } from './announcement.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', announcementController.getAll);

export default router;
