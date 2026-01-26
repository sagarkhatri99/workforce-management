import { Request, Response } from 'express';
import { TimeEntry } from '../models/TimeEntry';
import { User } from '../models/User';
import { z } from 'zod';
import { Parser } from 'json2csv';

// UK Tax rates (2024)
const PAYE_RATE = 0.20; // 20% basic rate
const PAYE_THRESHOLD = 242 * 4.33; // £242/week * 4.33 weeks/month = £1,047.86/month
const NI_RATE = 0.12; // 12% National Insurance
const NI_LOWER_THRESHOLD = 242 * 4.33; // £1,047.86/month
const NI_UPPER_THRESHOLD = 967 * 4.33; // £4,189.11/month
const OVERTIME_MULTIPLIER = 1.5;

// Validation
const calculatePayrollSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    workerIds: z.array(z.string()).optional(),
});

/**
 * Calculate payroll for period
 * POST /api/v1/payroll/calculate
 */
export const calculatePayroll = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const validatedData = calculatePayrollSchema.parse(req.body);

        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);

        // Build query
        const query: any = {
            organizationId: req.user.organizationId,
            status: 'approved',
            'clockIn.time': {
                $gte: startDate,
                $lte: endDate,
            },
        };

        if (validatedData.workerIds && validatedData.workerIds.length > 0) {
            query.workerId = { $in: validatedData.workerIds };
        }

        // Get all approved time entries
        const timeEntries = await TimeEntry.find(query).populate('workerId');

        // Group by worker
        const workerPayroll: any = {};

        for (const entry of timeEntries) {
            const workerId = entry.workerId._id.toString();

            if (!workerPayroll[workerId]) {
                workerPayroll[workerId] = {
                    worker: entry.workerId,
                    totalMinutes: 0,
                    regularMinutes: 0,
                    overtimeMinutes: 0,
                    entries: [],
                };
            }

            workerPayroll[workerId].totalMinutes += entry.totalMinutes || 0;
            workerPayroll[workerId].entries.push(entry);
        }

        // Calculate pay for each worker
        const payrollResults = [];

        for (const workerId in workerPayroll) {
            const data = workerPayroll[workerId];
            const worker = data.worker;

            // Get hourly rate
            const hourlyRate = worker.hourlyRate || 11.44; // Default to UK minimum wage

            // Calculate hours
            const totalHours = data.totalMinutes / 60;

            // UK Working Time Regulations: 48 hours/week
            const weeksInPeriod =
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
            const regularHoursCap = 48 * weeksInPeriod;

            let regularHours = totalHours;
            let overtimeHours = 0;

            if (totalHours > regularHoursCap) {
                regularHours = regularHoursCap;
                overtimeHours = totalHours - regularHoursCap;
            }

            // Calculate earnings
            const regularPay = regularHours * hourlyRate;
            const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
            const grossPay = regularPay + overtimePay;

            // Calculate deductions
            const monthlyGross = grossPay; // Assuming monthly payroll
            let paye = 0;
            let ni = 0;

            // PAYE calculation (simplified)
            if (monthlyGross > PAYE_THRESHOLD) {
                paye = (monthlyGross - PAYE_THRESHOLD) * PAYE_RATE;
            }

            // National Insurance calculation (simplified)
            if (monthlyGross > NI_LOWER_THRESHOLD) {
                const niableIncome = Math.min(monthlyGross, NI_UPPER_THRESHOLD) - NI_LOWER_THRESHOLD;
                ni = niableIncome * NI_RATE;
            }

            // Net pay
            const netPay = grossPay - paye - ni;

            payrollResults.push({
                workerId: worker._id,
                workerName: `${worker.name.first} ${worker.name.last}`,
                email: worker.email,
                regularHours: Math.round(regularHours * 100) / 100,
                overtimeHours: Math.round(overtimeHours * 100) / 100,
                hourlyRate: Math.round(hourlyRate * 100) / 100,
                grossPay: Math.round(grossPay * 100) / 100,
                paye: Math.round(paye * 100) / 100,
                ni: Math.round(ni * 100) / 100,
                netPay: Math.round(netPay * 100) / 100,
                entriesCount: data.entries.length,
            });
        }

        res.json({
            payrollId: Date.now().toString(), // Simple ID for this payroll run
            period: {
                startDate,
                endDate,
            },
            results: payrollResults,
            summary: {
                totalWorkers: payrollResults.length,
                totalGrossPay: payrollResults.reduce((sum, r) => sum + r.grossPay, 0),
                totalPAYE: payrollResults.reduce((sum, r) => sum + r.paye, 0),
                totalNI: payrollResults.reduce((sum, r) => sum + r.ni, 0),
                totalNetPay: payrollResults.reduce((sum, r) => sum + r.netPay, 0),
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        console.error('Calculate payroll error:', error);
        res.status(500).json({ error: 'Failed to calculate payroll' });
    }
};

/**
 * Export payroll as CSV
 * GET /api/v1/payroll/:id/export
 */
export const exportPayroll = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // For simplicity, re-calculate based on query params
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate and endDate are required' });
            return;
        }

        // Reuse calculate logic
        const query: any = {
            organizationId: req.user.organizationId,
            status: 'approved',
            'clockIn.time': {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string),
            },
        };

        const timeEntries = await TimeEntry.find(query).populate('workerId');

        // Group by worker (same logic as above)
        const workerPayroll: any = {};

        for (const entry of timeEntries) {
            const workerId = entry.workerId._id.toString();

            if (!workerPayroll[workerId]) {
                workerPayroll[workerId] = {
                    worker: entry.workerId,
                    totalMinutes: 0,
                    entries: [],
                };
            }

            workerPayroll[workerId].totalMinutes += entry.totalMinutes || 0;
        }

        // Calculate and prepare CSV data
        const csvData = [];

        for (const workerId in workerPayroll) {
            const data = workerPayroll[workerId];
            const worker = data.worker;
            const hourlyRate = worker.hourlyRate || 11.44;
            const totalHours = data.totalMinutes / 60;

            const weeksInPeriod =
                (new Date(endDate as string).getTime() - new Date(startDate as string).getTime()) /
                (1000 * 60 * 60 * 24 * 7);
            const regularHoursCap = 48 * weeksInPeriod;

            let regularHours = totalHours;
            let overtimeHours = 0;

            if (totalHours > regularHoursCap) {
                regularHours = regularHoursCap;
                overtimeHours = totalHours - regularHoursCap;
            }

            const grossPay = regularHours * hourlyRate + overtimeHours * hourlyRate * OVERTIME_MULTIPLIER;
            const monthlyGross = grossPay;
            let paye = monthlyGross > PAYE_THRESHOLD ? (monthlyGross - PAYE_THRESHOLD) * PAYE_RATE : 0;
            let ni = 0;
            if (monthlyGross > NI_LOWER_THRESHOLD) {
                const niableIncome = Math.min(monthlyGross, NI_UPPER_THRESHOLD) - NI_LOWER_THRESHOLD;
                ni = niableIncome * NI_RATE;
            }

            const netPay = grossPay - paye - ni;

            csvData.push({
                WorkerId: worker._id,
                Name: `${worker.name.first} ${worker.name.last}`,
                Email: worker.email,
                RegularHours: Math.round(regularHours * 100) / 100,
                OvertimeHours: Math.round(overtimeHours * 100) / 100,
                HourlyRate: Math.round(hourlyRate * 100) / 100,
                GrossPay: Math.round(grossPay * 100) / 100,
                PAYE: Math.round(paye * 100) / 100,
                NI: Math.round(ni * 100) / 100,
                NetPay: Math.round(netPay * 100) / 100,
            });
        }

        // Generate CSV
        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=payroll-${startDate}-${endDate}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export payroll error:', error);
        res.status(500).json({ error: 'Failed to export payroll' });
    }
};
