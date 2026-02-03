import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { clockSchema } from '../utils/validation';
import { logAudit } from '../utils/audit';

export const clock = async (req: Request, res: Response) => {
  try {
    const { shiftId } = req.params;
    const userId = req.user!.userId;
    const data = clockSchema.parse(req.body); // { type: 'IN' | 'OUT', lat?, lng? }

    // Validate shift
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    if (shift.workerId !== userId) {
      return res.status(403).json({ message: 'You are not assigned to this shift' });
    }

    if (shift.status !== 'CLAIMED' && shift.status !== 'COMPLETED') {
        return res.status(400).json({ message: 'Shift not claimed' });
    }

    // Geofence Validation (Basic Distance Check Mock)
    // In a real app, we'd check distance between data.lat/lng and shift.location coords.
    // For MVP, we'll just log if it looks "far" or if location is missing, but not block.
    // Assuming we don't have coords for the location in DB yet (just string name).
    // If we had coords:
    // const distance = calculateDistance(data.lat, data.lng, shiftLocation.lat, shiftLocation.lng);
    // if (distance > 100) { warning = true; }

    if (data.type === 'OUT') {
         await prisma.shift.update({
             where: { id: shiftId },
             data: { status: 'COMPLETED' }
         });
    }

    const clockEvent = await prisma.clockEvent.create({
      data: {
        userId,
        type: data.type,
        lat: data.lat,
        lng: data.lng,
      },
    });

    await logAudit(userId, 'CLOCK', 'Shift', `Clocked ${data.type} for shift ${shiftId}`, req.ip);

    res.status(201).json(clockEvent);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
