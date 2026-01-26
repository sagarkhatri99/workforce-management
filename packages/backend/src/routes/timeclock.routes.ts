import express from 'express';
import {
    clockIn,
    clockOut,
    getStatus,
    syncOffline,
    getTimeEntries,
    approveTimeEntry,
    rejectTimeEntry,
} from '../controllers/timeclock.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Worker routes
router.post('/clockin', clockIn);
router.post('/clockout', clockOut);
router.get('/status', getStatus);
router.post('/sync', syncOffline);

// Time entry viewing (all can view)
router.get('/entries', getTimeEntries);

// Manager routes (approval)
router.put('/entries/:id/approve', authorize('admin', 'manager'), approveTimeEntry);
router.put('/entries/:id/reject', authorize('admin', 'manager'), rejectTimeEntry);

export default router;
