import { Router } from 'express';
import { createPeriod, getPeriods, getPeriod, generatePayroll, exportPayroll } from '../controllers/payroll.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'MANAGER'])); // Only admins/managers can touch payroll

router.post('/', createPeriod);
router.get('/', getPeriods);
router.get('/:id', getPeriod);
router.post('/:id/generate', generatePayroll);
router.get('/:id/export', exportPayroll);

export default router;
