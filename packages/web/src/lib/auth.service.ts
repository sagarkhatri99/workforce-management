import { api } from './api';
import { User } from '@/types';

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export const authService = {
    async login(credentials: Record<string, string>): Promise<LoginResponse> {
        const { data } = await api.post<LoginResponse>('/auth/login', credentials);
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async register(organizationData: Record<string, string>): Promise<LoginResponse> {
        const { data } = await api.post<LoginResponse>('/auth/register', organizationData);
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    async logout(): Promise<void> {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
        }
    },

    getCurrentUser(): User | null {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};
