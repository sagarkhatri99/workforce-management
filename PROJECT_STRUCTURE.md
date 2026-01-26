# Workforce Management SaaS - Project Structure

## Directory Layout

```
workforce-management-saas/
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── web-deploy.yml
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   ├── redis.ts
│   │   │   │   └── index.ts
│   │   │   ├── models/
│   │   │   │   ├── Organization.ts
│   │   │   │   ├── Location.ts
│   │   │   │   ├── User.ts
│   │   │   │   ├── Shift.ts
│   │   │   │   ├── TimeEntry.ts
│   │   │   │   └── Application.ts
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── organization.controller.ts
│   │   │   │   ├── location.controller.ts
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── shift.controller.ts
│   │   │   │   ├── timeclock.controller.ts
│   │   │   │   └── payroll.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── geofence.service.ts
│   │   │   │   ├── payroll.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── tenant.middleware.ts
│   │   │   │   ├── validation.middleware.ts
│   │   │   │   └── rateLimit.middleware.ts
│   │   │   ├── utils/
│   │   │   │   ├── jwt.util.ts
│   │   │   │   ├── bcrypt.util.ts
│   │   │   │   ├── haversine.util.ts
│   │   │   │   └── validators.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── organization.routes.ts
│   │   │   │   ├── shift.routes.ts
│   │   │   │   └── index.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── .env.example
│   │   ├── .gitignore
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   └── register/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── shifts/
│   │   │   │   ├── time-entries/
│   │   │   │   ├── payroll/
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/
│   │   │   │   ├── shifts/
│   │   │   │   └── layouts/
│   │   │   ├── lib/
│   │   │   │   ├── api.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── utils.ts
│   │   │   ├── store/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── shiftsSlice.ts
│   │   │   │   └── store.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── public/
│   │   ├── .env.local.example
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── mobile/
│       ├── src/
│       │   ├── screens/
│       │   │   ├── Auth/
│       │   │   │   ├── LoginScreen.tsx
│       │   │   │   └── RegisterScreen.tsx
│       │   │   ├── Home/
│       │   │   │   └── HomeScreen.tsx
│       │   │   ├── Shifts/
│       │   │   │   ├── AvailableShiftsScreen.tsx
│       │   │   │   └── MyShiftsScreen.tsx
│       │   │   └── TimeClock/
│       │   │       └── ClockInOutScreen.tsx
│       │   ├── components/
│       │   │   ├── common/
│       │   │   └── shifts/
│       │   ├── navigation/
│       │   │   ├── AppNavigator.tsx
│       │   │   └── AuthNavigator.tsx
│       │   ├── services/
│       │   │   ├── api.ts
│       │   │   ├── geolocation.ts
│       │   │   └── syncQueue.ts
│       │   ├── store/
│       │   │   └── store.ts
│       │   ├── utils/
│       │   │   └── helpers.ts
│       │   └── App.tsx
│       ├── android/
│       ├── ios/
│       ├── app.json
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── docker-compose.yml
├── .gitignore
├── package.json
└── README.md
```

## Tech Stack Summary

### Backend (`packages/backend`)
- **Runtime**: Node.js 18+
- **Framework**: Express + TypeScript
- **Database**: MongoDB 6+ (self-hosted)
- **Cache**: Upstash Redis
- **Validation**: Zod
- **Authentication**: JWT + bcrypt

### Web (`packages/web`)
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: Material-UI (MUI)
- **State**: Redux Toolkit
- **Forms**: React Hook Form + Zod
- **Deployment**: Vercel

### Mobile (`packages/mobile`)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State**: Redux Toolkit (shared with web)
- **Storage**: AsyncStorage
- **Geolocation**: react-native-geolocation-service

## Environment Variables

### Backend (`.env`)
```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/workforce?authSource=admin

# Redis (Upstash)
REDIS_URL=https://your-redis.upstash.io

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com

# Firebase (FCM)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# CORS
ALLOWED_ORIGINS=http://localhost:3001,https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=300
```

### Web (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_NAME=Workforce Management
```

### Mobile (`app.json`)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://localhost:3000/api/v1"
    }
  }
}
```

## Quick Start Commands

```bash
# Install dependencies (root)
npm install

# Install all package dependencies
npm run install:all

# Development
npm run dev:backend   # Starts backend on :3000
npm run dev:web       # Starts Next.js on :3001
npm run dev:mobile    # Opens Expo

# Build
npm run build:backend
npm run build:web

# Test
npm run test:backend
npm run test:web

# Deploy
npm run deploy:web    # Vercel
```

## Database Collections

1. **organizations** - Multi-tenant organizations
2. **locations** - Work sites with geofencing
3. **users** - Workers, managers, admins
4. **shifts** - Manual shift scheduling
5. **timeEntries** - Clock in/out records
6. **applications** - Shift bidding
7. **notifications** - Redis only (no DB collection)

## Next Steps

1. ✅ Run `azure-vm-setup.sh` on Azure VM
2. ⬜ Create monorepo structure
3. ⬜ Set up MongoDB schemas
4. ⬜ Implement authentication
5. ⬜ Deploy backend to Azure VM
6. ⬜ Deploy web to Vercel
