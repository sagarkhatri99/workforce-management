import mongoose, { Schema, Document, Types } from 'mongoose';

interface ICoordinates {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

export interface ILocation extends Document {
    organizationId: Types.ObjectId;
    name: string;
    coordinates: ICoordinates;
    radius: number; // meters
    timezone: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
    {
        organizationId: {
            type: Schema.Types.ObjectId,
            ref: 'Organization',
            required: [true, 'Organization ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true,
            maxlength: [255, 'Name cannot exceed 255 characters'],
        },
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: [true, 'Coordinates are required'],
                validate: {
                    validator: function (coords: number[]) {
                        return (
                            coords.length === 2 &&
                            coords[0] >= -180 &&
                            coords[0] <= 180 && // longitude
                            coords[1] >= -90 &&
                            coords[1] <= 90 // latitude
                        );
                    },
                    message: 'Invalid coordinates. Format: [longitude, latitude]',
                },
            },
        },
        radius: {
            type: Number,
            required: true,
            default: 150,
            min: [50, 'Minimum radius is 50 meters'],
            max: [500, 'Maximum radius is 500 meters'],
        },
        timezone: {
            type: String,
            default: 'Europe/London',
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Geospatial index for distance queries
LocationSchema.index({ coordinates: '2dsphere' });
LocationSchema.index({ organizationId: 1, active: 1 });

// Helper method to calculate distance to a point
LocationSchema.methods.isWithinGeofence = function (
    lat: number,
    lng: number
): boolean {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this.coordinates.coordinates[1] * Math.PI) / 180;
    const φ2 = (lat * Math.PI) / 180;
    const Δφ = ((lat - this.coordinates.coordinates[1]) * Math.PI) / 180;
    const Δλ = ((lng - this.coordinates.coordinates[0]) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance <= this.radius;
};

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
