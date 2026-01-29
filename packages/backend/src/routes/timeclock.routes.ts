import express from 'express';
import { clock } from '../controllers/timeclock.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Clock in/out for a shift
router.post('/:shiftId', clock);

export default router;
