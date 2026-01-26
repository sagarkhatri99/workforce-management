import { Request, Response } from 'express';
import { Shift } from '../models/Shift';
import { User } from '../models/User';
import { Location } from '../models/Location';
import { z } from 'zod';

// Validation schema
const createShiftSchema = z.object({
    locationId: z.string(),
    title: z.string().min(2).max(255),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    maxWorkers: z.number().min(1).max(100),
    hourlyRate: z.number().min(11.44).optional(),
    notes: z.string().max(1000).optional(),
});

const updateShiftSchema = createShiftSchema.partial();

/**
 * Create new shift
 * POST /api/v1/shifts
 */
export const createShift = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = createShiftSchema.parse(req.body);

        // Verify location exists and belongs to organization
        const location = await Location.findOne({
            _id: validatedData.locationId,
            organizationId: req.user.organizationId,
        });

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        // Create shift
        const shift = await Shift.create({
            organizationId: req.user.organizationId,
            locationId: validatedData.locationId,
            title: validatedData.title,
            startTime: new Date(validatedData.startTime),
            endTime: new Date(validatedData.endTime),
            maxWorkers: validatedData.maxWorkers,
            hourlyRate: validatedData.hourlyRate,
            notes: validatedData.notes,
            status: 'draft',
            createdBy: req.user.userId,
            assignedWorkers: [],
        });

        res.status(201).json({
            message: 'Shift created successfully',
            shift: {
                id: shift._id,
                title: shift.title,
                locationId: shift.locationId,
                startTime: shift.startTime,
                endTime: shift.endTime,
                maxWorkers: shift.maxWorkers,
                assignedWorkers: shift.assignedWorkers,
                hourlyRate: shift.hourlyRate,
                status: shift.status,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Create shift error:', error);
        res.status(500).json({ error: 'Failed to create shift' });
    }
};

/**
 * Get shifts
 * GET /api/v1/shifts
 */
export const getShifts = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { locationId, status, startDate, endDate } = req.query;
        const query: any = { organizationId: req.user.organizationId };

        if (locationId) query.locationId = locationId;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) query.startTime.$gte = new Date(startDate as string);
            if (endDate) query.startTime.$lte = new Date(endDate as string);
        }

        const shifts = await Shift.find(query)
            .populate('locationId', 'name coordinates')
            .populate('assignedWorkers', 'name email')
            .sort({ startTime: 1 });

        res.json({
            shifts: shifts.map((shift) => ({
                id: shift._id,
                title: shift.title,
                location: shift.locationId,
                startTime: shift.startTime,
                endTime: shift.endTime,
                maxWorkers: shift.maxWorkers,
                assignedWorkers: shift.assignedWorkers,
                hourlyRate: shift.hourlyRate,
                status: shift.status,
                notes: shift.notes,
            })),
            total: shifts.length,
        });
    } catch (error) {
        console.error('Get shifts error:', error);
        res.status(500).json({ error: 'Failed to get shifts' });
    }
};

/**
 * Get single shift
 * GET /api/v1/shifts/:id
 */
export const getShift = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const shift = await Shift.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        })
            .populate('locationId')
            .populate('assignedWorkers', 'name email role hourlyRate')
            .populate('createdBy', 'name email');

        if (!shift) {
            res.status(404).json({ error: 'Shift not found' });
            return;
        }

        res.json({ shift });
    } catch (error) {
        console.error('Get shift error:', error);
        res.status(500).json({ error: 'Failed to get shift' });
    }
};

/**
 * Update shift
 * PUT /api/v1/shifts/:id
 */
export const updateShift = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = updateShiftSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.title) updateData.title = validatedData.title;
        if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime);
        if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
        if (validatedData.maxWorkers) updateData.maxWorkers = validatedData.maxWorkers;
        if (validatedData.hourlyRate !== undefined) updateData.hourlyRate = validatedData.hourlyRate;
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

        const shift = await Shift.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!shift) {
            res.status(404).json({ error: 'Shift not found' });
            return;
        }

        res.json({
            message: 'Shift updated successfully',
            shift,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update shift error:', error);
        res.status(500).json({ error: 'Failed to update shift' });
    }
};

/**
 * Delete shift (cancel)
 * DELETE /api/v1/shifts/:id
 */
export const deleteShift = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const shift = await Shift.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            { status: 'cancelled' },
            { new: true }
        );

        if (!shift) {
            res.status(404).json({ error: 'Shift not found' });
            return;
        }

        // TODO: Send notifications to assigned workers

        res.json({ message: 'Shift cancelled successfully' });
    } catch (error) {
        console.error('Delete shift error:', error);
        res.status(500).json({ error: 'Failed to delete shift' });
    }
};

/**
 * Publish shift (make visible to workers)
 * POST /api/v1/shifts/:id/publish
 */
export const publishShift = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const shift = await Shift.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
                status: 'draft',
            },
            {
                status: 'published',
                publishedAt: new Date(),
            },
            { new: true }
        );

        if (!shift) {
            res.status(404).json({ error: 'Shift not found or already published' });
            return;
        }

        // TODO: Send push notifications to eligible workers

        res.json({
            message: 'Shift published successfully',
            shift,
        });
    } catch (error) {
        console.error('Publish shift error:', error);
        res.status(500).json({ error: 'Failed to publish shift' });
    }
};

/**
 * Manually assign worker to shift
 * POST /api/v1/shifts/:id/assign
 */
export const assignWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { workerId } = req.body;

        if (!workerId) {
            res.status(400).json({ error: 'Worker ID is required' });
            return;
        }

        // Verify worker exists and belongs to organization
        const worker = await User.findOne({
            _id: workerId,
            organizationId: req.user.organizationId,
            role: 'worker',
            status: 'active',
        });

        if (!worker) {
            res.status(404).json({ error: 'Worker not found' });
            return;
        }

        // Get shift
        const shift = await Shift.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!shift) {
            res.status(404).json({ error: 'Shift not found' });
            return;
        }

        // Check if shift is full
        if (shift.assignedWorkers.length >= shift.maxWorkers) {
            res.status(400).json({ error: 'Shift is full' });
            return;
        }

        // Check if worker already assigned
        if (shift.assignedWorkers.includes(worker._id)) {
            res.status(400).json({ error: 'Worker already assigned to this shift' });
            return;
        }

        // Assign worker
        shift.assignedWorkers.push(worker._id);
        await shift.save();

        // TODO: Send notification to worker

        res.json({
            message: 'Worker assigned successfully',
            shift: {
                id: shift._id,
                title: shift.title,
                assignedWorkers: shift.assignedWorkers,
            },
        });
    } catch (error) {
        console.error('Assign worker error:', error);
        res.status(500).json({ error: 'Failed to assign worker' });
    }
};

/**
 * Unassign worker from shift
 * DELETE /api/v1/shifts/:id/assign/:workerId
 */
export const unassignWorker = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const shift = await Shift.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!shift) {
            res.status(404).json({ error: 'Shift not found' });
            return;
        }

        // Remove worker
        shift.assignedWorkers = shift.assignedWorkers.filter(
            (id) => id.toString() !== req.params.workerId
        );
        await shift.save();

        res.json({ message: 'Worker unassigned successfully' });
    } catch (error) {
        console.error('Unassign worker error:', error);
        res.status(500).json({ error: 'Failed to unassign worker' });
    }
};
