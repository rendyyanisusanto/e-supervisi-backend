import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', dashboardController.getDashboardData);

export default router;
