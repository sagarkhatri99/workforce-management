# Workforce Management SaaS - Architecture & User Flows

## Architecture Overview

The system is built as a **Multi-tenant SaaS** with strict data isolation.

### 1. Data Layer (MongoDB)
- **Tenant Isolation**: Every document (User, Shift, Location, TimeEntry) contains an `organizationId`. Middleware ensures that queries are automatically scoped to the authenticated user's organization.
- **Geospatial Indexing**: Locations use `2dsphere` indexes for efficient geofence validation.
- **Data Retention**: UK-compliant 2-year retention for payroll-related data (TimeEntries), with anonymization for deleted users.

### 2. Security & Auth Layer
- **JWT Authentication**: Short-lived (15m) access tokens + long-lived (7d) refresh tokens.
- **RBAC (Role-Based Access Control)**:
  - `Admin`: Full control over organization, users, and billing.
  - `Manager`: Manage shifts, approve time entries, calculate payroll.
  - `Worker`: View assigned/available shifts, apply for shifts, clock in/out, view own data.
- **Rate Limiting**: Protects against brute-force and DDoS (300 req/min).

### 3. Business Logic (Controllers & Services)
- **Geofencing Engine**: Haversine formula-based validation for clock-in/out, flagging suspicious entries for manager review.
- **Payroll Engine**: Automated UK PAYE and National Insurance calculations, handles overtime (48hr cap validation).
- **Shift Bidding**: A workflow where workers apply for published shifts, and managers approve to finalize assignment.

---

## User Flows

### 1. Onboarding & Setup (Admin)
1. **Register**: Admin creates organization and admin account.
2. **Setup Locations**: Admin/Manager defines work sites with GPS coordinates and radius.
3. **Invite Staff**: Admin/Manager sends email invites to workers/managers.
4. **Define Roles**: Admin assigns appropriate roles to new users.

### 2. Shift Scheduling & Bidding (Manager/Worker)
1. **Create Shift**: Manager creates a "Draft" shift for a location.
2. **Publish**: Manager publishes the shift. It becomes visible to eligible workers.
3. **Apply**: Workers receive notifications (future) and apply for the shift.
4. **Approve**: Manager reviews applicants and approves one (or multiple, based on capacity).
5. **Assign**: Approved worker is automatically assigned and notified.

### 3. Time Clock & Payroll (Worker/Manager)
1. **Clock In**: Worker arrives at location, app verifies GPS. If within geofence, entry is created.
2. **Clock Out**: Worker leaves, app verifies GPS. Total duration is calculated.
3. **Review**: Manager receives alerts for "Flagged" entries (outside fence or suspicious activity).
4. **Approve Time**: Manager approves verified time entries.
5. **Calculate Payroll**: At the end of the period, Manager runs payroll report. System calculates UK taxes and exports CSV for bank transfers.

### 4. GDPR Compliance (User)
1. **Data Access**: User requests a data export. System generates a JSON of all personal info and work history.
2. **Right to Erasure**: User deletes account. Personal info is anonymized (names, emails, phone), but time logs are kept for compliance with UK employment laws.
