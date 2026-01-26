import { Request, Response } from 'express';
import { TimeEntry } from '../models/TimeEntry';
import { Location } from '../models/Location';
import { Shift } from '../models/Shift';
import { z } from 'zod';

// Validation schemas
const clockInSchema = z.object({
    shiftId: z.string().optional(),
    locationId: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(200),
    source: z.enum(['gps', 'network', 'wifi']).default('gps'),
});

const clockOutSchema = z.object({
    timeEntryId: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().min(0).max(200),
    source: z.enum(['gps', 'network', 'wifi']).default('gps'),
});

/**
 * Clock in
 * POST /api/v1/timeclock/clockin
 */
export const clockIn = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = clockInSchema.parse(req.body);

        // Verify location exists
        const location = await Location.findOne({
            _id: validatedData.locationId,
            organizationId: req.user.organizationId,
        });

        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        // Check geofence
        const withinFence = location.isWithinGeofence(validatedData.lat, validatedData.lng);

        // Flag for review if outside fence or poor accuracy
        const flaggedForReview = !withinFence || validatedData.accuracy > 100;

        // Check if worker is already clocked in
        const existingClockIn = await TimeEntry.findOne({
            organizationId: req.user.organizationId,
            workerId: req.user.userId,
            status: 'clocked_in',
        });

        if (existingClockIn) {
            res.status(400).json({ error: 'Already clocked in' });
            return;
        }

        // Create time entry
        const timeEntry = await TimeEntry.create({
            organizationId: req.user.organizationId,
            workerId: req.user.userId,
            shiftId: validatedData.shiftId || null,
            locationId: validatedData.locationId,
            clockIn: {
                time: new Date(),
                location: {
                    lat: validatedData.lat,
                    lng: validatedData.lng,
                    accuracy: validatedData.accuracy,
                    source: validatedData.source,
                },
                withinFence,
            },
            status: 'clocked_in',
            flaggedForReview,
        });

        res.status(201).json({
            message: withinFence ? 'Clocked in successfully' : 'Clocked in (flagged for review)',
            timeEntry: {
                id: timeEntry._id,
                clockInTime: timeEntry.clockIn.time,
                withinFence,
                flaggedForReview,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Clock in error:', error);
        res.status(500).json({ error: 'Failed to clock in' });
    }
};

/**
 * Clock out
 * POST /api/v1/timeclock/clockout
 */
export const clockOut = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = clockOutSchema.parse(req.body);

        // Get time entry
        const timeEntry = await TimeEntry.findOne({
            _id: validatedData.timeEntryId,
            organizationId: req.user.organizationId,
            workerId: req.user.userId,
            status: 'clocked_in',
        });

        if (!timeEntry) {
            res.status(404).json({ error: 'Active clock-in not found' });
            return;
        }

        // Get location
        const location = await Location.findById(timeEntry.locationId);
        if (!location) {
            res.status(404).json({ error: 'Location not found' });
            return;
        }

        // Check geofence
        const withinFence = location.isWithinGeofence(validatedData.lat, validatedData.lng);

        // Update time entry
        timeEntry.clockOut = {
            time: new Date(),
            location: {
                lat: validatedData.lat,
                lng: validatedData.lng,
                accuracy: validatedData.accuracy,
                source: validatedData.source,
            },
            withinFence,
        };

        // Calculate total minutes (will be done by pre-save hook)
        timeEntry.status = 'clocked_out';

        // Flag for review if clock out is outside fence or poor accuracy
        if (!withinFence || validatedData.accuracy > 100) {
            timeEntry.flaggedForReview = true;
        }

        await timeEntry.save();

        res.json({
            message: 'Clocked out successfully',
            timeEntry: {
                id: timeEntry._id,
                clockInTime: timeEntry.clockIn.time,
                clockOutTime: timeEntry.clockOut.time,
                totalMinutes: timeEntry.totalMinutes,
                status: timeEntry.status,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Clock out error:', error);
        res.status(500).json({ error: 'Failed to clock out' });
    }
};

/**
 * Get current clock-in status
 * GET /api/v1/timeclock/status
 */
export const getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const timeEntry = await TimeEntry.findOne({
            organizationId: req.user.organizationId,
            workerId: req.user.userId,
            status: 'clocked_in',
        }).populate('locationId', 'name');

        if (!timeEntry) {
            res.json({ clockedIn: false });
            return;
        }

        res.json({
            clockedIn: true,
            timeEntry: {
                id: timeEntry._id,
                location: timeEntry.locationId,
                clockInTime: timeEntry.clockIn.time,
                withinFence: timeEntry.clockIn.withinFence,
            },
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to get status' });
    }
};

/**
 * Sync offline clock-ins
 * POST /api/v1/timeclock/sync
 */
export const syncOffline = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { entries } = req.body;

        if (!Array.isArray(entries) || entries.length === 0) {
            res.status(400).json({ error: 'Entries array is required' });
            return;
        }

        const results = [];

        for (const entry of entries) {
            try {
                // Validate entry has required fields
                if (!entry.locationId || !entry.lat || !entry.lng || !entry.clockInTime) {
                    results.push({ error: 'Missing required fields', entry });
                    continue;
                }

                // Check if entry is within 2-hour window
                const clockInTime = new Date(entry.clockInTime);
                const now = new Date();
                const hoursDiff = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);

                if (hoursDiff > 2) {
                    results.push({ error: 'Entry too old (>2 hours)', entry });
                    continue;
                }

                // Get location
                const location = await Location.findOne({
                    _id: entry.locationId,
                    organizationId: req.user.organizationId,
                });

                if (!location) {
                    results.push({ error: 'Location not found', entry });
                    continue;
                }

                // Use lenient geofence for offline (300m vs 150m)
                const lenientRadius = location.radius * 2;
                const distance = calculateDistance(
                    location.coordinates.coordinates[1],
                    location.coordinates.coordinates[0],
                    entry.lat,
                    entry.lng
                );

                const withinFence = distance <= lenientRadius;

                // Create time entry
                const timeEntry = await TimeEntry.create({
                    organizationId: req.user.organizationId,
                    workerId: req.user.userId,
                    locationId: entry.locationId,
                    clockIn: {
                        time: clockInTime,
                        location: {
                            lat: entry.lat,
                            lng: entry.lng,
                            accuracy: entry.accuracy || 100,
                            source: 'gps',
                        },
                        withinFence,
                    },
                    status: 'clocked_in',
                    flaggedForReview: !withinFence,
                });

                results.push({ success: true, timeEntryId: timeEntry._id });
            } catch (err) {
                results.push({ error: 'Failed to sync entry', entry });
            }
        }

        res.json({
            message: 'Sync completed',
            results,
            synced: results.filter((r) => r.success).length,
            failed: results.filter((r) => r.error).length,
        });
    } catch (error) {
        console.error('Sync offline error:', error);
        res.status(500).json({ error: 'Failed to sync offline entries' });
    }
};

/**
 * Helper: Calculate distance using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Get time entries (for manager approval)
 * GET /api/v1/timeclock/entries
 */
export const getTimeEntries = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { status, flaggedOnly, startDate, endDate } = req.query;
        const query: any = { organizationId: req.user.organizationId };

        // Workers can only see their own entries
        if (req.user.role === 'worker') {
            query.workerId = req.user.userId;
        }

        if (status) query.status = status;
        if (flaggedOnly === 'true') query.flaggedForReview = true;

        if (startDate || endDate) {
            query['clockIn.time'] = {};
            if (startDate) query['clockIn.time'].$gte = new Date(startDate as string);
            if (endDate) query['clockIn.time'].$lte = new Date(endDate as string);
        }

        const entries = await TimeEntry.find(query)
            .populate('workerId', 'name email')
            .populate('locationId', 'name')
            .populate('shiftId', 'title')
            .sort({ 'clockIn.time': -1 });

        res.json({
            entries,
            total: entries.length,
        });
    } catch (error) {
        console.error('Get time entries error:', error);
        res.status(500).json({ error: 'Failed to get time entries' });
    }
};

/**
 * Approve time entry
 * PUT /api/v1/timeclock/entries/:id/approve
 */
export const approveTimeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const timeEntry = await TimeEntry.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
                status: 'clocked_out',
            },
            {
                status: 'approved',
                approvedBy: req.user.userId,
                flaggedForReview: false,
            },
            { new: true }
        );

        if (!timeEntry) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }

        res.json({
            message: 'Time entry approved',
            timeEntry,
        });
    } catch (error) {
        console.error('Approve time entry error:', error);
        res.status(500).json({ error: 'Failed to approve time entry' });
    }
};

/**
 * Reject time entry
 * PUT /api/v1/timeclock/entries/:id/reject
 */
export const rejectTimeEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { notes } = req.body;

        const timeEntry = await TimeEntry.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
                status: 'clocked_out',
            },
            {
                status: 'rejected',
                approvedBy: req.user.userId,
                managerNotes: notes,
            },
            { new: true }
        );

        if (!timeEntry) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }

        res.json({
            message: 'Time entry rejected',
            timeEntry,
        });
    } catch (error) {
        console.error('Reject time entry error:', error);
        res.status(500).json({ error: 'Failed to reject time entry' });
    }
};
