import express from 'express';
import {
    exportUserData,
    deleteUserAccount,
    updateProfile,
    getPrivacyPolicy,
} from '../controllers/gdpr.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Privacy policy (public)
router.get('/privacy-policy', getPrivacyPolicy);

// Protected routes
router.get('/export', authenticate, exportUserData);
router.delete('/delete', authenticate, deleteUserAccount);
router.put('/profile', authenticate, updateProfile);

export default router;
