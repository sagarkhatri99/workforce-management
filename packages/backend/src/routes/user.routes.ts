import express from 'express';
import {
    inviteUser,
    getUsers,
    getUser,
    updateUser,
    updateUserRole,
    deleteUser,
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Invite user (admin/manager only)
router.post('/invite', authorize('admin', 'manager'), inviteUser);

// Get all users (all authenticated users)
router.get('/', getUsers);

// Get single user
router.get('/:id', getUser);

// Update user (admin/manager can update others, workers can update themselves)
router.put('/:id', updateUser);

// Update user role (admin only)
router.put('/:id/role', authorize('admin'), updateUserRole);

// Deactivate user (admin only)
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
