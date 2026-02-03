import api from './api';

export interface PayrollPeriod {
    id: string;
    month: number;
    year: number;
    status: 'OPEN' | 'LOCKED' | 'COMPLETED';
    startDate: string;
    endDate: string;
}

export interface PayrollSummary {
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

export interface PayrollReport {
    period: PayrollPeriod;
    summaries: PayrollSummary[];
    totals: {
        totalEmployees: number;
        totalRegularHours: number;
        totalOvertimeHours: number;
        totalGrossPay: number;
        employeesWithAnomalies: number;
    };
}

export const getPeriods = async () => {
    const { data } = await api.get<PayrollPeriod[]>('/payroll');
    return data;
};

export const createPeriod = async (month: number, year: number) => {
    const { data } = await api.post('/payroll', { month, year });
    return data;
};

export const getPeriodReport = async (id: string) => {
    const { data } = await api.get<PayrollReport>(`/payroll/${id}`);
    return data;
};

export const generatePayroll = async (id: string) => {
    const { data } = await api.post(`/payroll/${id}/generate`);
    return data;
};

export const downloadPayrollCsv = async (id: string) => {
    const response = await api.get(`/payroll/${id}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payroll-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
