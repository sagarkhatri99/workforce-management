import { Location } from '../models/Location';

describe('Location Model', () => {
    describe('isWithinGeofence', () => {
        it('should return true when coordinates are within fence', () => {
            const location = new Location({
                organizationId: '507f1f77bcf86cd799439011',
                name: 'Test Location',
                coordinates: {
                    type: 'Point',
                    coordinates: [-0.1278, 51.5074], // London
                },
                radius: 150,
            });

            // Point 100m away from location
            const result = location.isWithinGeofence(51.5083, -0.1278);
            expect(result).toBe(true);
        });

        it('should return false when coordinates are outside fence', () => {
            const location = new Location({
                organizationId: '507f1f77bcf86cd799439011',
                name: 'Test Location',
                coordinates: {
                    type: 'Point',
                    coordinates: [-0.1278, 51.5074],
                },
                radius: 150,
            });

            // Point 1km away from location
            const result = location.isWithinGeofence(51.5174, -0.1278);
            expect(result).toBe(false);
        });

        it('should correctly calculate distance using Haversine formula', () => {
            const location = new Location({
                organizationId: '507f1f77bcf86cd799439011',
                name: 'Test Location',
                coordinates: {
                    type: 'Point',
                    coordinates: [-0.1278, 51.5074],
                },
                radius: 200,
            });

            // Test exact boundary (should be true)
            const result = location.isWithinGeofence(51.5092, -0.1278); // ~200m away
            expect(result).toBe(true);
        });
    });
});

describe('Location Validation', () => {
    it('should validate coordinates range', async () => {
        const location = new Location({
            organizationId: '507f1f77bcf86cd799439011',
            name: 'Invalid Location',
            coordinates: {
                type: 'Point',
                coordinates: [200, 100], // Invalid
            },
            radius: 150,
        });

        await expect(location.validate()).rejects.toThrow();
    });

    it('should validate radius range', async () => {
        const location = new Location({
            organizationId: '507f1f77bcf86cd799439011',
            name: 'Invalid Radius',
            coordinates: {
                type: 'Point',
                coordinates: [-0.1278, 51.5074],
            },
            radius: 1000, // Too large
        });

        await expect(location.validate()).rejects.toThrow();
    });
});
