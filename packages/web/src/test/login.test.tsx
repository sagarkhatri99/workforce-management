import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { authService } from '@/lib/auth.service';
import { vi } from 'vitest';

// Mock useRouter
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
    }),
}));

describe('LoginPage', () => {
    it('renders login form correctly', () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/Organization ID/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('shows error message on failed login', async () => {
        // Override handler for this test
        const { server } = await import('@/test/setup');
        const { http, HttpResponse } = await import('msw');
        server.use(
            http.post('http://localhost:3000/api/v1/auth/login', () => {
                return new HttpResponse(
                    JSON.stringify({ error: 'Invalid credentials' }),
                    { status: 401 }
                );
            })
        );

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/Organization ID/i), { target: { value: 'test-org' } });
        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'error@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong-pass' } });

        fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

        await waitFor(() => {
            expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
        });
    });
});
