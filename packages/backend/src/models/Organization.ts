import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    slug: string;
    settings: {
        timezone: string;
        geofenceRadius: number; // meters
        weeklyHoursCap: number;
        currency: string;
    };
    subscription: {
        plan: 'free' | 'pro';
        maxUsers: number;
        expiresAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: {
            type: String,
            required: [true, 'Organization name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [255, 'Name cannot exceed 255 characters'],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
        },
        settings: {
            timezone: {
                type: String,
                default: 'Europe/London',
            },
            geofenceRadius: {
                type: Number,
                default: 150,
                min: [50, 'Minimum geofence radius is 50 meters'],
                max: [500, 'Maximum geofence radius is 500 meters'],
            },
            weeklyHoursCap: {
                type: Number,
                default: 48, // UK Working Time Regulations
                min: [1, 'Weekly hours cap must be at least 1'],
                max: [80, 'Weekly hours cap cannot exceed 80'],
            },
            currency: {
                type: String,
                default: 'GBP',
                enum: ['GBP', 'USD', 'EUR'],
            },
        },
        subscription: {
            plan: {
                type: String,
                enum: ['free', 'pro'],
                default: 'free',
            },
            maxUsers: {
                type: Number,
                default: 50,
            },
            expiresAt: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
OrganizationSchema.index({ slug: 1 });
OrganizationSchema.index({ createdAt: -1 });

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
