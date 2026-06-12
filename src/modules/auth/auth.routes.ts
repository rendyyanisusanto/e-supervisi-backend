import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

export default router;
