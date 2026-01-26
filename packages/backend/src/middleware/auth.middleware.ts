import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt.util';
import { User } from '../models/User';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                organizationId: string;
                role: 'admin' | 'manager' | 'worker';
            };
        }
    }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer '

        // Verify token
        const decoded = JWTUtil.verifyAccessToken(token);

        // Attach user to request
        req.user = {
            userId: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Access token expired') {
                res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
                return;
            }
            res.status(401).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Authorization middleware
 * Checks if user has required role
 */
export const authorize = (...allowedRoles: Array<'admin' | 'manager' | 'worker'>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
            });
            return;
        }

        next();
    };
};

/**
 * Multi-tenant middleware
 * Ensures user can only access their organization's data
 */
export const checkOrganizationAccess = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // If request has organizationId in body/params/query, verify it matches user's org
    const requestOrgId = req.body.organizationId || req.params.organizationId || req.query.organizationId;

    if (requestOrgId && requestOrgId !== req.user.organizationId) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'Cannot access resources from another organization',
        });
        return;
    }

    next();
};
