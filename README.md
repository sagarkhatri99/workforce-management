# Workforce Management System (MVP)

A lightweight, PWA-enabled workforce management system built for staffing agencies.

## Features

*   **Role-Based Access**: Admin, Manager, and Worker roles.
*   **Shift Scheduling**: Create, publish, and manage shifts.
*   **Worker Portal**: View available shifts, claim shifts, and track time.
*   **Time Tracking**: Geolocation-aware clock in/out (mocked for MVP).
*   **Dashboard**: Real-time stats on shift fulfillment and costs.
*   **Exports**: CSV export of timesheets.
*   **PWA**: Installable on mobile devices with offline caching for key data.
*   **GDPR Compliance**: Data privacy page and export capabilities.

## Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS, React Query, PWA.
*   **Backend**: Node.js (Express), Prisma ORM, PostgreSQL.
*   **Infrastructure**: Docker Compose (Nginx + Backend + Postgres).

## Quick Start (Production/VM)

The easiest way to run the full stack is via Docker Compose.

### Prerequisites
*   Docker & Docker Compose installed on the host (e.g., Ubuntu VM).
*   Git.

### Deployment Steps

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd workforce-management
    ```

2.  **Prepare the environment**:
    Create a `.env` file in the root directory to override default credentials (highly recommended for production):
    ```bash
    # .env
    POSTGRES_USER=admin
    POSTGRES_PASSWORD=secure_password
    POSTGRES_DB=workforce
    JWT_SECRET=your_secure_jwt_secret
    ```

    Create the data directory:
    ```bash
    mkdir postgres-data
    ```

3.  **Start the services**:
    ```bash
    docker-compose -f docker-compose.prod.yml up --build -d
    ```

4.  **Access the application**:
    *   **Frontend**: `http://<vm-ip-or-localhost>` (also exposed on port 3000)
    *   **Backend API**: `http://<vm-ip-or-localhost>:3001/api/v1` (internal API is proxied via Nginx on port 80/443)

5.  **Default Users (Seeded)**:
    *   **Admin**: `admin1@workforce.com` / `password123`
    *   **Manager**: `manager1@workforce.com` / `password123`
    *   **Worker**: `worker1@workforce.com` / `password123`

## Development Setup

If you want to run the project locally without Docker for development:

1.  **Backend**:
    ```bash
    cd packages/backend
    npm install
    # Set up .env (see .env.example)
    # Ensure local Postgres is running or use SQLite (dev only)
    npm run dev
    ```

2.  **Frontend**:
    ```bash
    cd packages/web
    npm install
    npm run dev
    ```

## API Endpoints

| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| GET | `/api/v1/shifts` | List shifts | Auth |
| POST | `/api/v1/shifts` | Create shift | Admin/Mgr |
| PATCH | `/api/v1/shifts/:id/claim` | Claim a shift | Worker |
| POST | `/api/v1/clock/:id` | Clock In/Out | Worker |
| GET | `/api/v1/dashboard/stats` | View stats | Auth |
| GET | `/api/v1/export/timesheet` | Export CSV | Admin/Mgr |
| POST | `/api/v1/dsr/request` | Request Data Access/Erasure | Auth |

## GDPR Compliance

*   **Right to Access**: Workers can view their shifts and history. Full data export available via API.
*   **Right to Erasure**: Data is retained for 2 years for legal compliance, then anonymized.
*   **Privacy Policy**: Accessible at `/privacy`.
*   **Data Security**: Passwords hashed (bcrypt), JWT authentication, HTTPS ready (via Nginx config).

## Environment Variables

Create a `.env` file in `packages/backend` for local dev (Docker handles this automatically in prod):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
ALLOWED_ORIGINS="http://localhost"
SMTP_HOST="smtp.provider.com"
SMTP_USER="user"
SMTP_PASS="pass"
FROM_EMAIL="noreply@workforce.com"
```
