import { Router } from 'express';
import { exportTimesheet } from '../controllers/export.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/timesheet', authorize(['ADMIN', 'MANAGER']), exportTimesheet);

export default router;
