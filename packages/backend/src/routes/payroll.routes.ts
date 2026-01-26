import express from 'express';
import { calculatePayroll, exportPayroll } from '../controllers/payroll.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication and admin/manager role
router.use(authenticate);
router.use(authorize('admin', 'manager'));

// Calculate payroll
router.post('/calculate', calculatePayroll);

// Export payroll as CSV
router.get('/export', exportPayroll);

export default router;
