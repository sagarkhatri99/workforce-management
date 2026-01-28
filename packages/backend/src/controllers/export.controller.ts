import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Parser } from 'json2csv';

export const exportTimesheet = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const where: any = {};
    if (userId) {
        where.userId = userId as string;
    }

    const clockEvents = await prisma.clockEvent.findMany({
        where,
        include: {
            user: { select: { name: true, email: true } }
        },
        orderBy: { timestamp: 'asc' }
    });

    if (clockEvents.length === 0) {
        return res.status(404).json({ message: 'No records found' });
    }

    const fields = ['id', 'user.name', 'user.email', 'type', 'timestamp', 'lat', 'lng'];
    const opts = { fields };

    try {
        const parser = new Parser(opts);
        const csv = parser.parse(clockEvents);

        res.header('Content-Type', 'text/csv');
        res.attachment('timesheet.csv');
        return res.send(csv);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error generating CSV' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
