import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getStats = async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'MANAGER' || role === 'ADMIN') {
      const totalShifts = await prisma.shift.count();
      const openShifts = await prisma.shift.count({ where: { status: 'OPEN' } });
      const claimedShifts = await prisma.shift.count({ where: { status: 'CLAIMED' } });
      const completedShifts = await prisma.shift.count({ where: { status: 'COMPLETED' } });

      // Calculate fill rate
      const fillRate = totalShifts > 0 ? ((claimedShifts + completedShifts) / totalShifts) * 100 : 0;

      res.json({
        role,
        totalShifts,
        openShifts,
        claimedShifts,
        completedShifts,
        fillRate: Math.round(fillRate * 10) / 10,
      });
    } else {
      // Worker stats
      const myShifts = await prisma.shift.count({ where: { workerId: userId } });
      const completed = await prisma.shift.count({ where: { workerId: userId, status: 'COMPLETED' } });

      res.json({
        role,
        myShifts,
        completed,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
