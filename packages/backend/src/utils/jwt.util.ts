import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface TokenPayload {
    userId: string;
    organizationId: string;
    role: 'admin' | 'manager' | 'worker';
}

interface RefreshTokenPayload {
    userId: string;
}

export class JWTUtil {
    private static jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    private static jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    private static jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    private static jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    /**
     * Generate access token (short-lived)
     */
    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
        });
    }

    /**
     * Generate refresh token (long-lived)
     */
    static generateRefreshToken(payload: RefreshTokenPayload): string {
        return jwt.sign(payload, this.jwtRefreshSecret, {
            expiresIn: this.jwtRefreshExpiresIn,
        });
    }

    /**
     * Verify access token
     */
    static verifyAccessToken(token: string): TokenPayload {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Access token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid access token');
            }
            throw error;
        }
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            const decoded = jwt.verify(token, this.jwtRefreshSecret) as RefreshTokenPayload;
            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Refresh token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Generate both access and refresh tokens
     */
    static generateTokenPair(user: {
        _id: Types.ObjectId;
        organizationId: Types.ObjectId;
        role: 'admin' | 'manager' | 'worker';
    }): {
        accessToken: string;
        refreshToken: string;
    } {
        const accessToken = this.generateAccessToken({
            userId: user._id.toString(),
            organizationId: user.organizationId.toString(),
            role: user.role,
        });

        const refreshToken = this.generateRefreshToken({
            userId: user._id.toString(),
        });

        return { accessToken, refreshToken };
    }

    /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token: string): any {
        return jwt.decode(token);
    }
}
