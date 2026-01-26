import express from 'express';
import {
    getAvailableShifts,
    applyForShift,
    getMyApplications,
    getPendingApplications,
    approveApplication,
    rejectApplication,
} from '../controllers/application.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Worker routes
router.get('/available', authorize('worker'), getAvailableShifts);
router.post('/', authorize('worker'), applyForShift);
router.get('/my-applications', authorize('worker'), getMyApplications);

// Manager routes
router.get('/pending', authorize('admin', 'manager'), getPendingApplications);
router.put('/:id/approve', authorize('admin', 'manager'), approveApplication);
router.put('/:id/reject', authorize('admin', 'manager'), rejectApplication);

export default router;
