import { Request, Response } from 'express';
import { PayrollService } from '../services/payroll/service';
import { z } from 'zod';
import { logAudit } from '../utils/audit';

const service = new PayrollService();

const createPeriodSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100)
});

export const createPeriod = async (req: Request, res: Response) => {
    try {
        const data = createPeriodSchema.parse(req.body);
        const period = await service.createPeriod(data, req.user!.userId);

        await logAudit(req.user!.userId, 'CREATE', 'PayrollPeriod', `Created period ${data.month}/${data.year}`, req.ip);

        res.status(201).json(period);
    } catch (error: any) {
        if (error.name === 'ZodError') return res.status(400).json({ message: 'Validation error', errors: error.errors });
        // Handle unique constraint violation
        if (error.code === 'P2002') return res.status(409).json({ message: 'Period already exists' });

        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPeriods = async (req: Request, res: Response) => {
    try {
        const periods = await service.getAllPeriods();
        res.json(periods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPeriod = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const report = await service.getPeriodById(id);
        if (!report) return res.status(404).json({ message: 'Period not found' });
        res.json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const generatePayroll = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await service.calculatePayroll(id, req.user!.userId);

        await logAudit(req.user!.userId, 'GENERATE', 'Payroll', `Generated payroll for period ${id}`, req.ip);

        res.json(result);
    } catch (error: any) {
        if (error.message === 'Period not found') return res.status(404).json({ message: error.message });
        if (error.message === 'Period is already completed') return res.status(400).json({ message: error.message });

        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const exportPayroll = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const csv = await service.exportToCsv(id);

        res.header('Content-Type', 'text/csv');
        res.attachment(`payroll-${id}.csv`);
        res.send(csv);
    } catch (error: any) {
        if (error.message === 'Period not found') return res.status(404).json({ message: error.message });
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
