import { Request, Response } from 'express';
import { Application } from '../models/Application';
import { Shift } from '../models/Shift';
import { User } from '../models/User';
import { z } from 'zod';

/**
 * Get available shifts for worker
 * GET /api/v1/applications/available
 */
export const getAvailableShifts = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get published shifts that are not full and in the future
        const shifts = await Shift.find({
            organizationId: req.user.organizationId,
            status: 'published',
            startTime: { $gte: new Date() },
        })
            .populate('locationId', 'name')
            .sort({ startTime: 1 });

        // Filter shifts that are not full and worker hasn't applied
        const availableShifts = [];
        for (const shift of shifts) {
            // Check if shift is full
            if (shift.assignedWorkers.length >= shift.maxWorkers) {
                continue;
            }

            // Check if worker already applied
            const existingApplication = await Application.findOne({
                shiftId: shift._id,
                workerId: req.user.userId,
            });

            if (!existingApplication) {
                availableShifts.push({
                    id: shift._id,
                    title: shift.title,
                    location: shift.locationId,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    hourlyRate: shift.hourlyRate,
                    openPositions: shift.maxWorkers - shift.assignedWorkers.length,
                });
            }
        }

        res.json({
            shifts: availableShifts,
            total: availableShifts.length,
        });
    } catch (error) {
        console.error('Get available shifts error:', error);
        res.status(500).json({ error: 'Failed to get available shifts' });
    }
};

/**
 * Apply for shift
 * POST /api/v1/applications
 */
export const applyForShift = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { shiftId } = req.body;

        if (!shiftId) {
            res.status(400).json({ error: 'Shift ID is required' });
            return;
        }

        // Verify shift exists and is published
        const shift = await Shift.findOne({
            _id: shiftId,
            organizationId: req.user.organizationId,
            status: 'published',
        });

        if (!shift) {
            res.status(404).json({ error: 'Shift not found or not available' });
            return;
        }

        // Check if shift is full
        if (shift.assignedWorkers.length >= shift.maxWorkers) {
            res.status(400).json({ error: 'Shift is full' });
            return;
        }

        // Check if shift is in the past
        if (shift.startTime < new Date()) {
            res.status(400).json({ error: 'Cannot apply for past shifts' });
            return;
        }

        // Create application
        const application = await Application.create({
            organizationId: req.user.organizationId,
            shiftId,
            workerId: req.user.userId,
            status: 'applied',
        });

        res.status(201).json({
            message: 'Application submitted successfully',
            application: {
                id: application._id,
                shiftId: application.shiftId,
                status: application.status,
                appliedAt: application.appliedAt,
            },
        });
    } catch (error: any) {
        // Handle duplicate application error
        if (error.code === 11000) {
            res.status(409).json({ error: 'You have already applied for this shift' });
            return;
        }
        console.error('Apply for shift error:', error);
        res.status(500).json({ error: 'Failed to apply for shift' });
    }
};

/**
 * Get worker applications
 * GET /api/v1/applications/my-applications
 */
export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { status } = req.query;
        const query: any = {
            organizationId: req.user.organizationId,
            workerId: req.user.userId,
        };

        if (status) query.status = status;

        const applications = await Application.find(query)
            .populate({
                path: 'shiftId',
                populate: { path: 'locationId', select: 'name' },
            })
            .sort({ appliedAt: -1 });

        res.json({
            applications: applications.map((app) => ({
                id: app._id,
                shift: app.shiftId,
                status: app.status,
                appliedAt: app.appliedAt,
                respondedAt: app.respondedAt,
            })),
            total: applications.length,
        });
    } catch (error) {
        console.error('Get my applications error:', error);
        res.status(500).json({ error: 'Failed to get applications' });
    }
};

/**
 * Get pending applications for manager
 * GET /api/v1/applications/pending
 */
export const getPendingApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const applications = await Application.find({
            organizationId: req.user.organizationId,
            status: 'applied',
        })
            .populate('workerId', 'name email hourlyRate')
            .populate({
                path: 'shiftId',
                populate: { path: 'locationId', select: 'name' },
            })
            .sort({ appliedAt: 1 });

        res.json({
            applications: applications.map((app) => ({
                id: app._id,
                worker: app.workerId,
                shift: app.shiftId,
                appliedAt: app.appliedAt,
            })),
            total: applications.length,
        });
    } catch (error) {
        console.error('Get pending applications error:', error);
        res.status(500).json({ error: 'Failed to get pending applications' });
    }
};

/**
 * Approve application
 * PUT /api/v1/applications/:id/approve
 */
export const approveApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const application = await Application.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
            status: 'applied',
        });

        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }

        // Get shift
        const shift = await Shift.findById(application.shiftId);
        if (!shift) {
            res.status(404).json({ error: 'Shift not found' });
            return;
        }

        // Check if shift is full
        if (shift.assignedWorkers.length >= shift.maxWorkers) {
            res.status(400).json({ error: 'Shift is full' });
            return;
        }

        // Assign worker to shift
        if (!shift.assignedWorkers.includes(application.workerId)) {
            shift.assignedWorkers.push(application.workerId);
            await shift.save();
        }

        // Update application status
        application.status = 'accepted';
        application.respondedAt = new Date();
        await application.save();

        // TODO: Send push notification + email to worker

        res.json({
            message: 'Application approved and worker assigned',
            application: {
                id: application._id,
                status: application.status,
                respondedAt: application.respondedAt,
            },
        });
    } catch (error) {
        console.error('Approve application error:', error);
        res.status(500).json({ error: 'Failed to approve application' });
    }
};

/**
 * Reject application
 * PUT /api/v1/applications/:id/reject
 */
export const rejectApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const application = await Application.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
                status: 'applied',
            },
            {
                status: 'rejected',
                respondedAt: new Date(),
            },
            { new: true }
        );

        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }

        // TODO: Send push notification to worker

        res.json({
            message: 'Application rejected',
            application: {
                id: application._id,
                status: application.status,
            },
        });
    } catch (error) {
        console.error('Reject application error:', error);
        res.status(500).json({ error: 'Failed to reject application' });
    }
};
