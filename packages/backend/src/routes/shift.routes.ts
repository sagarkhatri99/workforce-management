import express from 'express';
import {
    createShift,
    getShifts,
    getShift,
    updateShift,
    deleteShift,
    publishShift,
    assignWorker,
    unassignWorker,
} from '../controllers/shift.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create shift (admin/manager only)
router.post('/', authorize('admin', 'manager'), createShift);

// Get all shifts (all authenticated users)
router.get('/', getShifts);

// Get single shift
router.get('/:id', getShift);

// Update shift (admin/manager only)
router.put('/:id', authorize('admin', 'manager'), updateShift);

// Delete/cancel shift (admin/manager only)
router.delete('/:id', authorize('admin', 'manager'), deleteShift);

// Publish shift (admin/manager only)
router.post('/:id/publish', authorize('admin', 'manager'), publishShift);

// Assign worker to shift (admin/manager only)
router.post('/:id/assign', authorize('admin', 'manager'), assignWorker);

// Unassign worker from shift (admin/manager only)
router.delete('/:id/assign/:workerId', authorize('admin', 'manager'), unassignWorker);

export default router;
