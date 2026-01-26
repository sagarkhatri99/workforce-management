import { Request, Response } from 'express';
import { User } from '../models/User';
import { TimeEntry } from '../models/TimeEntry';
import { Organization } from '../models/Organization';
import { z } from 'zod';

/**
 * Export user data (GDPR Right to Access - Article 15)
 * GET /api/v1/gdpr/export
 */
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get user data
        const user = await User.findById(req.user.userId).populate('organizationId');

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get all time entries
        const timeEntries = await TimeEntry.find({ workerId: req.user.userId })
            .populate('locationId', 'name')
            .populate('shiftId', 'title startTime endTime');

        // Compile all personal data
        const personalData = {
            user: {
                id: user._id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                role: user.role,
                status: user.status,
                hourlyRate: user.hourlyRate,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            organization: {
                id: (user.organizationId as any)._id,
                name: (user.organizationId as any).name,
            },
            timeEntries: timeEntries.map((entry) => ({
                id: entry._id,
                location: entry.locationId,
                shift: entry.shiftId,
                clockInTime: entry.clockIn.time,
                clockOutTime: entry.clockOut?.time,
                totalMinutes: entry.totalMinutes,
                status: entry.status,
                createdAt: entry.createdAt,
            })),
            totalTimeEntries: timeEntries.length,
            exportedAt: new Date(),
        };

        res.json({
            message: 'Personal data exported successfully',
            data: personalData,
        });
    } catch (error) {
        console.error('Export user data error:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
};

/**
 * Delete user account (GDPR Right to Erasure - Article 17)
 * DELETE /api/v1/gdpr/delete
 */
export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Anonymize user data (keep aggregates)
        const user = await User.findById(req.user.userId);

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Anonymize personal information
        user.email = `deleted_${user._id}@anonymized.com`;
        user.phone = undefined;
        user.name = {
            first: 'Deleted',
            last: 'User',
        };
        user.status = 'inactive';
        user.deviceTokens = [];

        await user.save();

        // Anonymize time entries (keep timestamps and durations for analytics)
        await TimeEntry.updateMany(
            { workerId: req.user.userId },
            {
                $unset: {
                    'clockIn.location': '',
                    'clockOut.location': '',
                    managerNotes: '',
                },
            }
        );

        res.json({
            message: 'Account deleted successfully. Personal data has been anonymized.',
        });
    } catch (error) {
        console.error('Delete user account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

/**
 * Update user profile (GDPR Right to Rectification - Article 16)
 * PUT /api/v1/gdpr/profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { firstName, lastName, phone, email } = req.body;

        const updateData: any = {};
        if (firstName || lastName) {
            updateData.name = {};
            if (firstName) updateData.name.first = firstName;
            if (lastName) updateData.name.last = lastName;
        }
        if (phone !== undefined) updateData.phone = phone;
        if (email) updateData.email = email;

        const user = await User.findByIdAndUpdate(req.user.userId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

/**
 * Get privacy policy
 * GET /api/v1/gdpr/privacy-policy
 */
export const getPrivacyPolicy = async (req: Request, res: Response): Promise<void> => {
    res.json({
        title: 'Privacy Policy',
        lastUpdated: '2024-01-24',
        content: `
# Privacy Policy

## 1. Data We Collect
We collect the following personal data:
- Name, email address, and phone number
- Location data for geofencing (clock in/out)
- Work hours and shift information
- Payment information (hourly rate)

## 2. How We Use Your Data
- To manage work shifts and schedules
- To calculate payroll
- To verify clock in/out locations
- To comply with UK employment laws

## 3. Your Rights (UK GDPR)
You have the right to:
- Access your personal data (Article 15)
- Rectify inaccurate data (Article 16)
- Request deletion of your data (Article 17)
- Object to processing (Article 21)
- Data portability (Article 20)

## 4. Data Retention
- Time entries: 2 years (UK payroll records requirement)
- User profile: Deleted 30 days after account closure
- Anonymized aggregates: Retained indefinitely

## 5. Contact
For privacy requests, contact: privacy@yourcompany.com

## 6. Cookies
We use strictly necessary cookies for authentication only.
    `.trim(),
    });
};
