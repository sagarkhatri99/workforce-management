export interface User {
    _id: string;
    email: string;
    name: {
        first: string;
        last: string;
    };
    role: 'admin' | 'manager' | 'worker';
    status: 'active' | 'inactive';
    organizationId: string;
}

export interface Location {
    _id: string;
    name: string;
    organizationId: string;
    address?: string;
    coordinates: {
        type: 'Point';
        coordinates: [number, number];
    };
    radius: number;
}

export interface Shift {
    _id: string;
    organizationId: string;
    locationId: string | Location;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    assignedWorkers: string[] | User[];
    capacity: number;
    status: 'draft' | 'published' | 'cancelled';
}

export interface TimeEntry {
    _id: string;
    organizationId: string;
    workerId: string | User;
    locationId: string | Location;
    shiftId?: string | Shift;
    clockIn: {
        time: string;
        location?: {
            type: 'Point';
            coordinates: [number, number];
        };
        withinFence: boolean;
    };
    clockOut?: {
        time: string;
        location?: {
            type: 'Point';
            coordinates: [number, number];
        };
        withinFence: boolean;
    };
    totalMinutes?: number;
    status: 'clocked_in' | 'clocked_out' | 'approved' | 'rejected';
    flaggedForReview: boolean;
    managerNotes?: string;
}

export interface PayrollResult {
    workerId: string;
    workerName: string;
    regularHours: number;
    overtimeHours: number;
    hourlyRate: number;
    grossPay: number;
    paye: number;
    ni: number;
    netPay: number;
}

export interface PayrollSummary {
    totalGrossPay: number;
    totalPAYE: number;
    totalNI: number;
    totalNetPay: number;
}
