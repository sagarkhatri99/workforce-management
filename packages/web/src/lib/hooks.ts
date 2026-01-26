import useSWR from 'swr';
import { api } from './api';
import { User, Shift, TimeEntry, PayrollResult, PayrollSummary } from '@/types';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useStaff = () => {
    const { data, error, mutate } = useSWR<{ users: User[] }>('/users', fetcher);
    return {
        staff: data?.users || [],
        isLoading: !error && !data,
        isError: error,
        mutate
    };
};

export const useShifts = (filters: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(filters as any).toString();
    const { data, error, mutate } = useSWR<{ shifts: Shift[] }>(`/shifts?${query}`, fetcher);
    return {
        shifts: data?.shifts || [],
        isLoading: !error && !data,
        isError: error,
        mutate
    };
};

export const useTimeEntries = (filters: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(filters as any).toString();
    const { data, error, mutate } = useSWR<{ entries: TimeEntry[] }>(`/timeclock/entries?${query}`, fetcher);
    return {
        entries: data?.entries || [],
        isLoading: !error && !data,
        isError: error,
        mutate
    };
};

export const usePayroll = (startDate: string, endDate: string) => {
    const { data, error, mutate } = useSWR<{ results: PayrollResult[], summary: PayrollSummary }>(
        startDate && endDate ? [`/payroll/calculate`, startDate, endDate] : null,
        () => api.post('/payroll/calculate', { startDate, endDate }).then(res => res.data)
    );
    return {
        payroll: data?.results || [],
        summary: data?.summary || { totalGrossPay: 0, totalPAYE: 0, totalNI: 0, totalNetPay: 0 },
        isLoading: !error && !data,
        isError: error,
        mutate
    };
};
