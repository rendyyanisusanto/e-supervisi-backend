import { Router } from 'express';
import { profileController } from './profile.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { updateProfileSchema, changePasswordSchema } from './profile.validation';
import { upload } from '../../common/utils/image';

const router = Router();

// Semua routes profile memerlukan autentikasi
router.use(authMiddleware);

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.put('/password', validate(changePasswordSchema), profileController.changePassword);
router.post('/avatar', upload.single('photo'), profileController.updateAvatar);
router.delete('/avatar', profileController.removeAvatar);

export default router;
