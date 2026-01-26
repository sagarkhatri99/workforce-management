# Week 2: Location & User Management - Detailed Implementation Plan

## Overview
Week 2 focuses on building the location and user management systems, including the web dashboard foundation. By the end of this week, admins will be able to create locations with geofencing and invite users to their organization.

---

## Backend Tasks (3-4 days)

### Day 1-2: Location Management

#### Location CRUD API
**File**: `packages/backend/src/controllers/location.controller.ts`

```typescript
// Endpoints to implement:
POST   /api/v1/locations              // Create location
GET    /api/v1/locations              // List all locations for org
GET    /api/v1/locations/:id          // Get single location
PUT    /api/v1/locations/:id          // Update location
DELETE /api/v1/locations/:id          // Soft delete (set active=false)
```

**Implementation Details**:
- Validate coordinates (lat: -90 to 90, lng: -180 to 180)
- Default geofence radius: 150m (range: 50m - 500m)
- Auto-populate timezone from coordinates (use `@vvo/tzdb` library)
- Only admins/managers can create locations
- Worker role can only read locations

**Validation Schema** (Zod):
```typescript
const createLocationSchema = z.object({
  name: z.string().min(2).max(255),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  radius: z.number().min(50).max(500).default(150),
  timezone: z.string().optional(),
});
```

#### Geospatial Queries
**File**: `packages/backend/src/services/location.service.ts`

Implement:
- `findNearbyLocations(lat, lng, maxDistance)` - Find locations within radius
- `validateGeofence(locationId, lat, lng)` - Check if point is within geofence
- Use MongoDB's `$geoNear` aggregation for efficient queries

---

### Day 2-3: User Management

#### User CRUD API
**File**: `packages/backend/src/controllers/user.controller.ts`

```typescript
// Endpoints:
POST   /api/v1/users/invite           // Invite user (send email)
GET    /api/v1/users                  // List users in organization
GET    /api/v1/users/:id              // Get user details
PUT    /api/v1/users/:id              // Update user
DELETE /api/v1/users/:id              // Deactivate user (set status=inactive)
PUT    /api/v1/users/:id/role         // Change user role (admin only)
```

**User Invitation Flow**:
1. Admin creates invitation (email + role)
2. System generates unique invite token (valid 48 hours)
3. Send email via Resend with registration link
4. User clicks link → redirected to complete registration
5. User sets password → account activated

**Email Template** (Resend):
```
Subject: You're invited to join [Organization Name]

Hi there!

[Admin Name] has invited you to join [Organization Name] on Workforce Management.

Click here to set your password and get started:
https://yourapp.com/accept-invite?token=XXXXXXXX

This link expires in 48 hours.
```

#### User Filters
Support query parameters:
- `?role=worker` - Filter by role
- `?status=active` - Filter by status
- `?search=john` - Search by name/email
- `?limit=20&page=1` - Pagination

---

### Day 3: Email Service Integration

**File**: `packages/backend/src/services/email.service.ts`

```typescript
import { Resend } from 'resend';

export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendInvitation(to: string, inviteToken: string, orgName: string) {
    await this.resend.emails.send({
      from: process.env.FROM_EMAIL,
      to,
      subject: `You're invited to join ${orgName}`,
      html: this.generateInviteEmail(inviteToken, orgName),
    });
  }

  async sendPasswordReset(to: string, resetToken: string) {
    // Similar implementation
  }
}
```

**Dependencies**:
```bash
npm install resend
```

---

## Frontend Tasks (4-5 days)

### Day 1-2: Next.js Setup

#### Initialize Web App
```bash
cd packages/web
npx create-next-app@latest . --typescript --app --use-npm
npm install @mui/material @emotion/react @emotion/styled
npm install @reduxjs/toolkit react-redux
npm install axios react-hook-form zod @hookform/resolvers
```

#### Project Structure
```
packages/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── locations/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── users/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── locations/
│   │   ├── LocationList.tsx
│   │   ├── LocationForm.tsx
│   │   └── LocationMap.tsx
│   └── users/
│       ├── UserList.tsx
│       ├── InviteUserModal.tsx
│       └── UserCard.tsx
├── lib/
│   ├── api.ts             // Axios instance
│   └── validators.ts      // Zod schemas
└── store/
    ├── authSlice.ts
    ├── locationsSlice.ts
    └── store.ts
```

---

### Day 2-3: Authentication Pages

#### Login Page
**File**: `packages/web/src/app/(auth)/login/page.tsx`

Features:
- Email + password form
- Organization slug field
- "Remember me" checkbox
- Link to register page
- Error handling (invalid credentials, inactive account)

**Material-UI Components**:
- `TextField` for inputs
- `Button` with loading state
- `Alert` for error messages
- `Card` for form container

#### Register Page
**File**: `packages/web/src/app/(auth)/register/page.tsx`

Multi-step form:
1. Organization details (name, slug)
2. Admin details (name, email, password)
3. Confirmation

Validation:
- Slug format: lowercase, numbers, hyphens only
- Password: min 8 chars, 1 uppercase, 1 number
- Email: valid format, not already registered

---

### Day 3-4: Location Management UI

#### Location List Page
**File**: `packages/web/src/app/locations/page.tsx`

Features:
- Table view with columns: Name, Address, Radius, Status, Actions
- "Create Location" button (opens modal)
- Search bar
- Filter by active/inactive

#### Location Form Modal
**File**: `packages/web/src/components/locations/LocationForm.tsx`

Fields:
- Location name
- Map picker (click to set coordinates) - use `react-leaflet`
- Geofence radius slider (50m - 500m)
- Timezone (auto-populated)

**Map Integration**:
```bash
npm install react-leaflet leaflet
```

Use OpenStreetMap (free, no API key needed):
```typescript
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

<MapContainer center={[51.505, -0.09]} zoom={13}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker position={[51.505, -0.09]} />
</MapContainer>
```

---

### Day 4-5: User Management UI

#### User List Page
**File**: `packages/web/src/app/users/page.tsx`

Features:
- Data table with: Name, Email, Role, Status, Actions
- "Invite User" button
- Role badges (color-coded: admin=red, manager=blue, worker=green)
- Status indicator (active/inactive)
- Edit role modal (admin only)

#### Invite User Modal
**File**: `packages/web/src/components/users/InviteUserModal.tsx`

Form:
- Email address
- Role dropdown (admin/manager/worker)
- Send button

Success message:
"Invitation sent to [email]. They will receive an email with instructions to join."

---

## Redux Store Setup

### Auth Slice
**File**: `packages/web/src/store/authSlice.ts`

```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Actions:
- login(email, password, orgSlug)
- register(orgData, userData)
- logout()
- refreshToken()
- getCurrentUser()
```

### Locations Slice
**File**: `packages/web/src/store/locationsSlice.ts`

```typescript
interface LocationsState {
  locations: Location[];
  selectedLocation: Location | null;
  loading: boolean;
  error: string | null;
}

// Actions:
- fetchLocations()
- createLocation(data)
- updateLocation(id, data)
- deleteLocation(id)
```

---

## Deployment (Vercel)

### Step 1: Connect GitHub Repository
1. Push code to GitHub
2. Go to Vercel dashboard
3. Click "Import Project"
4. Select repository

### Step 2: Configure Build
```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Root Directory: packages/web
```

### Step 3: Environment Variables
Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=http://YOUR_AZURE_VM_IP:3000/api/v1
```

### Step 4: Deploy
- Push to `main` branch → auto-deploy
- Vercel provides URL: `https://workforce-mgmt-xxx.vercel.app`

---

## Testing Checklist

### Backend Tests
- [ ] Location CRUD operations work
- [ ] Geofence validation returns correct Boolean
- [ ] User invitation sends email
- [ ] Only admin can change user roles
- [ ] Multi-tenant isolation (org A can't see org B locations)

### Frontend Tests
- [ ] Login redirects to dashboard
- [ ] Register creates organization + admin user
- [ ] Location map picker sets coordinates correctly
- [ ] Invite user shows success message
- [ ] Redux store persists auth token

### Integration Tests
- [ ] Create location → appears in list immediately
- [ ] Invite user → receives email → clicks link → completes registration
- [ ] Change user role → reflected in UI

---

## Week 2 Deliverables

✅ **Backend**:
- Location CRUD API (5 endpoints)
- User CRUD API (6 endpoints)
- Email service integration (Resend)
- Geospatial query utilities

✅ **Frontend**:
- Login/register pages
- Dashboard layout
- Location management (list, create, edit)
- User management (list, invite)
- Map integration for geofencing

✅ **Deployment**:
- Web app deployed to Vercel
- Environment variables configured
- API connected to Azure VM backend

---

## Key Decisions for Week 2

1. **Map Provider**: OpenStreetMap (free, no API key)
2. **Email Service**: Resend (3K emails/month free)
3. **UI Library**: Material-UI v5
4. **State Management**: Redux Toolkit
5. **Form Handling**: React Hook Form + Zod

---

## Next: Week 3 Preview

Week 3 will focus on **manual shift scheduling**:
- Shift CRUD API
- Calendar view UI (FullCalendar.js)
- Publish shifts to workers
- Worker assignment interface

This plan should keep you on track to complete Week 2 in 7 days with a functional location and user management system!
