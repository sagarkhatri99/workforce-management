import express from 'express';
import {
    createLocation,
    getLocations,
    getLocation,
    updateLocation,
    deleteLocation,
    validateGeofence,
} from '../controllers/location.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create location (admin/manager only)
router.post('/', authorize('admin', 'manager'), createLocation);

// Get all locations (all authenticated users)
router.get('/', getLocations);

// Get single location
router.get('/:id', getLocation);

// Update location (admin/manager only)
router.put('/:id', authorize('admin', 'manager'), updateLocation);

// Delete location (admin only)
router.delete('/:id', authorize('admin'), deleteLocation);

// Validate geofence (all authenticated users)
router.post('/:id/validate-geofence', validateGeofence);

export default router;
