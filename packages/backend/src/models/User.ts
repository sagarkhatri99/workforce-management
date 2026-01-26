import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
    organizationId: Types.ObjectId;
    email: string;
    phone?: string;
    name: {
        first: string;
        last: string;
    };
    password: string;
    role: 'admin' | 'manager' | 'worker';
    status: 'active' | 'inactive';
    hourlyRate?: number;
    deviceTokens: Array<{
        token: string;
        platform: 'ios' | 'android';
        createdAt: Date;
        isActive: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Organization ID is required'],
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        phone: {
            type: String,
            trim: true,
        },
        name: {
            first: {
                type: String,
                required: [true, 'First name is required'],
                trim: true,
            },
            last: {
                type: String,
                required: [true, 'Last name is required'],
                trim: true,
            },
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // Don't include password in queries by default
        },
        role: {
            type: String,
            enum: ['admin', 'manager', 'worker'],
            required: [true, 'Role is required'],
            default: 'worker',
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
        },
        hourlyRate: {
            type: Number,
            min: [11.44, 'Hourly rate must meet UK National Minimum Wage (£11.44 for 23+)'],
            max: [500, 'Hourly rate cannot exceed £500'],
        },
        deviceTokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
                platform: {
                    type: String,
                    enum: ['ios', 'android'],
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                isActive: {
                    type: Boolean,
                    default: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Compound unique index: email must be unique within an organization
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });
UserSchema.index({ organizationId: 1, status: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
UserSchema.virtual('fullName').get(function () {
    return `${this.name.first} ${this.name.last}`;
});

export const User = mongoose.model<IUser>('User', UserSchema);
