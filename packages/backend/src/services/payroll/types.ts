import { ClockEvent, AnomalyType, PayrollStatus, PayrollAnomaly } from '@prisma/client';

export interface WorkSession {
  inEvent: ClockEvent;
  outEvent: ClockEvent | null;
  duration: number; // milliseconds
  isValid: boolean;
  anomaly?: AnomalyType;
}

export interface DailyHours {
  date: string; // YYYY-MM-DD
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  sessions: WorkSession[];
  anomalies: AnomalyType[];
}

export interface CalculationResult {
  userId: string;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalHours: number;
  grossPay: number;
  shiftCount: number;
  dailyBreakdown: DailyHours[];
  anomalies: Partial<PayrollAnomaly>[]; // Use Partial because we create these before DB insert
  hasAnomalies: boolean;
}

// DTOs
export interface CreatePeriodDto {
  month: number;
  year: number;
}

export interface CalculationResponseDto {
  processed: number;
  anomalies: number;
  errors: string[];
  completedAt: Date;
}

export interface PayrollSummaryDto {
  userName: string;
  userEmail: string;
  role: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  grossPay: number;
  shiftCount: number;
  hasAnomalies: boolean;
  anomalyCount: number;
}

export interface PayrollReportDto {
  period: {
    id: string;
    month: number;
    year: number;
    status: PayrollStatus;
    startDate: Date;
    endDate: Date;
  };
  summaries: PayrollSummaryDto[];
  totals: {
    totalEmployees: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalGrossPay: number;
    employeesWithAnomalies: number;
  };
}
