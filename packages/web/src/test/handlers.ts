import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3000/api/v1';

export const handlers = [
    http.post(`${API_URL}/auth/login`, async () => {
        return HttpResponse.json({
            accessToken: 'fake-access-token',
            refreshToken: 'fake-refresh-token',
            user: {
                id: '1',
                email: 'test@example.com',
                name: { first: 'John', last: 'Doe' },
                role: 'admin',
                organizationId: 'org1'
            }
        });
    }),

    http.get(`${API_URL}/users`, () => {
        return HttpResponse.json({
            users: [
                {
                    _id: '1',
                    email: 'alice@example.com',
                    name: { first: 'Alice', last: 'Walker' },
                    role: 'worker',
                    status: 'active'
                }
            ]
        });
    })
];
