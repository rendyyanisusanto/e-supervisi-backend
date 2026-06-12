import { Router } from 'express';
import { instrumentController } from './instrument.controller';
import { validate } from '../../common/middlewares/validate.middleware';
import { authMiddleware } from '../../common/middlewares/auth.middleware';
import { requireRole } from '../../common/middlewares/role.middleware';
import { createInstrumentSchema, updateInstrumentSchema, createInstrumentItemSchema, updateInstrumentItemSchema, reorderItemsSchema } from './instrument.validation';

const router = Router();
router.use(authMiddleware);

router.get('/', instrumentController.getAll);
router.get('/:id', instrumentController.getById);
router.post('/', requireRole('admin', 'kurikulum'), validate(createInstrumentSchema), instrumentController.create);
router.put('/:id', requireRole('admin', 'kurikulum'), validate(updateInstrumentSchema), instrumentController.update);
router.delete('/:id', requireRole('admin'), instrumentController.delete);
router.patch('/:id/status', requireRole('admin', 'kurikulum'), instrumentController.toggleStatus);
router.post('/:id/duplicate', requireRole('admin', 'kurikulum'), instrumentController.duplicate);

// Items
router.get('/:id/items', instrumentController.getItems);
router.post('/:id/items', requireRole('admin', 'kurikulum'), validate(createInstrumentItemSchema), instrumentController.createItem);
router.patch('/:id/items/reorder', requireRole('admin', 'kurikulum'), validate(reorderItemsSchema), instrumentController.reorderItems);
router.put('/:id/items/:itemId', requireRole('admin', 'kurikulum'), validate(updateInstrumentItemSchema), instrumentController.updateItem);
router.delete('/:id/items/:itemId', requireRole('admin'), instrumentController.deleteItem);

export default router;
