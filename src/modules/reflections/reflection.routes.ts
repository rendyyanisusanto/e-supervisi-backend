import { Router } from 'express';
import { reflectionController } from './reflection.controller';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', reflectionController.getAll);

// Routes specific to reflection resource
router.patch('/:id/read', requireRole('admin', 'kurikulum', 'penilai'), reflectionController.markAsRead);

// Note: GET and POST by supervisionId are actually registered here but could be mounted under /supervisions
// Let's mount them under /supervisions/:supervisionId/reflection via the global router, 
// or just expose them here as /supervision/:supervisionId
router.get('/supervision/:supervisionId', reflectionController.getBySupervisionId);
router.post('/supervision/:supervisionId', reflectionController.submit);

export default router;
