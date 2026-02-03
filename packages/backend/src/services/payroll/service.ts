import prisma from '../../utils/prisma';
import { PayrollCalculator } from './calculator';
import { CreatePeriodDto, CalculationResponseDto, PayrollReportDto, PayrollSummaryDto } from './types';
import { Parser } from 'json2csv';
import { PayrollStatus, Role } from '@prisma/client';

export class PayrollService {
  private calculator: PayrollCalculator;

  constructor() {
    this.calculator = new PayrollCalculator();
  }

  async createPeriod(data: CreatePeriodDto, userId: string) {
    // Calculate start/end dates
    // Simple logic: 1st to last day of month
    const startDate = new Date(Date.UTC(data.year, data.month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(data.year, data.month, 0, 23, 59, 59, 999));

    return prisma.payrollPeriod.create({
      data: {
        month: data.month,
        year: data.year,
        startDate,
        endDate,
        status: PayrollStatus.OPEN,
        calculatedBy: userId
      }
    });
  }

  async getAllPeriods() {
      return prisma.payrollPeriod.findMany({
          orderBy: [{ year: 'desc' }, { month: 'desc' }]
      });
  }

  async getPeriodById(id: string): Promise<PayrollReportDto | null> {
      const period = await prisma.payrollPeriod.findUnique({
          where: { id },
          include: {
              summaries: {
                  include: {
                      user: {
                          select: { name: true, email: true, role: true }
                      }
                  }
              }
          }
      });

      if (!period) return null;

      const summaries: PayrollSummaryDto[] = period.summaries.map(s => ({
          userName: s.user.name || 'Unknown',
          userEmail: s.user.email,
          role: s.user.role,
          regularHours: s.totalRegularHours,
          overtimeHours: s.totalOvertimeHours,
          totalHours: s.totalHours,
          grossPay: s.grossPay,
          shiftCount: s.shiftCount,
          hasAnomalies: s.hasAnomalies,
          anomalyCount: s.anomalyCount
      }));

      const totals = {
          totalEmployees: summaries.length,
          totalRegularHours: summaries.reduce((sum, s) => sum + s.regularHours, 0),
          totalOvertimeHours: summaries.reduce((sum, s) => sum + s.overtimeHours, 0),
          totalGrossPay: summaries.reduce((sum, s) => sum + s.grossPay, 0),
          employeesWithAnomalies: summaries.filter(s => s.hasAnomalies).length
      };

      return {
          period: {
              id: period.id,
              month: period.month,
              year: period.year,
              status: period.status,
              startDate: period.startDate,
              endDate: period.endDate
          },
          summaries,
          totals
      };
  }

  async calculatePayroll(periodId: string, userId: string): Promise<CalculationResponseDto> {
    const period = await prisma.payrollPeriod.findUnique({
        where: { id: periodId }
    });

    if (!period) throw new Error('Period not found');
    if (period.status === PayrollStatus.COMPLETED) throw new Error('Period is already completed');

    // Fetch users (workers)
    const users = await prisma.user.findMany({
        where: { role: Role.WORKER },
        include: {
            clocks: {
                where: {
                    timestamp: {
                        gte: period.startDate,
                        lte: period.endDate
                    }
                }
            }
        }
    });

    let processedCount = 0;
    let anomalyCount = 0;
    const errors: string[] = [];

    // Process each user
    for (const user of users) {
        try {
            const result = this.calculator.calculatePayrollForUser(
                user.id,
                user.clocks,
                user.hourlyRate || 0
            );

            // Save Summary
            // Use transaction to update summary and anomalies
            await prisma.$transaction(async (tx) => {
                // Upsert summary
                const summary = await tx.payrollSummary.upsert({
                    where: {
                        payrollPeriodId_userId: {
                            payrollPeriodId: periodId,
                            userId: user.id
                        }
                    },
                    update: {
                        totalRegularHours: result.totalRegularHours,
                        totalOvertimeHours: result.totalOvertimeHours,
                        totalHours: result.totalHours,
                        grossPay: result.grossPay,
                        shiftCount: result.shiftCount,
                        clockEventsCount: user.clocks.length / 2, // Approx
                        hasAnomalies: result.hasAnomalies,
                        anomalyCount: result.anomalies.length,
                        generatedAt: new Date()
                    },
                    create: {
                        payrollPeriodId: periodId,
                        userId: user.id,
                        totalRegularHours: result.totalRegularHours,
                        totalOvertimeHours: result.totalOvertimeHours,
                        totalHours: result.totalHours,
                        grossPay: result.grossPay,
                        shiftCount: result.shiftCount,
                        clockEventsCount: user.clocks.length / 2,
                        hasAnomalies: result.hasAnomalies,
                        anomalyCount: result.anomalies.length
                    }
                });

                // Clear old anomalies
                await tx.payrollAnomaly.deleteMany({
                    where: { payrollSummaryId: summary.id }
                });

                // Insert new anomalies
                if (result.anomalies.length > 0) {
                    await tx.payrollAnomaly.createMany({
                        data: result.anomalies.map(a => ({
                            payrollSummaryId: summary.id,
                            type: a.type!,
                            date: a.date!,
                            description: a.description!,
                            clockEventId: a.clockEventId
                        }))
                    });
                    anomalyCount += result.anomalies.length;
                }
            });

            processedCount++;
        } catch (e: any) {
            console.error(`Error processing user ${user.id}:`, e);
            errors.push(`User ${user.email}: ${e.message}`);
        }
    }

    // Update period metadata
    await prisma.payrollPeriod.update({
        where: { id: periodId },
        data: {
            calculatedBy: userId,
            updatedAt: new Date()
        }
    });

    return {
        processed: processedCount,
        anomalies: anomalyCount,
        errors,
        completedAt: new Date()
    };
  }

  async exportToCsv(periodId: string): Promise<string> {
      const report = await this.getPeriodById(periodId);
      if (!report) throw new Error('Period not found');

      const data = report.summaries.map(s => ({
          Employee: s.userName,
          Email: s.userEmail,
          Role: s.role,
          'Regular Hours': s.regularHours.toFixed(2),
          'Overtime Hours': s.overtimeHours.toFixed(2),
          'Total Hours': s.totalHours.toFixed(2),
          'Gross Pay': s.grossPay.toFixed(2),
          'Shift Count': s.shiftCount,
          'Anomalies': s.anomalyCount
      }));

      const parser = new Parser();
      return parser.parse(data);
  }
}
