import mongoose, { Schema, Document, Types } from 'mongoose';

interface IGeoLocation {
    lat: number;
    lng: number;
    accuracy: number; // meters
    source: 'gps' | 'network' | 'wifi';
}

export interface ITimeEntry extends Document {
    organizationId: Types.ObjectId;
    workerId: Types.ObjectId;
    shiftId?: Types.ObjectId;
    locationId: Types.ObjectId;
    clockIn: {
        time: Date;
        location: IGeoLocation;
        withinFence: boolean;
    };
    clockOut?: {
        time: Date;
        location: IGeoLocation;
        withinFence: boolean;
    };
    totalMinutes?: number;
    status: 'clocked_in' | 'clocked_out' | 'approved' | 'rejected';
    approvedBy?: Types.ObjectId;
    managerNotes?: string;
    flaggedForReview: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: true,
            index: true,
        },
        workerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Worker ID is required'],
            index: true,
        },
        shiftId: {
            type: Schema.Types.ObjectId,
            ref: 'Shift',
        },
        locationId: {
            type: Schema.Types.ObjectId,
            ref: 'Location',
            required: [true, 'Location ID is required'],
        },
        clockIn: {
            time: {
                type: Date,
                required: [true, 'Clock-in time is required'],
            },
            location: {
                lat: {
                    type: Number,
                    required: true,
                    min: -90,
                    max: 90,
                },
                lng: {
                    type: Number,
                    required: true,
                    min: -180,
                    max: 180,
                },
                accuracy: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 200, // Reject if accuracy worse than 200m
                },
                source: {
                    type: String,
                    enum: ['gps', 'network', 'wifi'],
                    default: 'gps',
                },
            },
            withinFence: {
                type: Boolean,
                required: true,
            },
        },
        clockOut: {
            time: Date,
            location: {
                lat: Number,
                lng: Number,
                accuracy: Number,
                source: {
                    type: String,
                    enum: ['gps', 'network', 'wifi'],
                },
            },
            withinFence: Boolean,
        },
        totalMinutes: {
            type: Number,
            min: 0,
        },
        status: {
            type: String,
            enum: ['clocked_in', 'clocked_out', 'approved', 'rejected'],
            default: 'clocked_in',
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        managerNotes: {
            type: String,
            maxlength: 500,
        },
        flaggedForReview: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
TimeEntrySchema.index({ organizationId: 1, 'clockIn.time': -1 });
TimeEntrySchema.index({ workerId: 1, 'clockIn.time': -1 });
TimeEntrySchema.index({ locationId: 1, status: 1 });
TimeEntrySchema.index({ status: 1, flaggedForReview: 1 });

// Auto-calculate total minutes on clock-out
TimeEntrySchema.pre('save', function (next) {
    if (this.clockOut && this.clockOut.time && this.clockIn.time) {
        const diff = this.clockOut.time.getTime() - this.clockIn.time.getTime();
        this.totalMinutes = Math.floor(diff / 60000);
        this.status = 'clocked_out';
    }
    next();
});

export const TimeEntry = mongoose.model<ITimeEntry>('TimeEntry', TimeEntrySchema);
