import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IApplication extends Document {
    organizationId: Types.ObjectId;
    shiftId: Types.ObjectId;
    workerId: Types.ObjectId;
    status: 'applied' | 'accepted' | 'rejected';
    appliedAt: Date;
    respondedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        shiftId: {
            type: Schema.Types.ObjectId,
            ref: 'Shift',
            required: [true, 'Shift ID is required'],
            index: true,
        },
        workerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Worker ID is required'],
            index: true,
        },
        status: {
            type: String,
            enum: ['applied', 'accepted', 'rejected'],
            default: 'applied',
        },
        appliedAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Unique index: a worker can only apply once per shift
ApplicationSchema.index({ workerId: 1, shiftId: 1 }, { unique: true });
ApplicationSchema.index({ organizationId: 1, status: 1 });
ApplicationSchema.index({ shiftId: 1, status: 1, appliedAt: 1 });

// Auto-set respondedAt when status changes
ApplicationSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status !== 'applied') {
        this.respondedAt = new Date();
    }
    next();
});

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
