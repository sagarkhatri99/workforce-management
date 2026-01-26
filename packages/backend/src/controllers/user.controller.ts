import { Request, Response } from 'express';
import { User } from '../models/User';
import { emailService } from '../services/email.service';
import { JWTUtil } from '../utils/jwt.util';
import { z } from 'zod';
import crypto from 'crypto';

// Validation schemas
const inviteUserSchema = z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'manager', 'worker']),
});

const updateUserSchema = z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    hourlyRate: z.number().min(11.44).max(500).optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

/**
 * Invite user to organization
 * POST /api/v1/users/invite
 */
export const inviteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = inviteUserSchema.parse(req.body);

        // Check if user already exists in organization
        const existingUser = await User.findOne({
            email: validatedData.email,
            organizationId: req.user.organizationId,
        });

        if (existingUser) {
            res.status(409).json({ error: 'User already exists in organization' });
            return;
        }

        // Generate invite token (valid for 48 hours)
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

        // Create pending user
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const user = await User.create({
            organizationId: req.user.organizationId,
            email: validatedData.email,
            password: tempPassword, // Temporary, will be updated on acceptance
            name: {
                first: 'Pending',
                last: 'User',
            },
            role: validatedData.role,
            status: 'inactive', // Will be activated on invite acceptance
        });

        // Get inviter's name
        const inviter = await User.findById(req.user.userId);
        const inviterName = inviter ? `${inviter.name.first} ${inviter.name.last}` : 'An admin';

        // Get organization name
        const org = await User.findById(req.user.userId).populate('organizationId');
        const orgName = (org as any)?.organizationId?.name || 'the organization';

        // Send invitation email
        await emailService.sendInvitation(
            validatedData.email,
            inviteToken,
            orgName,
            inviterName
        );

        res.status(201).json({
            message: `Invitation sent to ${validatedData.email}`,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Invite user error:', error);
        res.status(500).json({ error: 'Failed to invite user' });
    }
};

/**
 * Get all users in organization
 * GET /api/v1/users
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { role, status, search, page = 1, limit = 20 } = req.query;
        const query: any = { organizationId: req.user.organizationId };

        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { 'name.first': { $regex: search, $options: 'i' } },
                { 'name.last': { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await User.countDocuments(query);

        res.json({
            users: users.map((user) => ({
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                hourlyRate: user.hourlyRate,
                createdAt: user.createdAt,
            })),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
};

/**
 * Get single user
 * GET /api/v1/users/:id
 */
export const getUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await User.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId,
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                status: user.status,
                hourlyRate: user.hourlyRate,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};

/**
 * Update user
 * PUT /api/v1/users/:id
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = updateUserSchema.parse(req.body);

        const updateData: any = {};
        if (validatedData.firstName || validatedData.lastName) {
            updateData.name = {};
            if (validatedData.firstName) updateData.name.first = validatedData.firstName;
            if (validatedData.lastName) updateData.name.last = validatedData.lastName;
        }
        if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
        if (validatedData.hourlyRate !== undefined) updateData.hourlyRate = validatedData.hourlyRate;
        if (validatedData.status !== undefined) updateData.status = validatedData.status;

        const user = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                hourlyRate: user.hourlyRate,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

/**
 * Update user role (admin only)
 * PUT /api/v1/users/:id/role
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { role } = req.body;

        if (!['admin', 'manager', 'worker'].includes(role)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        const user = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            { role },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            message: 'User role updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};

/**
 * Deactivate user
 * DELETE /api/v1/users/:id
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Cannot delete yourself
        if (req.params.id === req.user.userId) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }

        const user = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId,
            },
            { status: 'inactive' },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
