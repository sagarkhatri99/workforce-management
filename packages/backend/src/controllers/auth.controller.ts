import { Request, Response } from 'express';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { JWTUtil } from '../utils/jwt.util';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
    organizationName: z.string().min(2).max(255),
    organizationSlug: z.string().regex(/^[a-z0-9-]+$/),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    organizationSlug: z.string(),
});

/**
 * Register new organization and admin user
 * POST /api/v1/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = registerSchema.parse(req.body);

        // Check if organization slug already exists
        const existingOrg = await Organization.findOne({ slug: validatedData.organizationSlug });
        if (existingOrg) {
            res.status(409).json({ error: 'Organization slug already taken' });
            return;
        }

        // Check if email already exists (across all organizations)
        const existingUser = await User.findOne({ email: validatedData.email });
        if (existingUser) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        // Create organization
        const organization = await Organization.create({
            name: validatedData.organizationName,
            slug: validatedData.organizationSlug,
            settings: {
                timezone: 'Europe/London',
                geofenceRadius: 150,
                weeklyHoursCap: 48,
                currency: 'GBP',
            },
            subscription: {
                plan: 'free',
                maxUsers: 50,
            },
        });

        // Create admin user
        const user = await User.create({
            organizationId: organization._id,
            email: validatedData.email,
            password: validatedData.password, // Will be hashed by pre-save hook
            name: {
                first: validatedData.firstName,
                last: validatedData.lastName,
            },
            phone: validatedData.phone,
            role: 'admin',
            status: 'active',
        });

        // Generate tokens
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(user);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: organization._id,
                organizationName: organization.name,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = loginSchema.parse(req.body);

        // Find organization
        const organization = await Organization.findOne({ slug: validatedData.organizationSlug });
        if (!organization) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Find user with password field
        const user = await User.findOne({
            email: validatedData.email,
            organizationId: organization._id,
        }).select('+password');

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Check if user is active
        if (user.status !== 'active') {
            res.status(403).json({ error: 'Account is inactive' });
            return;
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(validatedData.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate tokens
        const { accessToken, refreshToken } = JWTUtil.generateTokenPair(user);

        res.json({
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: organization._id,
                organizationName: organization.name,
            },
            accessToken,
            refreshToken,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        // Verify refresh token
        const decoded = JWTUtil.verifyRefreshToken(refreshToken);

        // Get user
        const user = await User.findById(decoded.userId);
        if (!user || user.status !== 'active') {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }

        // Generate new token pair
        const tokens = JWTUtil.generateTokenPair(user);

        res.json({
            message: 'Token refreshed',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } catch (error) {
        if (error instanceof Error) {
            res.status(401).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Token refresh failed' });
    }
};

/**
 * Logout (client-side token deletion)
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
    // In this implementation, logout is handled client-side by deleting tokens
    // For enhanced security, implement token blacklisting with Redis
    res.json({ message: 'Logout successful' });
};

/**
 * Get current user profile
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const user = await User.findById(req.user.userId).populate('organizationId', 'name slug');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                hourlyRate: user.hourlyRate,
                organization: user.organizationId,
            },
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
};
