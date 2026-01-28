import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createShiftSchema } from '../utils/validation';
import { sendEmail } from '../utils/email';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const createShift = async (req: Request, res: Response) => {
  try {
    const data = createShiftSchema.parse(req.body);

    const skillsString = data.skills ? JSON.stringify(data.skills) : '[]';

    const shift = await prisma.shift.create({
      data: {
        title: data.title,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        skills: skillsString,
        status: 'OPEN',
        createdBy: req.user!.userId,
      },
    });

    await logAudit(req.user!.userId, 'CREATE', 'Shift', `Created shift ${shift.id}`, req.ip);

    res.status(201).json({ ...shift, skills: JSON.parse(shift.skills) });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getShifts = async (req: Request, res: Response) => {
  try {
    const { status, myShifts } = req.query;
    const userId = req.user!.userId;
    const role = req.user!.role;

    const where: any = {};

    if (status) {
      where.status = status as string;
    }

    if (myShifts === 'true' && role === 'WORKER') {
      where.workerId = userId;
    } else if (role === 'WORKER') {
      if (!status) {
         where.OR = [
             { status: 'OPEN' },
             { workerId: userId }
         ];
      }
    }

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: { worker: { select: { name: true, email: true } } }
    });

    const formattedShifts = shifts.map(s => ({
      ...s,
      skills: JSON.parse(s.skills)
    }));

    res.json(formattedShifts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const claimShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const shift = await prisma.shift.findUnique({ where: { id } });

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    if (shift.status !== 'OPEN') {
      return res.status(400).json({ message: 'Shift is not available' });
    }

    const updatedShift = await prisma.shift.update({
      where: { id },
      data: {
        workerId: userId,
        status: 'CLAIMED',
      },
      include: {
          worker: { select: { name: true, email: true } }
      }
    });

    if (updatedShift.worker?.email) {
        await sendEmail(
            updatedShift.worker.email,
            'Shift Claimed',
            `You have claimed the shift: ${updatedShift.title} at ${updatedShift.location}.`
        );
    }

    await logAudit(userId, 'CLAIM', 'Shift', `Claimed shift ${id}`, req.ip);

    res.json({ ...updatedShift, skills: JSON.parse(updatedShift.skills) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSchema = createShiftSchema.partial();

export const updateShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateSchema.parse(req.body);

        const skillsString = data.skills ? JSON.stringify(data.skills) : undefined;

        const shift = await prisma.shift.update({
            where: { id },
            data: {
                ...data,
                skills: skillsString,
            }
        });

        await logAudit(req.user!.userId, 'UPDATE', 'Shift', `Updated shift ${id}`, req.ip);
        res.json({ ...shift, skills: JSON.parse(shift.skills) });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Shift not found' });
        if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteShift = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.shift.delete({ where: { id } });
        await logAudit(req.user!.userId, 'DELETE', 'Shift', `Deleted shift ${id}`, req.ip);
        res.json({ message: 'Shift deleted' });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Shift not found' });
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const assignWorker = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { workerId } = req.body;

        if (!workerId) return res.status(400).json({ message: 'Worker ID required' });

        const shift = await prisma.shift.update({
            where: { id },
            data: {
                workerId,
                status: 'CLAIMED'
            },
             include: {
                worker: { select: { name: true, email: true } }
            }
        });

        if (shift.worker?.email) {
             await sendEmail(
                shift.worker.email,
                'Shift Assigned',
                `You have been assigned to shift: ${shift.title} at ${shift.location}.`
            );
        }

        await logAudit(req.user!.userId, 'ASSIGN', 'Shift', `Assigned worker ${workerId} to shift ${id}`, req.ip);
        res.json({ ...shift, skills: JSON.parse(shift.skills) });
    } catch (error: any) {
        if (error.code === 'P2025') return res.status(404).json({ message: 'Shift/Worker not found' });
        res.status(500).json({ message: 'Internal server error' });
    }
};
