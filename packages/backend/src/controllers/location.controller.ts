import { Request, Response } from 'express';
import { Location } from '../models/Location';
import { z } from 'zod';

// Validation schema
const createLocationSchema = z.object({
    name: z.string().min(2).max(255),
    coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }),
    radius: z.number().min(50).max(500).default(150),
    timezone: z.string().optional().default('Europe/London'),
});

const updateLocationSchema = createLocationSchema.partial();

/**
 * Create new location
 * POST /api/v1/locations
 */
export const createLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Validate input
        const validatedData = createLocationSchema.parse(req.body);

        // Create location with GeoJSON format
        const location = await Location.create({
            organizationId: req.user.organizationId,
            name: validatedData.name,
            coordinates: {
                type: 'Point',
                coordinates: [validatedData.coordinates.lng, validatedData.coordinates.lat],
            },
            radius: validatedData.radius,
            timezone: validatedData.timezone,
            active: true,
        });

        res.status(201).json({
            message: 'Location created successfully',
            location: {
                id: location._id,
                name: location.name,
                coordinates: {
                    lat: location.coordinates.coordinates[1],
                    lng: location.coordinates.coordinates[0],
                },
                radius: location.radius,
                timezone: location.timezone,
                active: location.active,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create location error:', error);
        res.status(500).json({ error: 'Failed to create location' });
    }
};

/**
 * Get all locations for organization
 * GET /api/v1/locations
 */
export const getLocations = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { active, search } = req.query;
        const query: any = { organizationId: req.user.organizationId };

        if (active !== undefined) {
            query.active = active === 'true';
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const locations = await Location.find(query).sort({ createdAt: -1 });

        res.json({
            locations: locations.map((loc) => ({
                id: loc._id,
                name: loc.name,
                coordinates: {
                    lat: loc.coordinates.coordinates[1],
                    lng: loc.coordinates.coordinates[0],
                },
                radius: loc.radius,
                timezone: loc.timezone,
                active: loc.active,
                createdAt: loc.createdAt,
            })),
            total: locations.length,
        });
    } catch (error) {
        console.error('Get locations error:', error);
        res.status(500).json({ error: 'Failed to get locations' });
    }
};

/**
 * Get single location
 * GET /api/v1/locations/:id
 */
export const getLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const location = await Location.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        res.json({
            location: {
                id: location._id,
                name: location.name,
                coordinates: {
                    lat: location.coordinates.coordinates[1],
                    lng: location.coordinates.coordinates[0],
                },
                radius: location.radius,
                timezone: location.timezone,
                active: location.active,
                createdAt: location.createdAt,
                updatedAt: location.updatedAt,
            },
        });
    } catch (error) {
        console.error('Get location error:', error);
        res.status(500).json({ error: 'Failed to get location' });
    }
};

/**
 * Update location
 * PUT /api/v1/locations/:id
 */
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = updateLocationSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.name) updateData.name = validatedData.name;
        if (validatedData.coordinates) {
            updateData.coordinates = {
                type: 'Point',
                coordinates: [validatedData.coordinates.lng, validatedData.coordinates.lat],
            };
        }
        if (validatedData.radius) updateData.radius = validatedData.radius;
        if (validatedData.timezone) updateData.timezone = validatedData.timezone;

        const location = await Location.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        res.json({
            message: 'Location updated successfully',
            location: {
                id: location._id,
                name: location.name,
                coordinates: {
                    lat: location.coordinates.coordinates[1],
                    lng: location.coordinates.coordinates[0],
                },
                radius: location.radius,
                timezone: location.timezone,
                active: location.active,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
};

/**
 * Delete location (soft delete)
 * DELETE /api/v1/locations/:id
 */
export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const location = await Location.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            { active: false },
            { new: true }
        );

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        res.json({ message: 'Location deactivated successfully' });
    } catch (error) {
        console.error('Delete location error:', error);
        res.status(500).json({ error: 'Failed to delete location' });
    }
};

/**
 * Validate geofencing
 * POST /api/v1/locations/:id/validate-geofence
 */
export const validateGeofence = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { lat, lng } = req.body;

        if (!lat || !lng) {
            res.status(400).json({ error: 'Latitude and longitude are required' });
            return;
        }

        const location = await Location.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        const withinFence = location.isWithinGeofence(lat, lng);

        res.json({
            withinFence,
            location: {
                id: location._id,
                name: location.name,
                radius: location.radius,
            },
        });
    } catch (error) {
        console.error('Validate geofence error:', error);
        res.status(500).json({ error: 'Failed to validate geofence' });
    }
};
