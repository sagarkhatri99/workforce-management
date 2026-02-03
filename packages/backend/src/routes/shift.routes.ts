import { Router } from 'express';
import { createShift, getShifts, claimShift, updateShift, deleteShift, assignWorker } from '../controllers/shift.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['ADMIN', 'MANAGER']), createShift);
router.get('/', getShifts);
router.patch('/:id/claim', authorize(['WORKER']), claimShift);

// Additional Manager Routes
router.patch('/:id', authorize(['ADMIN', 'MANAGER']), updateShift);
router.delete('/:id', authorize(['ADMIN', 'MANAGER']), deleteShift);
router.post('/:id/assign', authorize(['ADMIN', 'MANAGER']), assignWorker);

export default router;
