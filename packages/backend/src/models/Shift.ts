import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IShift extends Document {
    organizationId: Types.ObjectId;
    locationId: Types.ObjectId;
    title: string;
    startTime: Date;
    endTime: Date;
    maxWorkers: number;
    assignedWorkers: Types.ObjectId[];
    hourlyRate?: number;
    status: 'draft' | 'published' | 'completed' | 'cancelled';
    notes?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
}

const ShiftSchema = new Schema<IShift>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Organization ID is required'],
            index: true,
        },
        locationId: {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Shift title is required'],
            trim: true,
            maxlength: [255, 'Title cannot exceed 255 characters'],
        },
        startTime: {
            type: Date,
            required: [true, 'Start time is required'],
        },
        endTime: {
            type: Date,
            required: [true, 'End time is required'],
            validate: {
                validator: function (this: IShift, endTime: Date) {
                    return endTime > this.startTime;
                },
                message: 'End time must be after start time',
            },
        },
        maxWorkers: {
            type: Number,
            required: [true, 'Maximum workers is required'],
            min: [1, 'At least 1 worker is required'],
            max: [100, 'Cannot exceed 100 workers per shift'],
        },
        assignedWorkers: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        hourlyRate: {
            type: Number,
            min: [11.44, 'Hourly rate must meet UK National Minimum Wage'],
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'completed', 'cancelled'],
            default: 'draft',
        },
        notes: {
            type: String,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        publishedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Indexes
ShiftSchema.index({ organizationId: 1, startTime: 1 });
ShiftSchema.index({ locationId: 1, status: 1, startTime: 1 });
ShiftSchema.index({ status: 1, publishedAt: -1 });
ShiftSchema.index({ assignedWorkers: 1 });

// Validation: prevent overlapping shifts for same worker
ShiftSchema.pre('save', async function (next) {
    if (!this.isModified('assignedWorkers') || this.assignedWorkers.length === 0) {
        return next();
    }

    // This would need to query existing shifts to check for overlaps
    // Simplified for MVP - implement in service layer
    next();
});

export const Shift = mongoose.model<IShift>('Shift', ShiftSchema);
