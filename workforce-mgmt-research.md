# Comprehensive Workforce Management SaaS: Deep Research & Architecture Guide

**Target: Ubeya-Style Platform | 10,000+ Concurrent Users**

---

## TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack Recommendations](#technology-stack)
3. [MongoDB Schema Design](#mongodb-schema)
4. [Real-Time Notification Architecture](#real-time-notifications)
5. [Auto-Scheduling Algorithms](#auto-scheduling)
6. [MVP Feature Prioritization](#mvp-features)
7. [Geofencing Implementation](#geofencing)
8. [Payroll Calculation System](#payroll-system)
9. [Compliance & Security](#compliance-security)
10. [API Architecture & Integrations](#api-architecture)
11. [Mobile App Architecture (React Native)](#react-native-arch)
12. [System Design Patterns](#system-design)

---

## ARCHITECTURE OVERVIEW {#architecture-overview}

### High-Level Architecture for 10,000+ Concurrent Users

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
├──────────────────────┬──────────────────┬──────────────────┤
│  Web Dashboard       │  Mobile App      │  Admin Portal    │
│  (React + TypeScript)│  (React Native)  │  (React)         │
└──────────────────────┴──────────────────┴──────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
         ┌────────────────────▼────────────────────┐
         │      API GATEWAY / LOAD BALANCER        │
         │   (Kong/AWS API Gateway + CloudFlare)   │
         └────────────────────┬────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
┌───▼────────┐         ┌───────▼─────────┐      ┌──────▼──────┐
│  Auth Svc  │         │  Core Services  │      │ Real-Time   │
│  (OAuth2)  │         │   (Microsvcs)   │      │ Services    │
└────────────┘         └────────┬────────┘      │  (WebSocket)│
                                 │                └─────────────┘
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼────────┐      ┌──────▼──────┐      ┌────────▼────┐
    │  Scheduling │      │   Payroll   │      │   Time      │
    │  Engine     │      │   Engine    │      │   Clock     │
    └─────────────┘      └─────────────┘      └─────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │      DATA LAYER                                │
         ├─────────────────┬─────────────────────────────┤
         │ MongoDB Cluster │   Redis Cache (Sync Queue)  │
         │ (Multi-region)  │   Elasticsearch (Analytics) │
         └─────────────────┴─────────────────────────────┘
         │
    ┌────▼────────┬──────────────────┬──────────────────┐
    │ Message Q   │  Event Stream    │  File Storage    │
    │ (RabbitMQ)  │  (Kafka)         │  (S3)            │
    └─────────────┴──────────────────┴──────────────────┘
```

### Key Architectural Principles

**Microservices Approach:**
- Scheduling Service (independent scaling for peak load)
- Payroll Service (isolated compute for calculations)
- Time & Attendance Service (real-time processing)
- Notification Service (async, decoupled)
- Analytics Service (heavy computation)

**Database Strategy:**
- MongoDB as primary (flexible schema for workforce variations)
- Redis for cache/sync queue (real-time operations)
- Elasticsearch for analytics/search (scales independently)

**Concurrency Handling:**
- Load balancing across 3-5 API server instances
- Database connection pooling (20-50 connections per instance)
- Message queue for async operations (prevents thundering herd)

---

## TECHNOLOGY STACK RECOMMENDATIONS {#technology-stack}

### Backend Services

| Component | Recommended | Alternatives | Rationale |
|-----------|-------------|--------------|-----------|
| **Runtime** | Node.js (18+) | Python, Go | Fast, event-driven for real-time updates |
| **Framework** | Express / NestJS | Fastify, Koa | Battle-tested, large ecosystem |
| **Database** | MongoDB 6+ | PostgreSQL | Flexible schema for multi-tenant variations |
| **Cache** | Redis | Memcached | Supports complex data types, pub/sub |
| **Message Queue** | RabbitMQ/Kafka | SQS, Bull | Reliability, at-least-once delivery |
| **Search** | Elasticsearch | Meilisearch | Distributed analytics, aggregations |
| **Auth** | Keycloak/Auth0 | Okta, Amazon Cognito | Multi-tenant support, SAML/OIDC |

### Frontend Stack

**Web:**
```
- React 18+ with TypeScript
- State: Redux Toolkit (or Zustand for simplicity)
- UI: Material-UI or Chakra UI (accessibility focus)
- Real-time: Socket.io or Pusher for live updates
- Forms: React Hook Form
- Charts: Recharts or Chart.js
- Testing: Vitest + React Testing Library
```

**Mobile (React Native):**
```
- React Native 0.73+
- Local DB: Realm (syncs with backend)
- State: Redux Toolkit or Zustand
- Navigation: React Navigation
- Geolocation: react-native-geolocation-service
- Offline: AsyncStorage + sync queue pattern
- Testing: Detox for E2E
```

### Infrastructure

| Layer | Recommendation | Scale |
|-------|----------------|-------|
| **Hosting** | AWS (multi-region) | 10K+ users needs geographic distribution |
| **Compute** | ECS Fargate (containers) | Auto-scales based on demand |
| **Database** | AWS DocumentDB or MongoDB Atlas | Managed, automatic backups |
| **Cache** | ElastiCache Redis | 8-16GB for 10K users |
| **CDN** | CloudFront | Edge caching, reduced latency |
| **Monitoring** | Datadog/New Relic | Mission-critical app needs observability |
| **Logging** | ELK Stack or CloudWatch | Centralized logs for debugging |

---

## MONGODB SCHEMA DESIGN {#mongodb-schema}

### Complete Database Schema with Relationships

```javascript
// ============================================
// 1. ORGANIZATIONS COLLECTION
// ============================================
db.createCollection("organizations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "country", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        name: { bsonType: "string", minLength: 1, maxLength: 255 },
        type: { 
          enum: ["staffing_agency", "restaurant", "retail", "healthcare", "manufacturing", "other"],
          description: "Industry type affects scheduling rules"
        },
        country: { bsonType: "string", pattern: "^[A-Z]{2}$" },
        timezone: { bsonType: "string" },
        subscriptionPlan: { 
          enum: ["starter", "professional", "enterprise"]
        },
        subscriptionStatus: {
          enum: ["active", "trial", "suspended", "cancelled"]
        },
        settings: {
          bsonType: "object",
          properties: {
            workWeekStart: { enum: ["monday", "sunday"] },
            currency: { bsonType: "string" },
            payrollCycle: { enum: ["weekly", "biweekly", "monthly"] },
            overtimeThreshold: { bsonType: "int" }, // hours/week before overtime
            minBreakDuration: { bsonType: "int" }, // minutes
            maxConsecutiveShifts: { bsonType: "int" },
            requireGeolocation: { bsonType: "bool" },
            geofenceRadius: { bsonType: "int" } // meters
          }
        },
        apiKeys: [{
          key: { bsonType: "string" },
          name: { bsonType: "string" },
          createdAt: { bsonType: "date" },
          lastUsedAt: { bsonType: "date" },
          rateLimit: { bsonType: "int" } // requests per minute
        }],
        integrations: [{
          name: { enum: ["payroll_provider", "ats", "crm", "accounting"] },
          provider: { bsonType: "string" },
          status: { enum: ["connected", "disconnected", "error"] },
          lastSyncAt: { bsonType: "date" }
        }],
        billingContact: {
          email: { bsonType: "string" },
          phone: { bsonType: "string" },
          name: { bsonType: "string" }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.organizations.createIndex({ "subscriptionStatus": 1, "createdAt": -1 });
db.organizations.createIndex({ "country": 1 });

// ============================================
// 2. LOCATIONS COLLECTION
// ============================================
db.createCollection("locations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "name", "address", "coordinates"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        name: { bsonType: "string", maxLength: 255 },
        type: { enum: ["store", "warehouse", "office", "venue", "site"] },
        address: {
          bsonType: "object",
          properties: {
            street: { bsonType: "string" },
            city: { bsonType: "string" },
            state: { bsonType: "string" },
            zipCode: { bsonType: "string" },
            country: { bsonType: "string" },
            coordinates: {
              bsonType: "object",
              properties: {
                type: { const: "Point" },
                coordinates: { 
                  bsonType: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: { bsonType: "double" }
                }
              }
            }
          }
        },
        operatingHours: [{
          dayOfWeek: { enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
          opensAt: { bsonType: "string", pattern: "^[0-2][0-9]:[0-5][0-9]$" },
          closesAt: { bsonType: "string", pattern: "^[0-2][0-9]:[0-5][0-9]$" },
          isClosed: { bsonType: "bool" }
        }],
        capacity: {
          bsonType: "object",
          properties: {
            maxStaff: { bsonType: "int" },
            minStaffRequired: { bsonType: "int" }
          }
        },
        departments: [{
          _id: { bsonType: "objectId" },
          name: { bsonType: "string" },
          manager: { bsonType: "objectId" } // User ID
        }],
        isActive: { bsonType: "bool", default: true },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Geospatial index for location-based queries
db.locations.createIndex({ "address.coordinates": "2dsphere" });
db.locations.createIndex({ "organizationId": 1, "isActive": 1 });

// ============================================
// 3. USERS COLLECTION (Multi-role)
// ============================================
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "organizationId", "roles", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        email: { bsonType: "string", pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" },
        phone: { bsonType: "string" },
        firstName: { bsonType: "string" },
        lastName: { bsonType: "string" },
        password: { bsonType: "string" }, // hashed (bcrypt with salt rounds: 10)
        roles: {
          bsonType: "array",
          items: {
            enum: ["admin", "manager", "supervisor", "worker", "viewer"]
          },
          minItems: 1
        },
        permissions: [{
          resource: { enum: ["schedules", "payroll", "timeclock", "reports", "settings"] },
          actions: [{
            enum: ["create", "read", "update", "delete", "export"]
          }],
          scope: { enum: ["organization", "location", "team", "own"] }
        }],
        employeeId: { bsonType: "string", unique: true }, // External employee ID
        department: { bsonType: "objectId" }, // References locations.departments
        locations: [{
          bsonType: "objectId" // Can work at multiple locations
        }],
        employmentStatus: {
          type: { enum: ["active", "inactive", "terminated", "on_leave"] },
          effectiveDate: { bsonType: "date" }
        },
        employmentType: { enum: ["fulltime", "parttime", "contractor", "temporary"] },
        skills: [{
          _id: { bsonType: "objectId" },
          name: { bsonType: "string" }, // e.g., "Cash Register", "Food Prep"
          level: { enum: ["beginner", "intermediate", "advanced"] },
          certifications: [{ bsonType: "string" }],
          verifiedAt: { bsonType: "date" }
        }],
        availability: [{
          dayOfWeek: { enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
          startTime: { bsonType: "string", pattern: "^[0-2][0-9]:[0-5][0-9]$" },
          endTime: { bsonType: "string", pattern: "^[0-2][0-9]:[0-5][0-9]$" },
          isAvailable: { bsonType: "bool" }
        }],
        preferences: {
          bsonType: "object",
          properties: {
            maxHoursPerWeek: { bsonType: "int" },
            preferredShifts: [{ enum: ["morning", "afternoon", "evening", "night", "weekend"] }],
            blackoutDates: [{
              startDate: { bsonType: "date" },
              endDate: { bsonType: "date" },
              reason: { bsonType: "string" }
            }],
            trainingHours: { bsonType: "int" },
            preferredLocations: [{ bsonType: "objectId" }]
          }
        },
        deviceTokens: [{ // For push notifications
          token: { bsonType: "string" },
          platform: { enum: ["ios", "android", "web"] },
          createdAt: { bsonType: "date" },
          lastUsedAt: { bsonType: "date" },
          isActive: { bsonType: "bool" }
        }],
        salary: {
          bsonType: "object",
          properties: {
            baseRate: { bsonType: "double" }, // per hour or per month
            currency: { bsonType: "string" },
            rateType: { enum: ["hourly", "salaried"] },
            effectiveDate: { bsonType: "date" },
            overtimeMultiplier: { bsonType: "double", default: 1.5 }
          }
        },
        bankDetails: {
          bsonType: "object",
          properties: {
            accountHolderName: { bsonType: "string" },
            accountNumber: { bsonType: "string" }, // encrypted
            bankCode: { bsonType: "string" }, // encrypted
            routingNumber: { bsonType: "string" }, // encrypted
            encryptionKeyId: { bsonType: "string" }
          }
        },
        taxInfo: {
          bsonType: "object",
          properties: {
            taxId: { bsonType: "string" }, // PAN in India, SSN in US (encrypted)
            taxFilingStatus: { enum: ["single", "married", "head_of_household"] },
            dependents: { bsonType: "int" },
            encryptionKeyId: { bsonType: "string" }
          }
        },
        isActive: { bsonType: "bool", default: true },
        lastLoginAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.users.createIndex({ "organizationId": 1, "isActive": 1 });
db.users.createIndex({ "email": 1, "organizationId": 1 }, { unique: true });
db.users.createIndex({ "employeeId": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "locations": 1 });
db.users.createIndex({ "skills.name": 1 });

// ============================================
// 4. SHIFTS COLLECTION
// ============================================
db.createCollection("shifts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "locationId", "startTime", "endTime"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        locationId: { bsonType: "objectId" },
        shiftNumber: { bsonType: "string" }, // "Morning", "Evening", "Night", "Closing", etc.
        positions: [{
          _id: { bsonType: "objectId" },
          title: { bsonType: "string" }, // "Cashier", "Food Prep", "Server"
          requiredSkills: [{ bsonType: "string" }],
          headcount: { bsonType: "int" }, // How many of this position needed
          assignedWorkers: [{
            userId: { bsonType: "objectId" },
            status: { enum: ["assigned", "confirmed", "declined", "completed"] },
            assignedAt: { bsonType: "date" }
          }],
          availableWorkers: [{
            userId: { bsonType: "objectId" },
            reason: { enum: ["available", "unavailable", "on_leave", "low_score"] }
          }]
        }],
        startTime: { bsonType: "date" },
        endTime: { bsonType: "date" },
        duration: { bsonType: "int" }, // minutes
        type: { enum: ["regular", "emergency", "overtime", "training", "mandatory"] },
        status: { enum: ["draft", "published", "cancelled", "closed"] },
        payRate: { bsonType: "double" }, // If different from base rate
        breakDuration: { bsonType: "int" }, // minutes
        requiresGeolocation: { bsonType: "bool" },
        numberOfWorkers: { bsonType: "int" }, // Total positions/headcount
        fulfilledCount: { bsonType: "int" }, // How many confirmed
        priority: { enum: ["low", "medium", "high", "critical"] },
        notes: { bsonType: "string" },
        createdBy: { bsonType: "objectId" }, // User ID
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        publishedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes for efficient shift querying
db.shifts.createIndex({ "organizationId": 1, "startTime": 1 });
db.shifts.createIndex({ "locationId": 1, "status": 1, "startTime": 1 });
db.shifts.createIndex({ "startTime": 1, "endTime": 1 }); // Range queries
db.shifts.createIndex({ "positions.assignedWorkers.userId": 1 });
db.shifts.createIndex({ "status": 1, "publishedAt": -1 });

// ============================================
// 5. TIME_ENTRIES COLLECTION (Clock In/Out)
// ============================================
db.createCollection("timeEntries", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "userId", "locationId", "clockInTime"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        shiftId: { bsonType: "objectId" },
        locationId: { bsonType: "objectId" },
        clockInTime: { bsonType: "date" },
        clockInLocation: {
          bsonType: "object",
          properties: {
            latitude: { bsonType: "double" },
            longitude: { bsonType: "double" },
            accuracy: { bsonType: "double" }, // meters
            source: { enum: ["gps", "network", "wifi", "manual"] },
            address: { bsonType: "string" },
            verifiedGeofence: { bsonType: "bool" },
            geofenceRadius: { bsonType: "int" } // meters, for audit
          }
        },
        clockInMethod: { enum: ["geofence", "nfc", "qr_code", "manual", "biometric"] },
        clockInPhoto: { bsonType: "string" }, // S3 URL
        clockOutTime: { bsonType: "date" },
        clockOutLocation: {
          bsonType: "object",
          properties: {
            latitude: { bsonType: "double" },
            longitude: { bsonType: "double" },
            accuracy: { bsonType: "double" },
            source: { enum: ["gps", "network", "wifi", "manual"] },
            address: { bsonType: "string" },
            verifiedGeofence: { bsonType: "bool" }
          }
        },
        clockOutMethod: { enum: ["geofence", "nfc", "qr_code", "manual", "biometric"] },
        clockOutPhoto: { bsonType: "string" },
        breaks: [{
          breakStartTime: { bsonType: "date" },
          breakEndTime: { bsonType: "date" },
          duration: { bsonType: "int" }, // minutes
          breakType: { enum: ["lunch", "coffee", "personal", "unpaid"] }
        }],
        totalWorkTime: { bsonType: "int" }, // minutes, calculated
        totalBreakTime: { bsonType: "int" }, // minutes
        overtimeHours: { bsonType: "double" }, // Calculated based on org threshold
        status: { enum: ["clocked_in", "clocked_out", "approved", "disputed", "corrected"] },
        approvalStatus: { enum: ["pending", "approved", "rejected", "modified"] },
        approvedBy: { bsonType: "objectId" }, // Manager/Admin ID
        approvalNotes: { bsonType: "string" },
        geoSpoosingDetected: { bsonType: "bool", default: false },
        geoSpoofingReason: { bsonType: "string" },
        ipAddress: { bsonType: "string" },
        deviceId: { bsonType: "string" },
        appVersion: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes for time-based queries
db.timeEntries.createIndex({ "organizationId": 1, "clockInTime": -1 });
db.timeEntries.createIndex({ "userId": 1, "clockInTime": -1 });
db.timeEntries.createIndex({ "locationId": 1, "clockInTime": 1 });
db.timeEntries.createIndex({ "status": 1, "approvalStatus": 1 });
db.timeEntries.createIndex({ "clockInTime": 1, "clockOutTime": 1 }); // TTL for deletion
db.timeEntries.createIndex({ "geoSpoosingDetected": 1 }); // For audit

// TTL index - auto-delete after 2 years (based on legal retention)
db.timeEntries.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 63072000 });

// ============================================
// 6. APPLICATIONS COLLECTION (Shift Bids)
// ============================================
db.createCollection("applications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "userId", "shiftId"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        shiftId: { bsonType: "objectId" },
        positionId: { bsonType: "objectId" },
        status: { enum: ["applied", "shortlisted", "interviewed", "offered", "accepted", "rejected", "withdrawn"] },
        applicationType: { enum: ["marketplace", "direct_offer", "auto_assigned"] },
        appliedAt: { bsonType: "date" },
        responseDeadline: { bsonType: "date" },
        respondedAt: { bsonType: "date" },
        response: { enum: ["accepted", "declined", "no_response"] },
        reasons: { bsonType: "string" }, // If declined
        matchScore: { bsonType: "double" }, // 0-100, based on skills, availability
        recommendationReason: { bsonType: "string" }, // Why system recommended
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.applications.createIndex({ "organizationId": 1, "status": 1 });
db.applications.createIndex({ "userId": 1, "shiftId": 1 }, { unique: true });
db.applications.createIndex({ "shiftId": 1, "status": 1 });
db.applications.createIndex({ "appliedAt": -1 });

// ============================================
// 7. PAYROLL COLLECTION
// ============================================
db.createCollection("payroll", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "userId", "periodStart", "periodEnd"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        payrollPeriod: {
          bsonType: "object",
          properties: {
            periodStart: { bsonType: "date" },
            periodEnd: { bsonType: "date" },
            paymentDate: { bsonType: "date" }
          }
        },
        earnings: {
          bsonType: "object",
          properties: {
            regularHours: { bsonType: "double" },
            regularRate: { bsonType: "double" },
            regularPay: { bsonType: "double" },
            overtimeHours: { bsonType: "double" },
            overtimeRate: { bsonType: "double" },
            overtimePay: { bsonType: "double" },
            bonusAmount: { bsonType: "double" },
            allowances: [{
              type: { enum: ["travel", "food", "uniform", "other"] },
              amount: { bsonType: "double" }
            }],
            grossEarnings: { bsonType: "double" }
          }
        },
        deductions: {
          bsonType: "object",
          properties: {
            incomeTax: { bsonType: "double" },
            employeeInsurance: { bsonType: "double" },
            employeeProvidentFund: { bsonType: "double" },
            otherDeductions: [{
              name: { bsonType: "string" },
              amount: { bsonType: "double" }
            }],
            totalDeductions: { bsonType: "double" }
          }
        },
        employerContributions: {
          bsonType: "object",
          properties: {
            employerInsurance: { bsonType: "double" },
            employerProvidentFund: { bsonType: "double" },
            gratuity: { bsonType: "double" }
          }
        },
        netPay: { bsonType: "double" },
        currency: { bsonType: "string" },
        paymentMethod: { enum: ["bank_transfer", "check", "cash", "digital_wallet"] },
        paymentStatus: { enum: ["pending", "processed", "paid", "failed", "reversed"] },
        paymentDate: { bsonType: "date" },
        transactionId: { bsonType: "string" },
        remarks: { bsonType: "string" },
        generatedBy: { bsonType: "objectId" }, // Admin/HR ID
        generatedAt: { bsonType: "date" },
        approvedBy: { bsonType: "objectId" },
        approvedAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.payroll.createIndex({ "organizationId": 1, "payrollPeriod.periodStart": -1 });
db.payroll.createIndex({ "userId": 1, "payrollPeriod.periodStart": 1 });
db.payroll.createIndex({ "paymentStatus": 1, "paymentDate": 1 });
db.payroll.createIndex({ "generatedAt": -1 });

// ============================================
// 8. NOTIFICATIONS COLLECTION
// ============================================
db.createCollection("notifications", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "userId", "type", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        type: {
          enum: [
            "shift_assigned",
            "shift_cancelled",
            "shift_modified",
            "shift_reminder",
            "clock_in_missed",
            "overtime_alert",
            "payroll_ready",
            "leave_approved",
            "leave_rejected",
            "schedule_published",
            "system_alert"
          ]
        },
        title: { bsonType: "string" },
        body: { bsonType: "string" },
        data: {
          bsonType: "object", // Type-specific data (shiftId, etc.)
          additionalProperties: true
        },
        channels: [{
          enum: ["push", "email", "sms", "in_app"]
        }],
        status: { enum: ["pending", "sent", "delivered", "read", "failed"] },
        sentAt: { bsonType: "date" },
        deliveredAt: { bsonType: "date" },
        readAt: { bsonType: "date" },
        failureReason: { bsonType: "string" },
        priority: { enum: ["low", "normal", "high", "urgent"] },
        expiresAt: { bsonType: "date" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
db.notifications.createIndex({ "status": 1, "sentAt": 1 });
db.notifications.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 }); // TTL

// ============================================
// 9. ANALYTICS_EVENTS COLLECTION
// ============================================
db.createCollection("analyticsEvents", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "eventType", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        eventType: {
          enum: [
            "shift_viewed",
            "shift_applied",
            "shift_accepted",
            "clock_in",
            "clock_out",
            "schedule_downloaded",
            "payroll_viewed",
            "report_generated"
          ]
        },
        metadata: {
          bsonType: "object",
          additionalProperties: true
        },
        timestamp: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes for analytics queries
db.analyticsEvents.createIndex({ "organizationId": 1, "timestamp": -1 });
db.analyticsEvents.createIndex({ "eventType": 1, "timestamp": 1 });
db.analyticsEvents.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL

// ============================================
// 10. AUDIT_LOGS COLLECTION
// ============================================
db.createCollection("auditLogs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["organizationId", "userId", "action", "resource", "timestamp"],
      properties: {
        _id: { bsonType: "objectId" },
        organizationId: { bsonType: "objectId" },
        userId: { bsonType: "objectId" },
        userEmail: { bsonType: "string" },
        action: {
          enum: ["CREATE", "UPDATE", "DELETE", "EXPORT", "LOGIN", "LOGOUT", "LOGIN_FAILED"]
        },
        resource: {
          enum: ["shift", "user", "payroll", "location", "organization", "settings", "report"]
        },
        resourceId: { bsonType: "objectId" },
        changes: {
          bsonType: "object",
          properties: {
            before: { bsonType: "object", additionalProperties: true },
            after: { bsonType: "object", additionalProperties: true }
          }
        },
        ipAddress: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        status: { enum: ["success", "failed"] },
        failureReason: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        createdAt: { bsonType: "date" }
      }
    }
  }
});

// Indexes
db.auditLogs.createIndex({ "organizationId": 1, "timestamp": -1 });
db.auditLogs.createIndex({ "userId": 1, "action": 1, "timestamp": 1 });
db.auditLogs.createIndex({ "resource": 1, "resourceId": 1 });
db.auditLogs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL for compliance
```

### Validation Rules & Constraints

```javascript
// Prevent scheduling conflicts
db.timeEntries.createIndex({
  "userId": 1,
  "organizationId": 1,
  "clockInTime": 1,
  "clockOutTime": 1
});

// Prevent duplicate shift applications
db.applications.createIndex({
  "userId": 1,
  "shiftId": 1
}, { unique: true });

// Ensure payroll periods don't overlap
db.payroll.createIndex({
  "userId": 1,
  "payrollPeriod.periodStart": 1,
  "payrollPeriod.periodEnd": 1
}, { unique: true, sparse: true });
```

### Sample Document Examples

**Clock-in Record:**
```json
{
  "_id": ObjectId("64f5a8c2d9e8f2a0b4c3d5e6"),
  "organizationId": ObjectId("64f5a8c2d9e8f2a0b4c3d5e1"),
  "userId": ObjectId("64f5a8c2d9e8f2a0b4c3d5e2"),
  "shiftId": ObjectId("64f5a8c2d9e8f2a0b4c3d5e3"),
  "locationId": ObjectId("64f5a8c2d9e8f2a0b4c3d5e4"),
  "clockInTime": ISODate("2024-01-15T08:30:00Z"),
  "clockInLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 12.5,
    "source": "gps",
    "address": "Gurugram Mall, Sector 43",
    "verifiedGeofence": true,
    "geofenceRadius": 100
  },
  "clockInMethod": "geofence",
  "clockInPhoto": "https://s3.amazonaws.com/photos/64f5a8c2-12345.jpg",
  "clockOutTime": ISODate("2024-01-15T17:00:00Z"),
  "clockOutLocation": {
    "latitude": 28.6140,
    "longitude": 77.2091,
    "accuracy": 11.2,
    "source": "gps",
    "verifiedGeofence": true
  },
  "clockOutMethod": "geofence",
  "breaks": [
    {
      "breakStartTime": ISODate("2024-01-15T12:30:00Z"),
      "breakEndTime": ISODate("2024-01-15T13:30:00Z"),
      "duration": 60,
      "breakType": "lunch"
    }
  ],
  "totalWorkTime": 480,
  "totalBreakTime": 60,
  "overtimeHours": 0,
  "status": "clocked_out",
  "approvalStatus": "approved",
  "approvedBy": ObjectId("64f5a8c2d9e8f2a0b4c3d5e5"),
  "approvalNotes": "Regular shift",
  "geoSpoosingDetected": false,
  "ipAddress": "203.0.113.45",
  "deviceId": "device_123abc",
  "appVersion": "2.1.0",
  "createdAt": ISODate("2024-01-15T08:30:15Z"),
  "updatedAt": ISODate("2024-01-15T17:05:20Z")
}
```

---

## REAL-TIME NOTIFICATION ARCHITECTURE {#real-time-notifications}

### Multi-Channel Notification System

```
┌──────────────────────────────────────────────────────────┐
│            EVENT TRIGGER (Shift Created, etc.)            │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │  Event Bus (RabbitMQ)  │
         │  or Kafka Event Stream │
         └───────────┬────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼──────┐  ┌──────▼──────┐  ┌─────▼─────┐
│ Push Svc │  │  Email Svc  │  │  SMS Svc  │
└───┬──────┘  └──────┬──────┘  └─────┬─────┘
    │                │               │
    │         (Firebase/Pusher)      │
    │                │          (Twilio)
    │                │               │
    └────────────────┼───────────────┘
                     │
    ┌────────────────▼───────────────┐
    │   Notification Queue (Redis)   │
    │   Users: [device_tokens]       │
    └────────────────┬───────────────┘
                     │
         ┌───────────▼────────────┐
         │  WebSocket Connection  │
         │  (Real-time Updates)   │
         └────────────────────────┘
```

### Implementation Pattern (Node.js + Express)

```javascript
// services/NotificationService.ts
import * as admin from 'firebase-admin';
import { EventEmitter } from 'events';
import { Notification } from '../models/Notification';

export class NotificationService {
  private eventEmitter = new EventEmitter();

  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      databaseURL: process.env.FIREBASE_DB_URL
    });

    // Listen to shift events
    this.eventEmitter.on('shift:assigned', (data) => this.onShiftAssigned(data));
    this.eventEmitter.on('shift:cancelled', (data) => this.onShiftCancelled(data));
    this.eventEmitter.on('payroll:ready', (data) => this.onPayrollReady(data));
  }

  async sendPushNotification(userId: string, notification: NotificationPayload) {
    try {
      // Get user device tokens
      const user = await User.findById(userId);
      const validTokens = user.deviceTokens.filter(t => t.isActive);

      if (validTokens.length === 0) return;

      const message = {
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data,
        android: {
          priority: notification.priority || 'high',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          }
        }
      };

      // Send to all device tokens
      const results = await admin.messaging().sendMulticast({
        ...message,
        tokens: validTokens.map(t => t.token)
      });

      // Mark failed tokens as inactive
      results.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = validTokens[idx].token;
          User.updateOne(
            { _id: userId, 'deviceTokens.token': token },
            { $set: { 'deviceTokens.$.isActive': false } }
          );
        }
      });

      // Store notification in DB
      await Notification.create({
        organizationId: user.organizationId,
        userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        channels: ['push'],
        status: results.failureCount === 0 ? 'delivered' : 'partial',
        sentAt: new Date()
      });

    } catch (error) {
      console.error('Push notification failed:', error);
      throw error;
    }
  }

  // In-app real-time notifications via WebSocket
  async broadcastToRoom(organizationId: string, notification: NotificationPayload) {
    // Uses Socket.io or similar
    io.to(`org:${organizationId}`).emit('notification', notification);

    // Also store for offline users
    await Notification.create({
      organizationId,
      userId: null, // Broadcast
      type: notification.type,
      channels: ['in_app'],
      status: 'sent'
    });
  }

  async onShiftAssigned(data: { shiftId: string; userId: string }) {
    const shift = await Shift.findById(data.shiftId);
    const user = await User.findById(data.userId);

    const notification = {
      type: 'shift_assigned',
      title: 'New Shift Assigned',
      body: `You've been assigned a shift on ${shift.startTime.toDateString()}`,
      data: {
        shiftId: shift._id.toString(),
        startTime: shift.startTime.toISOString()
      },
      priority: 'high'
    };

    await this.sendPushNotification(user._id.toString(), notification);
  }

  async onShiftCancelled(data: { shiftId: string; userIds: string[] }) {
    const shift = await Shift.findById(data.shiftId);

    for (const userId of data.userIds) {
      const notification = {
        type: 'shift_cancelled',
        title: 'Shift Cancelled',
        body: `Your shift on ${shift.startTime.toDateString()} has been cancelled`,
        data: { shiftId: shift._id.toString() },
        priority: 'high'
      };

      await this.sendPushNotification(userId, notification);
    }
  }

  async onPayrollReady(data: { organizationId: string; payrollPeriodId: string }) {
    // Notify all managers in organization
    const managers = await User.find({
      organizationId: data.organizationId,
      roles: { $in: ['admin', 'manager'] }
    });

    for (const manager of managers) {
      const notification = {
        type: 'payroll_ready',
        title: 'Payroll Ready for Processing',
        body: 'Payroll has been calculated and is ready for approval',
        data: { payrollPeriodId: data.payrollPeriodId },
        priority: 'normal'
      };

      await this.sendPushNotification(manager._id.toString(), notification);
    }
  }
}

// Controller
export async function publishShift(req: Request, res: Response) {
  const shift = await Shift.findByIdAndUpdate(req.params.id, { status: 'published' });

  // Notify eligible workers
  const eligibleWorkers = await findEligibleWorkers(shift);

  eventBus.emit('shift:published', {
    shiftId: shift._id,
    userIds: eligibleWorkers.map(w => w._id)
  });

  res.json(shift);
}
```

### Sync Queue Pattern (for offline-first mobile apps)

```javascript
// Mobile-side (React Native)
class SyncQueue {
  private queue: SyncOperation[] = [];
  private isProcessing = false;

  async enqueueOperation(op: SyncOperation) {
    this.queue.push(op);
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.queue));
    this.processSyncQueue();
  }

  async processSyncQueue() {
    if (this.isProcessing) return;
    if (!(await NetInfo.isConnected())) return;

    this.isProcessing = true;
    while (this.queue.length > 0) {
      const op = this.queue[0];
      try {
        const response = await api.post(`/sync/${op.type}`, op.data);
        // Update local state with server response
        this.queue.shift();
        await this.updateLocalState(op, response);
      } catch (error) {
        // Retry logic
        if (op.retryCount < 3) {
          op.retryCount++;
        } else {
          this.queue.shift(); // Give up after 3 retries
          notifyUserOfSyncFailure(op);
        }
        break;
      }
    }
    await AsyncStorage.setItem('syncQueue', JSON.stringify(this.queue));
    this.isProcessing = false;
  }
}
```

---

## AUTO-SCHEDULING ALGORITHMS {#auto-scheduling}

### AI-Powered Shift Assignment Algorithm

```javascript
// services/SchedulingEngine.ts
import * as pulp from 'pulpjs'; // Or similar optimization library

export class SchedulingEngine {
  /**
   * Auto-schedule shifts considering:
   * - Worker skills and certifications
   * - Availability and preferences
   * - Labor cost optimization
   * - Fair shift distribution
   * - Compliance (max hours/week, rest between shifts)
   */
  async optimizeSchedule(
    shifts: Shift[],
    workers: User[],
    constraints: ScheduleConstraints
  ): Promise<ScheduleAssignment[]> {
    // 1. Feasibility check
    const totalPositions = shifts.reduce((sum, s) => sum + s.numberOfWorkers, 0);
    if (totalPositions > workers.length * constraints.maxHoursPerWeek / 40) {
      throw new Error('Not enough workers available');
    }

    // 2. Build assignment matrix
    const assignments = this.buildAssignmentMatrix(shifts, workers);

    // 3. Apply constraints
    this.applySkillConstraints(assignments, shifts, workers);
    this.applyAvailabilityConstraints(assignments, shifts, workers);
    this.applyMaxHoursConstraint(assignments, constraints.maxHoursPerWeek);
    this.applyRestBetweenShifts(assignments, constraints.minHoursBetweenShifts);

    // 4. Optimize using linear programming
    const optimizedAssignments = await this.solveOptimization(
      assignments,
      shifts,
      workers,
      {
        objective: 'minimize_cost', // Or 'maximize_fairness'
        preferences: workers.map(w => ({
          workerId: w._id,
          preferences: w.preferences
        }))
      }
    );

    // 5. Calculate fairness score
    this.calculateFairnessMetrics(optimizedAssignments, workers);

    return optimizedAssignments;
  }

  private buildAssignmentMatrix(shifts: Shift[], workers: User[]): Matrix {
    // workers × shifts matrix
    const matrix: Matrix = [];

    workers.forEach(worker => {
      const row: number[] = [];
      shifts.forEach(shift => {
        // Default: 0 (not assigned)
        // Will be 1 (assigned) or 0 (not assigned)
        row.push(0);
      });
      matrix.push(row);
    });

    return matrix;
  }

  private applySkillConstraints(
    assignments: Matrix,
    shifts: Shift[],
    workers: User[]
  ) {
    shifts.forEach((shift, shiftIdx) => {
      shift.positions.forEach(position => {
        const requiredSkills = position.requiredSkills;

        workers.forEach((worker, workerIdx) => {
          // Worker must have all required skills
          const hasSkills = requiredSkills.every(skill =>
            worker.skills.some(
              s => s.name === skill && s.verifiedAt && s.level !== 'beginner'
            )
          );

          if (!hasSkills) {
            assignments[workerIdx][shiftIdx] = -1; // Impossible assignment
          }
        });
      });
    });
  }

  private applyAvailabilityConstraints(
    assignments: Matrix,
    shifts: Shift[],
    workers: User[]
  ) {
    workers.forEach((worker, workerIdx) => {
      shifts.forEach((shift, shiftIdx) => {
        const shiftDayOfWeek = shift.startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        // Check availability
        const availability = worker.availability.find(a => a.dayOfWeek === shiftDayOfWeek);
        const isAvailable = availability && availability.isAvailable &&
          this.isTimeInRange(shift.startTime, availability.startTime, availability.endTime);

        // Check blackout dates
        const isBlackedOut = worker.preferences?.blackoutDates?.some(bd =>
          shift.startTime >= bd.startDate && shift.startTime <= bd.endDate
        );

        if (!isAvailable || isBlackedOut) {
          assignments[workerIdx][shiftIdx] = -1;
        }
      });
    });
  }

  private applyMaxHoursConstraint(assignments: Matrix, maxHours: number) {
    const workingHours = new Array(assignments.length).fill(0);

    assignments.forEach((row, workerIdx) => {
      row.forEach((assigned, shiftIdx) => {
        if (assigned === 1) {
          workingHours[workerIdx] += 8; // Assuming 8-hour shifts
        }
      });
    });

    // If worker exceeds max hours, mark some shifts as -1
    assignments.forEach((row, workerIdx) => {
      if (workingHours[workerIdx] > maxHours) {
        // Remove assignments starting from lowest-priority shifts
        // (Implementation depends on preference data)
      }
    });
  }

  private applyRestBetweenShifts(assignments: Matrix, minHours: number) {
    // Ensure at least minHours between consecutive shifts
    assignments.forEach((row, workerIdx) => {
      let lastShiftEnd: Date | null = null;

      row.forEach((assigned, shiftIdx) => {
        if (assigned === 1) {
          // Check rest time from previous shift
          // If insufficient, mark as -1
        }
        lastShiftEnd = new Date(); // Update after checking
      });
    });
  }

  private async solveOptimization(
    assignments: Matrix,
    shifts: Shift[],
    workers: User[],
    options: OptimizationOptions
  ): Promise<ScheduleAssignment[]> {
    // Use linear programming solver (e.g., PuLP, Gurobi, COIN-OR)
    // This is pseudo-code; actual implementation depends on library choice

    const prob = new pulp.LpProblem('ShiftAssignment', pulp.LpMinimize);

    // Decision variables: x[i][j] = 1 if worker i assigned to shift j
    const x = [];
    for (let i = 0; i < workers.length; i++) {
      x[i] = [];
      for (let j = 0; j < shifts.length; j++) {
        x[i][j] = new pulp.LpVariable(`x_{${i},${j}}`, 0, 1, pulp.LpBinary);
      }
    }

    // Objective: minimize cost (or maximize fairness)
    if (options.objective === 'minimize_cost') {
      const cost = [];
      for (let i = 0; i < workers.length; i++) {
        for (let j = 0; j < shifts.length; j++) {
          const shiftCost = shifts[j].payRate || workers[i].salary.baseRate;
          cost.push(shiftCost * x[i][j]);
        }
      }
      prob.setObjective(pulp.lpSum(cost));
    }

    // Constraints
    // Each position must be filled
    for (let j = 0; j < shifts.length; j++) {
      const positionCount = shifts[j].numberOfWorkers;
      const assignedWorkers = [];
      for (let i = 0; i < workers.length; i++) {
        assignedWorkers.push(x[i][j]);
      }
      prob.addConstraint(pulp.lpSum(assignedWorkers) === positionCount, `Shift_${j}_staffing`);
    }

    // Worker constraints (from applyMaxHoursConstraint, etc.)
    // ... (add constraints for max hours, rest periods, etc.)

    // Solve
    prob.solve(pulp.PULP_CBC_CMD());

    // Extract results
    const result: ScheduleAssignment[] = [];
    for (let i = 0; i < workers.length; i++) {
      for (let j = 0; j < shifts.length; j++) {
        if (x[i][j].varValue === 1) {
          result.push({
            workerId: workers[i]._id,
            shiftId: shifts[j]._id,
            score: this.calculateMatchScore(workers[i], shifts[j]),
            reason: `Skills match: ${shifts[j].positions[0].requiredSkills.join(', ')}`
          });
        }
      }
    }

    return result;
  }

  private calculateMatchScore(worker: User, shift: Shift): number {
    // 0-100 score based on:
    // - Skill match (40%)
    // - Availability match (30%)
    // - Preference match (20%)
    // - Historical performance (10%)

    let score = 0;

    // Skill match
    const requiredSkills = shift.positions[0]?.requiredSkills || [];
    const hasSkills = requiredSkills.filter(s =>
      worker.skills.some(ws => ws.name === s)
    ).length;
    score += (hasSkills / requiredSkills.length) * 40;

    // Availability match
    const shiftDay = shift.startTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isAvailable = worker.availability.some(
      a => a.dayOfWeek === shiftDay && a.isAvailable
    );
    score += isAvailable ? 30 : 0;

    // Preference match
    const isPreferredShift = worker.preferences?.preferredShifts?.includes(
      this.getShiftPeriod(shift.startTime)
    );
    score += isPreferredShift ? 20 : 0;

    // Historical performance (simplified)
    score += 10; // Placeholder

    return Math.min(score, 100);
  }

  private calculateFairnessMetrics(
    assignments: ScheduleAssignment[],
    workers: User[]
  ) {
    // Calculate:
    // - Shift distribution variance (lower is better)
    // - Preferred shift distribution (should be fair)
    // - High-pay shift distribution

    const shiftsPerWorker = new Map<string, number>();
    assignments.forEach(a => {
      shiftsPerWorker.set(
        a.workerId.toString(),
        (shiftsPerWorker.get(a.workerId.toString()) || 0) + 1
      );
    });

    const values = Array.from(shiftsPerWorker.values());
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

    console.log(`Fairness - Shift variance: ${variance}`);
    console.log(`Fairness - Std deviation: ${Math.sqrt(variance)}`);
  }

  private isTimeInRange(time: Date, start: string, end: string): boolean {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const timeHour = time.getHours();
    const timeMin = time.getMinutes();

    const startMins = startHour * 60 + startMin;
    const endMins = endHour * 60 + endMin;
    const timeMins = timeHour * 60 + timeMin;

    return timeMins >= startMins && timeMins <= endMins;
  }

  private getShiftPeriod(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }
}
```

### Matching Algorithm for Shift Bidding

```javascript
// Score worker-shift compatibility
interface MatchResult {
  workerId: string;
  shiftId: string;
  matchScore: number; // 0-100
  reasoning: string[];
  feasible: boolean;
}

async function scoreWorkerForShift(worker: User, shift: Shift): Promise<MatchResult> {
  const reasons: string[] = [];
  let score = 50; // Base score

  // Skill matching (30 points max)
  const requiredSkills = shift.positions[0]?.requiredSkills || [];
  const workerSkills = worker.skills.map(s => s.name);
  const matchedSkills = requiredSkills.filter(rs => workerSkills.includes(rs));

  if (matchedSkills.length === requiredSkills.length) {
    score += 30;
    reasons.push('All required skills present');
  } else if (matchedSkills.length > requiredSkills.length * 0.7) {
    score += 20;
    reasons.push(`${matchedSkills.length}/${requiredSkills.length} skills matched`);
  }

  // Availability matching (25 points max)
  const isAvailable = worker.availability.some(a =>
    a.dayOfWeek === getDayName(shift.startTime) && a.isAvailable
  );
  if (isAvailable) {
    score += 25;
    reasons.push('Available on shift date');
  }

  // Preference matching (20 points max)
  const shiftPeriod = getShiftPeriod(shift.startTime);
  if (worker.preferences?.preferredShifts?.includes(shiftPeriod)) {
    score += 20;
    reasons.push(`Prefers ${shiftPeriod} shifts`);
  }

  // Previous experience (15 points max)
  const previousShifts = await TimeEntry.countDocuments({
    userId: worker._id,
    status: 'completed',
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });
  if (previousShifts > 0) {
    score += Math.min(previousShifts * 2, 15);
    reasons.push(`${previousShifts} shifts in last 30 days`);
  }

  // Fairness factor: workers with fewer shifts get slight boost
  const shiftsThisMonth = await TimeEntry.countDocuments({
    userId: worker._id,
    clockInTime: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });
  const avgShiftsPerWorker = await getAverageShiftsPerWorker();
  if (shiftsThisMonth < avgShiftsPerWorker * 0.8) {
    score += 10;
    reasons.push('Fair distribution: fewer shifts than average');
  }

  // Check hard constraints
  const feasible = isAvailable && matchedSkills.length > requiredSkills.length * 0.5;

  return {
    workerId: worker._id.toString(),
    shiftId: shift._id.toString(),
    matchScore: Math.min(score, 100),
    reasoning: reasons,
    feasible
  };
}
```

---

## MVP FEATURES PRIORITIZATION {#mvp-features}

### MoSCoW Framework

#### MUST HAVE (Core - 6-8 weeks)
```
1. User Management
   ✓ Multi-tenant organization setup
   ✓ Role-based access control (Admin, Manager, Worker)
   ✓ Email/password authentication + SSO
   ✓ Basic profile management

2. Shift Scheduling
   ✓ Create shifts with positions and pay rates
   ✓ Publish shifts to workers
   ✓ Worker shift bidding/applications
   ✓ Manager approval of applications
   ✓ Basic shift calendar view

3. Time Clock
   ✓ Mobile clock in/out with geolocation
   ✓ Manual override (for offline or special cases)
   ✓ Time entry approval workflow
   ✓ Basic dashboard showing clocked-in workers

4. Payroll
   ✓ Auto-calculate regular pay from time entries
   ✓ Overtime detection and calculation
   ✓ Basic deductions (tax, insurance)
   ✓ Payroll run generation
   ✓ Payment status tracking

5. Compliance
   ✓ Audit logs for all data changes
   ✓ Data encryption at rest and in transit
   ✓ GDPR privacy policy implementation
   ✓ Data export for employees
   ✓ Right to deletion implementation

6. Mobile App
   ✓ React Native app for iOS/Android
   ✓ Worker: clock in/out, view shifts, see payroll
   ✓ Manager: simple dashboard, approve time
   ✓ Offline-first capability (store actions locally)
   ✓ Push notifications
```

#### SHOULD HAVE (2-3 weeks post-MVP)
```
1. Enhanced Scheduling
   ✓ Shift swapping between workers
   ✓ Shift templates for recurring schedules
   ✓ Manager manual scheduling
   ✓ Conflict highlighting (double-booked workers)

2. Auto-Scheduling
   ✓ AI-suggested optimal assignments
   ✓ One-click auto-schedule

3. Analytics Dashboard
   ✓ Labor cost metrics
   ✓ Utilization rates
   ✓ Overtime trends
   ✓ Worker reliability stats

4. Notifications
   ✓ Push notifications for shift changes
   ✓ Email digests
   ✓ Shift reminders (day before, 1 hour before)

5. Integrations
   ✓ Google Calendar sync
   ✓ Slack notifications
   ✓ Basic payroll provider webhook
```

#### COULD HAVE (Future iterations)
```
1. AI-Powered Features
   ✓ Predictive staffing (ML forecasting)
   ✓ Anomaly detection (unusual patterns)
   ✓ Smart compliance alerts

2. Advanced Geofencing
   ✓ Multiple geofence zones per location
   ✓ GPS spoofing detection
   ✓ Geofence radius customization

3. Reporting Suite
   ✓ Custom report builder
   ✓ Scheduled report emails
   ✓ Data export (CSV, Excel)
   ✓ Compliance ready-to-audit reports

4. Advanced Payroll
   ✓ Multiple pay grades
   ✓ Shift differentials
   ✓ Bonus calculations
   ✓ Automated payments (ACH, bank transfers)

5. Performance Management
   ✓ Worker performance scoring
   ✓ Attendance reliability metrics
   ✓ Skills-based recommendations

6. Multi-Language Support
   ✓ Hindi, Tamil, Bengali (for India)
   ✓ Localized compliance rules
```

#### WON'T HAVE (Out of scope for MVP)
```
✗ Advanced ML-based scheduling (requires 6+ months of data)
✗ Video interview integration
✗ 3rd-party HR system integrations (except basic webhooks)
✗ Mobile app for iOS/Android from day 1 (web app first)
✗ Advanced business intelligence (Power BI, Tableau)
✗ Multi-currency support
✗ White-label solution
```

### Feature Complexity & Time Estimates

```
Core Features (8 weeks)
├── User Management (1 week)
│   ├── Auth system: 3 days
│   ├── Role management: 2 days
│   └── Profile management: 2 days
├── Scheduling Engine (2.5 weeks)
│   ├── Shift CRUD: 3 days
│   ├── Worker matching: 1 week
│   ├── Calendar UI: 1 week
│   └── Conflict detection: 3 days
├── Time Clock (1 week)
│   ├── Geofencing: 3 days
│   ├── Manual clock in/out: 2 days
│   ├── Break tracking: 2 days
│   └── Approval workflow: 2 days
├── Payroll Engine (2 weeks)
│   ├── Data model: 2 days
│   ├── Calculation logic: 1 week
│   ├── Tax calculations: 3 days
│   ├── Reporting: 3 days
│   └── Payment processing: 3 days
├── Compliance (1 week)
│   ├── Audit logs: 3 days
│   ├── Encryption setup: 2 days
│   ├── GDPR features: 2 days
│   └── Data exports: 2 days
└── Mobile App (1.5 weeks)
    ├── Basic setup: 1 day
    ├── Clock in/out flow: 3 days
    ├── Shift viewing: 2 days
    ├── Payroll display: 1 day
    └── Push notifications: 2 days

Testing (1 week)
├── Unit tests: 2 days
├── Integration tests: 2 days
├── E2E tests: 1.5 days
└── Compliance/security testing: 1.5 days

Deployment & Infrastructure (3-4 days)
├── AWS setup: 1 day
├── Database setup: 1 day
├── CI/CD pipeline: 1 day
└── Monitoring/logging: 1 day
```

---

## GEOFENCING IMPLEMENTATION {#geofencing}

### Accuracy & Spoofing Prevention

**1. Accuracy Requirements:**

```
Shift-Based Work Context:
├── Acceptable accuracy: ±10-20 meters (for geofencing boundary)
├── Geofence radius: 50-150 meters depending on location type
└── Example:
    - Retail store (small): 50m radius
    - Warehouse: 200m radius
    - Construction site: 300m radius
    - Multi-floor building: Use WiFi + GPS combination

Confidence Levels:
├── Excellent (< 5m): GPS only, clear sky, high satellite count
├── Good (5-20m): GPS with A-GPS assistance
├── Fair (20-50m): GPS + network-based positioning
└── Poor (> 50m): WiFi triangulation, cellular only
```

**2. GPS Spoofing Detection:**

```javascript
// Spoofing detection strategies
class GeofenceValidator {
  
  async validateClockIn(
    userId: string,
    locationId: string,
    currentLocation: GeoLocation
  ): Promise<GeofenceResult> {
    
    // Strategy 1: Velocity Check
    // If user was 500km away 5 mins ago, flag as suspicious
    const lastClockOut = await TimeEntry.findOne(
      { userId, status: 'clocked_out' },
      { clockOutLocation: 1, clockOutTime: 1 },
      { sort: { clockOutTime: -1 } }
    );

    if (lastClockOut) {
      const distance = this.haversineDistance(
        lastClockOut.clockOutLocation,
        currentLocation
      );
      const timeElapsed = (Date.now() - lastClockOut.clockOutTime.getTime()) / 1000 / 60; // minutes

      const maxPossibleDistance = 900 * (timeElapsed / 60); // 900 km/h = max commercial flight speed
      if (distance > maxPossibleDistance * 1.1) { // 10% buffer
        return {
          allowed: false,
          reason: 'Impossible travel distance',
          riskLevel: 'critical'
        };
      }
    }

    // Strategy 2: Accuracy Check
    // GPS spoofing often reports unrealistically high accuracy (0.1m, etc.)
    if (currentLocation.accuracy < 2 || currentLocation.accuracy > 200) {
      return {
        allowed: false,
        reason: 'Suspicious GPS accuracy (too high or too low)',
        riskLevel: 'high',
        accuracy: currentLocation.accuracy
      };
    }

    // Strategy 3: Consistency Check
    // Track velocity and direction; spoofed GPS jumps around randomly
    const recentEntries = await TimeEntry.find(
      { userId, clockInTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    ).limit(5);

    const consistentLocations = recentEntries.every(entry =>
      this.haversineDistance(entry.clockInLocation, currentLocation) < 100 // Within 100m
    );

    if (!consistentLocations && recentEntries.length > 2) {
      return {
        allowed: false,
        reason: 'Location inconsistent with historical pattern',
        riskLevel: 'medium'
      };
    }

    // Strategy 4: Geofence Boundary Check
    const location = await Location.findById(locationId);
    const isWithinGeofence = this.pointInCircle(
      currentLocation,
      location.address.coordinates,
      location.operatingHours[new Date().getDay()].geofenceRadius || 100
    );

    if (!isWithinGeofence) {
      return {
        allowed: false,
        reason: 'Outside geofence boundary',
        riskLevel: 'low',
        distance: this.haversineDistance(
          currentLocation,
          location.address.coordinates
        )
      };
    }

    // Strategy 5: Time-of-Day Check
    const location_hours = location.operatingHours[new Date().getDay()];
    if (!location_hours || location_hours.isClosed) {
      return {
        allowed: false,
        reason: 'Location is closed at this time',
        riskLevel: 'high'
      };
    }

    // All checks passed
    return { allowed: true, riskLevel: 'none' };
  }

  private haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private pointInCircle(
    point: Coordinates,
    center: Coordinates,
    radius: number
  ): boolean {
    const distance = this.haversineDistance(point, center);
    return distance <= radius;
  }
}
```

**3. Offline Mode Handling:**

```javascript
// Mobile: React Native
class OfflineClockIn {
  
  async clockIn(locationId: string): Promise<ClockInResult> {
    const isOnline = await NetInfo.isConnected();
    const location = await this.getLocalLocation();

    if (!isOnline) {
      // Store locally with pending status
      const pendingEntry = {
        id: generateUUID(), // Client-side UUID
        locationId,
        clockInTime: new Date(),
        clockInLocation: location,
        clockInMethod: 'offline',
        status: 'pending_sync',
        localId: generateUUID()
      };

      await this.storeLocally(pendingEntry);

      return {
        success: true,
        message: 'Clock-in saved offline. Will sync when online.',
        offlineMode: true
      };
    }

    // Online: Direct submit with server verification
    const result = await api.post('/timeentries', {
      locationId,
      clockInLocation: location,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Clock-in confirmed',
      offlineMode: false
    };
  }

  async syncPendingEntries() {
    const pendingEntries = await this.getPendingEntries();

    for (const entry of pendingEntries) {
      try {
        // Get fresh location
        const currentLocation = await this.getLocalLocation();

        // Submit to server
        const response = await api.post('/timeentries/sync', {
          clientId: entry.localId,
          locationId: entry.locationId,
          clockInLocation: currentLocation,
          originalTime: entry.clockInTime
        });

        // Update local record with server ID
        await this.updateLocalEntry(entry.id, {
          _id: response._id,
          status: 'synced'
        });
      } catch (error) {
        console.error('Sync failed:', error);
        // Retry on next connection
      }
    }
  }
}

// Server: Validate late submissions
app.post('/timeentries/sync', async (req, res) => {
  const { clientId, locationId, clockInLocation, originalTime } = req.body;

  // Check if this is a duplicate
  const existing = await TimeEntry.findOne({
    userId: req.user._id,
    clientId
  });

  if (existing) {
    return res.json(existing); // Idempotent
  }

  // Validate geofence (lenient for offline submissions)
  const location = await Location.findById(locationId);
  const isWithinGeofence = pointInCircle(clockInLocation, location.address.coordinates, 300); // Larger radius for offline

  if (!isWithinGeofence) {
    return res.status(400).json({
      error: 'Clock-in location verification failed',
      distance: haversineDistance(clockInLocation, location.address.coordinates)
    });
  }

  // Check time delta (shouldn't be more than 1 hour old)
  const timeDelta = Date.now() - new Date(originalTime).getTime();
  if (timeDelta > 3600 * 1000) {
    return res.status(400).json({
      error: 'Clock-in timestamp too old (> 1 hour)',
      timeDelta: Math.round(timeDelta / 1000 / 60) + ' minutes'
    });
  }

  // Create entry
  const entry = await TimeEntry.create({
    userId: req.user._id,
    locationId,
    clockInTime: originalTime,
    clockInLocation,
    clockInMethod: 'offline',
    clientId,
    status: 'clocked_in'
  });

  res.json(entry);
});
```

**4. Battery Optimization:**

```javascript
// React Native: Adaptive location updates
class BatteryOptimizedGeolocation {
  
  private geofencingManager = new Geofencing();
  private updateFrequency = 'adaptive';

  async startMonitoring(locationId: string) {
    // 1. Use Geofencing API (highly efficient - delegates to OS)
    const geofence = await this.setupGeofence(locationId, 100); // 100m radius

    // 2. Only enable continuous GPS if user is about to clock in
    // Otherwise, rely on geofence boundary events

    // 3. Reduce GPS frequency based on battery level
    const batteryLevel = await this.getBatteryLevel();
    const refreshInterval = this.calculateRefreshInterval(batteryLevel);

    // 4. Use lower-power location sources when possible
    if (await this.isIndoors()) {
      // Use WiFi + cellular triangulation (uses less battery than GPS)
      this.enableNetworkOnlyMode();
    } else {
      this.enableGPSMode();
    }
  }

  private calculateRefreshInterval(batteryLevel: number): number {
    // Battery level 100%: update every 10 seconds
    // Battery level 20%: update every 60 seconds
    // Battery level < 10%: GPS disabled, use geofence only

    if (batteryLevel < 10) return null; // Geofence only
    if (batteryLevel < 20) return 60000; // 1 min
    if (batteryLevel < 50) return 30000; // 30 sec
    return 10000; // 10 sec
  }

  private async isIndoors(): Promise<boolean> {
    // Check GPS accuracy; if > 30m, likely indoors
    const location = await this.getCurrentLocation();
    return location.accuracy > 30;
  }

  // Stop all updates when user clocks out
  async stopMonitoring() {
    if (this.geoSubscription) {
      this.geoSubscription.remove();
    }
    this.geofencingManager.disable();
  }
}

// Android specific: Use JobScheduler for efficient sync
// iOS specific: Use BackgroundModes for location updates
```

---

## PAYROLL CALCULATION SYSTEM {#payroll-system}

### Comprehensive Payroll Engine

```javascript
// services/PayrollService.ts
export class PayrollService {
  
  async generatePayroll(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PayrollResult> {
    
    // 1. Get all active employees
    const employees = await User.find({
      organizationId,
      employmentStatus: { $in: ['active'] },
      $expr: { $gte: ['$salary.effectiveDate', periodStart] }
    });

    const payrollRecords: PayrollRecord[] = [];

    for (const employee of employees) {
      // 2. Get time entries for period
      const timeEntries = await TimeEntry.find({
        userId: employee._id,
        status: 'approved',
        clockInTime: { $gte: periodStart, $lte: periodEnd }
      });

      // 3. Calculate earnings
      const earnings = this.calculateEarnings(employee, timeEntries);

      // 4. Calculate deductions
      const deductions = this.calculateDeductions(employee, earnings, periodStart, periodEnd);

      // 5. Calculate employer contributions
      const employerContributions = this.calculateEmployerContributions(employee, earnings);

      // 6. Create payroll record
      const payrollRecord: PayrollRecord = {
        organizationId,
        userId: employee._id,
        payrollPeriod: { periodStart, periodEnd },
        earnings,
        deductions,
        employerContributions,
        netPay: earnings.grossEarnings - deductions.totalDeductions,
        currency: employee.salary.currency,
        paymentStatus: 'pending',
        generatedBy: this.currentUserId // Admin/HR who generated
      };

      payrollRecords.push(payrollRecord);
    }

    // 7. Store in database
    await Payroll.insertMany(payrollRecords);

    // 8. Notify managers
    await this.notifyPayrollReady(organizationId, payrollRecords.length);

    return {
      success: true,
      recordsGenerated: payrollRecords.length,
      totalPayroll: payrollRecords.reduce((sum, r) => sum + r.netPay, 0),
      payrollPeriod: { periodStart, periodEnd }
    };
  }

  private calculateEarnings(
    employee: User,
    timeEntries: TimeEntry[]
  ): EarningsRecord {
    
    let regularHours = 0;
    let overtimeHours = 0;
    const maxRegularHoursPerWeek = 40; // Standard

    // Group by week
    const weekMap = new Map<string, number>();
    timeEntries.forEach(entry => {
      const week = this.getWeekNumber(entry.clockInTime);
      weekMap.set(week, (weekMap.get(week) || 0) + entry.totalWorkTime / 60);
    });

    // Calculate overtime
    weekMap.forEach(hours => {
      if (hours > maxRegularHoursPerWeek) {
        overtimeHours += hours - maxRegularHoursPerWeek;
        regularHours += maxRegularHoursPerWeek;
      } else {
        regularHours += hours;
      }
    });

    const baseRate = employee.salary.baseRate; // hourly
    const overtimeMultiplier = employee.salary.overtimeMultiplier || 1.5;

    return {
      regularHours,
      regularRate: baseRate,
      regularPay: regularHours * baseRate,
      overtimeHours,
      overtimeRate: baseRate * overtimeMultiplier,
      overtimePay: overtimeHours * baseRate * overtimeMultiplier,
      bonusAmount: 0, // To be set separately
      allowances: this.calculateAllowances(employee),
      grossEarnings:
        regularHours * baseRate +
        overtimeHours * baseRate * overtimeMultiplier +
        this.calculateAllowances(employee).reduce((sum, a) => sum + a.amount, 0)
    };
  }

  private calculateDeductions(
    employee: User,
    earnings: EarningsRecord,
    periodStart: Date,
    periodEnd: Date
  ): DeductionRecord {
    
    const grossEarnings = earnings.grossEarnings;
    const deductions: DeductionRecord = {
      incomeTax: 0,
      employeeInsurance: 0,
      employeeProvidentFund: 0,
      otherDeductions: [],
      totalDeductions: 0
    };

    // 1. Income Tax (India TDS rates as example)
    // Tax slabs: 0-250k (0%), 250k-500k (5%), 500k-1M (20%), > 1M (30%)
    // This is simplified; actual implementation should use detailed tax rules
    
    const annualIncome = earnings.grossEarnings * 12; // Rough estimate
    let taxRate = 0;
    
    if (annualIncome > 1000000) {
      taxRate = 0.30;
    } else if (annualIncome > 500000) {
      taxRate = 0.20;
    } else if (annualIncome > 250000) {
      taxRate = 0.05;
    }
    
    deductions.incomeTax = Math.round(earnings.grossEarnings * taxRate);

    // 2. Employee PF Contribution (India: 12% of basic)
    // Assuming 50% of salary is "basic"
    const basicSalary = earnings.regularPay * 0.5;
    deductions.employeeProvidentFund = Math.round(basicSalary * 0.12);

    // 3. Employee Insurance (Health, Accident, etc.)
    // Fixed or percentage-based
    deductions.employeeInsurance = Math.round(grossEarnings * 0.02); // 2% example

    // 4. Other deductions (uniforms, loans, etc.)
    deductions.otherDeductions = []; // Would be fetched from employee preferences

    deductions.totalDeductions =
      deductions.incomeTax +
      deductions.employeeProvidentFund +
      deductions.employeeInsurance +
      deductions.otherDeductions.reduce((sum, d) => sum + d.amount, 0);

    return deductions;
  }

  private calculateEmployerContributions(
    employee: User,
    earnings: EarningsRecord
  ): EmployerContributionRecord {
    
    const basicSalary = earnings.regularPay * 0.5;

    return {
      employerInsurance: Math.round(basicSalary * 0.04), // 4% employer match
      employerProvidentFund: Math.round(basicSalary * 0.12), // 12% employer match
      gratuity: Math.round(earnings.grossEarnings * 0.004) // 0.4% gratuity accumulation
    };
  }

  private calculateAllowances(employee: User): Allowance[] {
    // Examples: Travel, Food, Uniform, etc.
    const allowances: Allowance[] = [];

    if (employee.employmentType === 'fulltime') {
      allowances.push({ type: 'travel', amount: 1000 }); // Example amounts
      allowances.push({ type: 'food', amount: 2000 });
    }

    if (employee.department === 'operations') {
      allowances.push({ type: 'uniform', amount: 500 });
    }

    return allowances;
  }

  async processPayment(payrollId: string, paymentMethod: 'bank_transfer' | 'check' | 'cash'): Promise<PaymentResult> {
    const payroll = await Payroll.findById(payrollId);

    try {
      if (paymentMethod === 'bank_transfer') {
        // Integrate with payment provider (Stripe, Razorpay, etc.)
        const response = await this.paymentProvider.transfer({
          amount: payroll.netPay,
          currency: payroll.currency,
          recipientId: payroll.bankDetails.encryptedAccountNumber,
          description: `Payroll - ${payroll.payrollPeriod.periodStart.toDateString()}`
        });

        payroll.paymentStatus = 'paid';
        payroll.transactionId = response.transactionId;
        payroll.paymentDate = new Date();

        await payroll.save();

        return {
          success: true,
          transactionId: response.transactionId,
          message: 'Payment processed successfully'
        };
      }

      // Other payment methods...

    } catch (error) {
      payroll.paymentStatus = 'failed';
      payroll.remarks = error.message;
      await payroll.save();

      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async generatePayslip(payrollId: string): Promise<Payslip> {
    const payroll = await Payroll.findById(payrollId).populate('userId');

    // Generate PDF
    const doc = new PDFDocument();
    doc.fontSize(25).text('SALARY SLIP', 100, 50);
    doc.fontSize(12);
    doc.text(`Employee: ${payroll.userId.firstName} ${payroll.userId.lastName}`, 100, 100);
    doc.text(`Period: ${payroll.payrollPeriod.periodStart.toDateString()} - ${payroll.payrollPeriod.periodEnd.toDateString()}`);

    // Earnings
    doc.text('EARNINGS', 100, 150, { underline: true });
    doc.text(`Regular Hours: ${payroll.earnings.regularHours} x ${payroll.earnings.regularRate} = ${payroll.earnings.regularPay}`);
    doc.text(`Overtime Hours: ${payroll.earnings.overtimeHours} x ${payroll.earnings.overtimeRate} = ${payroll.earnings.overtimePay}`);
    doc.text(`Gross Earnings: ${payroll.earnings.grossEarnings}`);

    // Deductions
    doc.text('DEDUCTIONS', 100, 250, { underline: true });
    doc.text(`Income Tax: ${payroll.deductions.incomeTax}`);
    doc.text(`PF: ${payroll.deductions.employeeProvidentFund}`);
    doc.text(`Insurance: ${payroll.deductions.employeeInsurance}`);
    doc.text(`Total Deductions: ${payroll.deductions.totalDeductions}`);

    // Net Pay
    doc.fontSize(14).text(`NET PAY: ${payroll.netPay}`, 100, 350, { underline: true });

    // Save to S3
    const filename = `payslip_${payroll.userId._id}_${payroll.payrollPeriod.periodStart.getTime()}.pdf`;
    await uploadToS3(doc, filename);

    return {
      filename,
      url: `https://s3.amazonaws.com/payslips/${filename}`
    };
  }

  private getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return `${d.getUTCFullYear()}-W${Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)}`;
  }
}
```

---

## COMPLIANCE & SECURITY {#compliance-security}

### India Labor Law Compliance

```javascript
// Compliance Engine for India
class IndianLaborComplianceEngine {

  // Key Indian Labor Laws:
  // 1. Minimum Wages Act, 1948
  // 2. Payment of Wages Act, 1936
  // 3. Workmen's Compensation Act, 1923
  // 4. Employment State Insurance Act, 1948
  // 5. Employees' Provident Funds and Miscellaneous Provisions Act, 1952
  // 6. The Bharatiya Nyaya Sanhita (BNS), 2023

  async validateCompliance(
    organizationId: string,
    timeEntry: TimeEntry
  ): Promise<ComplianceResult> {
    
    const org = await Organization.findById(organizationId);
    const user = await User.findById(timeEntry.userId);
    const lastEntry = await this.getLastTimeEntry(user._id);

    const alerts: ComplianceAlert[] = [];

    // 1. Minimum Wage Check (varies by state)
    const minWageThreshold = this.getMinimumWageForState(org.country);
    const hourlyRate = user.salary.baseRate;

    if (hourlyRate < minWageThreshold) {
      alerts.push({
        severity: 'critical',
        rule: 'Minimum Wages Act, 1948',
        message: `Hourly rate (${hourlyRate}) below state minimum wage (${minWageThreshold})`,
        actionRequired: true,
        actionItem: 'Update salary immediately to comply'
      });
    }

    // 2. Maximum Working Hours Check
    // Max 9 hours per day, 48 hours per week (with exceptions)
    const dailyHours = timeEntry.totalWorkTime / 60;
    const weeklyHours = await this.getWeeklyHours(user._id);

    if (dailyHours > 9 && !timeEntry.isOvertimeApproved) {
      alerts.push({
        severity: 'high',
        rule: 'The Bharatiya Nyaya Sanhita, 2023',
        message: `Daily hours (${dailyHours}) exceeds 9-hour limit`,
        actionRequired: true,
        actionItem: 'Seek manager approval for overtime'
      });
    }

    if (weeklyHours > 48) {
      alerts.push({
        severity: 'high',
        rule: 'The Bharatiya Nyaya Sanhita, 2023',
        message: `Weekly hours (${weeklyHours}) exceeds 48-hour limit`,
        actionRequired: true,
        actionItem: 'Redistribute shifts or approve overtime'
      });
    }

    // 3. Rest Period Check (minimum 1 day per week)
    const daysSinceRest = await this.daysSinceLastRest(user._id);
    if (daysSinceRest > 7) {
      alerts.push({
        severity: 'high',
        rule: 'The Bharatiya Nyaya Sanhita, 2023',
        message: `Employee has not had mandatory rest day in ${daysSinceRest} days`,
        actionRequired: true,
        actionItem: 'Schedule immediate rest day'
      });
    }

    // 4. Mandatory Breaks Check
    const breakDuration = timeEntry.breaks.reduce((sum, b) => sum + b.duration, 0);
    const minBreakRequired = this.calculateMinimumBreak(dailyHours);

    if (breakDuration < minBreakRequired) {
      alerts.push({
        severity: 'medium',
        rule: 'The Bharatiya Nyaya Sanhita, 2023',
        message: `Insufficient break time (${breakDuration}min vs required ${minBreakRequired}min)`,
        actionRequired: false,
        actionItem: 'Ensure employee took proper breaks'
      });
    }

    // 5. Overtime Payment Check
    const overtimeRate = user.salary.baseRate * (user.salary.overtimeMultiplier || 1.5);
    if (timeEntry.overtimeHours > 0 && !this.validateOvertimePayment(user._id, overtimeRate)) {
      alerts.push({
        severity: 'critical',
        rule: 'Payment of Wages Act, 1936',
        message: 'Overtime payment not calculated correctly',
        actionRequired: true,
        actionItem: 'Verify and update overtime calculation'
      });
    }

    // 6. Gratuity Eligibility Check (5+ years of service)
    const yearsOfService = this.calculateYearsOfService(user.createdAt);
    if (yearsOfService >= 5 && !user.gratuityEligible) {
      alerts.push({
        severity: 'high',
        rule: "Employees' Provident Funds Act, 1952",
        message: `Employee is eligible for gratuity (${yearsOfService} years of service)`,
        actionRequired: true,
        actionItem: 'Calculate and process gratuity'
      });
    }

    return {
      compliant: alerts.every(a => a.severity !== 'critical'),
      alerts,
      actionItems: alerts.filter(a => a.actionRequired).map(a => a.actionItem)
    };
  }

  private getMinimumWageForState(state: string): number {
    // Actual minimum wages vary by state and industry
    // This is a simplified lookup
    const minimumWages: Record<string, number> = {
      'Haryana': 11000, // Per month or calculate hourly
      'Delhi': 14000,
      'Karnataka': 10500,
      'Maharashtra': 12100,
      // ... other states
    };

    return (minimumWages[state] || 10000) / 22 / 8; // Convert to hourly (22 working days, 8 hours)
  }

  private calculateMinimumBreak(hoursWorked: number): number {
    // Breaks are mandatory based on shift duration
    if (hoursWorked <= 6) return 0;
    if (hoursWorked <= 9) return 30; // 30 minutes
    return 60; // 1 hour or more
  }

  private async getWeeklyHours(userId: string): Promise<number> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const entries = await TimeEntry.find({
      userId,
      clockInTime: { $gte: weekStart },
      status: 'completed'
    });

    return entries.reduce((sum, e) => sum + e.totalWorkTime / 60, 0);
  }

  private async daysSinceLastRest(userId: string): Promise<number> {
    const entries = await TimeEntry.find(
      { userId },
      { clockInTime: 1 },
      { sort: { clockInTime: -1 }, limit: 10 }
    );

    for (let i = 0; i < entries.length - 1; i++) {
      const daysBetween = Math.floor(
        (entries[i].clockInTime.getTime() - entries[i + 1].clockInTime.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysBetween >= 1) return i; // Found a rest day
    }

    return Math.floor((Date.now() - entries[entries.length - 1].clockInTime.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

### GDPR Compliance Implementation

```javascript
// GDPR Compliance for EU-based organizations
class GDPRCompliance {

  // Key Requirements:
  // 1. Data minimization (collect only necessary data)
  // 2. Purpose limitation (use data only for stated purposes)
  // 3. Storage limitation (retain only as long as necessary)
  // 4. Right to access, rectification, erasure
  // 5. Right to data portability
  // 6. Consent management
  // 7. Privacy by design

  async requestDataAccess(userId: string): Promise<EmployeeDataExport> {
    const user = await User.findById(userId);

    const data = {
      personalInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      },
      employment: {
        employmentType: user.employmentType,
        employmentStatus: user.employmentStatus,
        startDate: user.createdAt,
        department: user.department
      },
      workingHistory: await TimeEntry.find({ userId }, {}, { limit: 1000 }),
      payrollHistory: await Payroll.find({ userId }, {}, { limit: 120 }), // 10 years
      applicationHistory: await Application.find({ userId })
    };

    // Generate GDPR-compliant export (PDF + JSON)
    const exportFile = await this.generateGDPRExport(data);

    // Log the request for audit
    await AuditLog.create({
      organizationId: user.organizationId,
      userId: userId,
      action: 'GDPR_DATA_ACCESS_REQUEST',
      resource: 'employee',
      resourceId: userId,
      timestamp: new Date()
    });

    // Must respond within 30 days
    return exportFile;
  }

  async requestDataDeletion(userId: string): Promise<DeletionResult> {
    const user = await User.findById(userId);

    // 1. Right to be forgotten - delete personal data
    const deletionMap = {
      // CRITICAL: Keep only legally required data
      // KEEP: Payroll records (7+ years for tax compliance)
      // DELETE: Phone, address, optional contact info

      phoneNumber: true, // Can be deleted
      address: true, // Can be deleted
      optionalSkills: true, // Can be deleted
      preferencesData: true, // Can be deleted

      // RETAIN for compliance
      // Tax ID (encrypted, for 7 years)
      // Payroll records (7 years, for tax/pension)
      // Work hours (may be needed for pension calculation)
    };

    try {
      // Step 1: Pseudonymize data
      await User.updateOne(
        { _id: userId },
        {
          $set: {
            firstName: 'DELETED',
            lastName: 'DELETED',
            email: `deleted_${generateRandomId()}@anonymized.local`,
            phone: null,
            address: null,
            skills: [],
            preferences: null,
            deviceTokens: []
          }
        }
      );

      // Step 2: Delete application logs and non-critical records
      await Application.deleteMany({ userId });
      await AnalyticsEvents.deleteMany({ userId });

      // Step 3: Schedule permanent deletion after retention period
      await PermanentDeletionQueue.create({
        userId,
        scheduledFor: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000) // 7 years
      });

      await AuditLog.create({
        organizationId: user.organizationId,
        userId,
        action: 'GDPR_DELETION_REQUEST',
        resource: 'employee',
        resourceId: userId,
        timestamp: new Date()
      });

      return {
        success: true,
        message: 'Deletion request processed. Data will be permanently deleted after retention period.',
        retentionUntil: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      throw new Error(`Deletion failed: ${error.message}`);
    }
  }

  async notifyDataBreach(affectedUserCount: number, dataType: string) {
    // GDPR Article 33: Notify supervisory authority within 72 hours
    // GDPR Article 34: Notify affected individuals without undue delay

    const breachNotification = {
      timestamp: new Date(),
      affectedUsers: affectedUserCount,
      dataType,
      notificationSent: false,
      authorityNotified: false
    };

    // Send to Data Protection Authority
    await this.notifyDataProtectionAuthority(breachNotification);

    // Notify affected individuals
    // (Implementation would send emails/notifications)

    return breachNotification;
  }

  async ensureConsentManagement(userId: string): Promise<ConsentRecord> {
    // Ensure user has given explicit consent for data processing

    const existingConsent = await ConsentLog.findOne({ userId });

    if (!existingConsent) {
      // Request consent
      await this.requestExplicitConsent(userId);

      return {
        consentGiven: false,
        message: 'Consent request sent to user'
      };
    }

    return {
      consentGiven: true,
      consentDate: existingConsent.consentDate,
      purposes: existingConsent.purposes
    };
  }

  // Data minimization: Only collect essential fields
  private minimalUserSchema = {
    // COLLECT
    email: true,
    firstName: true,
    lastName: true,
    employmentType: true,
    department: true,

    // DON'T COLLECT unless necessary
    medicalInfo: false,
    familyInfo: false,
    religionInfo: false,
    politicalAffiliation: false
  };
}
```

### Security Best Practices

```javascript
// 1. ENCRYPTION
class EncryptionService {
  
  // AES-256 for at-rest encryption
  encryptPayrollData(data: PayrollRecord): EncryptedData {
    const key = process.env.ENCRYPTION_KEY; // 256-bit key
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm: 'aes-256-cbc',
      timestamp: Date.now()
    };
  }

  decryptPayrollData(encryptedData: EncryptedData): PayrollRecord {
    const key = process.env.ENCRYPTION_KEY;
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key),
      Buffer.from(encryptedData.iv, 'hex')
    );

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

// 2. TLS 1.3 for in-transit encryption
const httpsOptions = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  minVersion: 'TLSv1.3'
};

https.createServer(httpsOptions, app).listen(443);

// 3. Role-Based Access Control (RBAC)
const rbacMiddleware = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user.roles;

    const roleHierarchy = {
      'admin': 5,
      'manager': 3,
      'supervisor': 2,
      'worker': 1,
      'viewer': 0
    };

    const userLevel = Math.max(...userRoles.map(r => roleHierarchy[r] || 0));
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    if (userLevel >= requiredLevel) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

// 4. Two-Factor Authentication (2FA)
app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !await bcrypt.compare(req.body.password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Send 2FA code via email or SMS
  const code = generateRandomCode(6);
  await User.updateOne({ _id: user._id }, { twoFACode: code, twoFAExpires: Date.now() + 5 * 60 * 1000 });

  await sendEmail(user.email, 'Your 2FA Code', `Your code is: ${code}`);

  res.json({ message: '2FA code sent', requiresTwoFA: true });
});

// 5. API Key Management
class APIKeyService {
  async generateApiKey(organizationId: string): Promise<APIKey> {
    const key = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    const apiKey = await APIKey.create({
      organizationId,
      hash,
      createdAt: new Date(),
      rateLimit: 1000 // requests per hour
    });

    // Only show once
    return {
      key, // Show to user only once
      id: apiKey._id,
      message: 'Save this key securely. It will not be shown again.'
    };
  }

  async validateApiKey(key: string): Promise<Organization | null> {
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = await APIKey.findOne({ hash, isActive: true });

    if (apiKey) {
      return Organization.findById(apiKey.organizationId);
    }

    return null;
  }
}

// 6. Rate Limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// 7. CORS Security
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://app.example.com'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 8. SQL Injection Prevention (MongoDB)
// Use parameterized queries (built-in with Mongoose)
// SAFE:
TimeEntry.find({ userId: new ObjectId(userInput) });

// UNSAFE (never use):
// TimeEntry.find(eval(`{ userId: ${userInput} }`));

// 9. Audit Logging
const auditLog = (action: string, resource: string, changes?: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await AuditLog.create({
      userId: req.user._id,
      organizationId: req.user.organizationId,
      action,
      resource,
      resourceId: req.params.id,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });

    next();
  };
};

app.put('/api/payroll/:id', auditLog('UPDATE', 'payroll'), updatePayroll);

// 10. Input Validation
import Joi from 'joi';

const clockInSchema = Joi.object({
  locationId: Joi.string().required().pattern(/^[0-9a-f]{24}$/), // ObjectId
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180),
  accuracy: Joi.number().required().min(0).max(200)
});

app.post('/api/timeclock/clockin', (req, res, next) => {
  const { error, value } = clockInSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details });
  }
  req.validatedData = value;
  next();
});
```

---

## API ARCHITECTURE & INTEGRATIONS {#api-architecture}

### RESTful API Design

```javascript
// API Base Routes
// Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/2fa/verify

// Organizations
GET    /api/v1/organizations/:id
PUT    /api/v1/organizations/:id
GET    /api/v1/organizations/:id/settings

// Users (Employees)
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id (soft delete)

// Locations
GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/:id
PUT    /api/v1/locations/:id

// Shifts
GET    /api/v1/shifts
POST   /api/v1/shifts
GET    /api/v1/shifts/:id
PUT    /api/v1/shifts/:id
POST   /api/v1/shifts/:id/publish
GET    /api/v1/shifts/:id/eligible-workers

// Time Clock
POST   /api/v1/timeclock/clockin
POST   /api/v1/timeclock/clockout
GET    /api/v1/timeclock/entries
POST   /api/v1/timeclock/entries/:id/approve
GET    /api/v1/timeclock/entries/:id/geofence-validation

// Applications (Shift Bids)
POST   /api/v1/applications
GET    /api/v1/applications/:id
PUT    /api/v1/applications/:id/accept
PUT    /api/v1/applications/:id/reject

// Payroll
GET    /api/v1/payroll
POST   /api/v1/payroll/generate
GET    /api/v1/payroll/:id
GET    /api/v1/payroll/:id/payslip
PUT    /api/v1/payroll/:id/process

// Analytics
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/labor-cost
GET    /api/v1/analytics/utilization
GET    /api/v1/analytics/overtime-trends

// Notifications
GET    /api/v1/notifications
GET    /api/v1/notifications/:id
PUT    /api/v1/notifications/:id/read

// Reports
GET    /api/v1/reports/attendance
GET    /api/v1/reports/compliance
GET    /api/v1/reports/payroll
POST   /api/v1/reports/export
```

### Third-Party Integrations

```javascript
// 1. Payroll Provider Integration (Razorpay, ADP, Workday)
class PayrollIntegration {
  async syncToPayrollProvider(payrollId: string) {
    const payroll = await Payroll.findById(payrollId);
    const organization = await Organization.findById(payroll.organizationId);

    // Check which provider is configured
    if (organization.integrations.find(i => i.name === 'payroll_provider')?.status === 'connected') {
      const provider = organization.integrations.find(i => i.name === 'payroll_provider').provider;

      if (provider === 'razorpay') {
        await this.syncToRazorpay(payroll);
      } else if (provider === 'adp') {
        await this.syncToADP(payroll);
      }
    }
  }

  private async syncToRazorpay(payroll: PayrollRecord) {
    // Razorpay Payroll API
    const response = await axios.post('https://api.razorpay.com/v1/payroll/generate', {
      employee_id: payroll.userId,
      period_start: payroll.payrollPeriod.periodStart,
      period_end: payroll.payrollPeriod.periodEnd,
      gross_earnings: payroll.earnings.grossEarnings,
      deductions: payroll.deductions.totalDeductions,
      net_pay: payroll.netPay
    }, {
      auth: {
        username: process.env.RAZORPAY_KEY_ID,
        password: process.env.RAZORPAY_KEY_SECRET
      }
    });

    // Update with external ID
    await Payroll.updateOne(
      { _id: payroll._id },
      { externalId: response.data.id, syncStatus: 'synced' }
    );
  }
}

// 2. Applicant Tracking System (ATS) Integration
class ATSIntegration {
  async syncWorkerProfile(userId: string) {
    const user = await User.findById(userId);
    const atsProvider = await this.getATSProvider(user.organizationId);

    if (atsProvider?.status !== 'connected') return;

    // Map Ubeya worker to ATS candidate
    const candidate = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      skills: user.skills.map(s => ({ name: s.name, level: s.level })),
      applications: await Application.find({ userId }).lean()
    };

    // Send to ATS via API/webhook
    if (atsProvider.provider === 'bamboohr') {
      await this.syncToBambooHR(candidate);
    }
  }
}

// 3. CRM Integration (for staffing agencies)
class CRMIntegration {
  async syncClientData(organizationId: string) {
    const org = await Organization.findById(organizationId);
    const crmProvider = org.integrations.find(i => i.name === 'crm');

    if (crmProvider?.status !== 'connected') return;

    // Sync metrics to CRM
    const metrics = {
      totalWorkers: await User.countDocuments({ organizationId }),
      shiftsCompleted: await TimeEntry.countDocuments({
        organizationId,
        status: 'completed',
        clockInTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      satisfactionScore: await this.calculateSatisfactionScore(organizationId)
    };

    if (crmProvider.provider === 'salesforce') {
      await this.syncToSalesforce(organizationId, metrics);
    }
  }
}

// 4. HRIS Integration
class HRISIntegration {
  async syncEmployeeData(userId: string) {
    const user = await User.findById(userId);
    const org = await Organization.findById(user.organizationId);
    const hrisProvider = org.integrations.find(i => i.name === 'hris');

    if (hrisProvider?.status !== 'connected') return;

    const employeeData = {
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      employmentType: user.employmentType,
      salary: user.salary,
      attendanceData: await TimeEntry.find(
        { userId },
        { totalWorkTime: 1, clockInTime: 1, clockOutTime: 1 }
      ).limit(100)
    };

    if (hrisProvider.provider === 'workday') {
      await this.syncToWorkday(employeeData);
    } else if (hrisProvider.provider === 'successfactors') {
      await this.syncToSuccessFactors(employeeData);
    }
  }
}

// Webhook Handler for Inbound Integrations
app.post('/api/v1/webhooks/payroll-provider', async (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process webhook
  const event = req.body;

  if (event.type === 'payment_confirmed') {
    await Payroll.updateOne(
      { externalId: event.payroll_id },
      { paymentStatus: 'paid', paymentDate: new Date() }
    );
  }

  res.json({ success: true });
});
```

---

## REACT NATIVE ARCHITECTURE {#react-native-arch}

### Shared Code Strategy

```
project/
├── packages/
│   ├── shared/               # Shared TypeScript code
│   │   ├── src/
│   │   │   ├── types/        # TypeScript interfaces
│   │   │   ├── services/     # API, auth, storage
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── utils/        # Helper functions
│   │   │   └── constants/    # Enums, constants
│   │   └── tsconfig.json
│   ├── web/                  # React web app
│   │   ├── src/
│   │   │   ├── components/   # Web-specific UI
│   │   │   ├── pages/
│   │   │   └── App.tsx
│   │   └── package.json
│   └── mobile/               # React Native app
│       ├── src/
│       │   ├── screens/      # Native screens
│       │   ├── navigation/
│       │   └── App.tsx
│       └── package.json
```

### Implementation Pattern

```typescript
// shared/src/services/api.ts
import axios, { AxiosInstance } from 'axios';

export class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor for token
    this.client.interceptors.request.use((config) => {
      const token = this.getStoredToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor for 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          // Retry original request
          return this.client(error.config);
        }
        throw error;
      }
    );
  }

  async clockIn(locationId: string, location: GeoLocation): Promise<TimeEntry> {
    return this.client.post('/api/v1/timeclock/clockin', {
      locationId,
      clockInLocation: location,
      timestamp: new Date().toISOString()
    });
  }

  async getShifts(): Promise<Shift[]> {
    return this.client.get('/api/v1/shifts');
  }

  // Platform-agnostic; web and mobile use the same instance
  private getStoredToken(): string | null {
    // This will be overridden by platform-specific implementations
    throw new Error('Must implement getStoredToken');
  }
}

// web/src/services/apiWeb.ts
import { APIClient } from '@ubeya/shared';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Web compatible

export class WebAPIClient extends APIClient {
  protected getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

// mobile/src/services/apiMobile.ts
import { APIClient } from '@ubeya/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class MobileAPIClient extends APIClient {
  protected async getStoredToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  }
}

// shared/src/hooks/useShifts.ts
import { useEffect, useState } from 'react';
import { APIClient } from '../services/api';

export function useShifts(apiClient: APIClient) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.getShifts();
        setShifts(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiClient]);

  return { shifts, loading, error };
}

// web/src/components/ShiftList.tsx
import React from 'react';
import { useShifts } from '@ubeya/shared';
import { webAPIClient } from '../services';

export function ShiftList() {
  const { shifts, loading, error } = useShifts(webAPIClient);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {shifts.map(shift => (
        <div key={shift._id}>
          <h3>{shift.shiftNumber}</h3>
          <p>{new Date(shift.startTime).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

// mobile/src/screens/ShiftsScreen.tsx
import React from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import { useShifts } from '@ubeya/shared';
import { mobileAPIClient } from '../services';
import ShiftCard from '../components/ShiftCard';

export function ShiftsScreen() {
  const { shifts, loading, error } = useShifts(mobileAPIClient);

  if (loading) return <ActivityIndicator size="large" />;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <FlatList
        data={shifts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ShiftCard shift={item} />}
      />
    </View>
  );
}
```

### Offline-First Sync Queue

```typescript
// shared/src/services/syncQueue.ts
interface SyncOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

export class SyncQueue {
  private queue: SyncOperation[] = [];
  private isProcessing = false;

  async enqueue(operation: Omit<SyncOperation, 'id' | 'retryCount' | 'status' | 'timestamp'>) {
    const op: SyncOperation = {
      ...operation,
      id: Math.random().toString(36).substr(2, 9),
      retryCount: 0,
      status: 'pending',
      timestamp: Date.now()
    };

    this.queue.push(op);
    await this.persistQueue();
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue[0];

      try {
        operation.status = 'processing';
        await this.executeOperation(operation);
        this.queue.shift();
        await this.persistQueue();
      } catch (error) {
        if (operation.retryCount < 3) {
          operation.retryCount++;
          // Exponential backoff
          await this.delay(Math.pow(2, operation.retryCount) * 1000);
        } else {
          operation.status = 'failed';
          this.queue.shift();
          await this.persistQueue();
        }
      }
    }

    this.isProcessing = false;
  }

  private async executeOperation(op: SyncOperation) {
    // Implementation depends on entity type
    switch (op.entity) {
      case 'timeentry':
        await this.api.post('/api/v1/timeentries', op.data);
        break;
      case 'application':
        await this.api.post(`/api/v1/applications/${op.data.id}/accept`);
        break;
      // ... other entities
    }
  }

  private async persistQueue() {
    // Store queue in local storage (web) or async storage (mobile)
    await this.storage.setItem('syncQueue', JSON.stringify(this.queue));
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## SYSTEM DESIGN PATTERNS {#system-design}

### Caching Strategy

```javascript
// Redis Cache Layer
class CacheService {
  async getShiftsWithCache(locationId: string, date: string): Promise<Shift[]> {
    const cacheKey = `shifts:${locationId}:${date}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const shifts = await Shift.find({
      locationId,
      startTime: { $gte: new Date(date), $lt: new Date(date) + 1 day }
    });

    // Store in cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(shifts));

    return shifts;
  }

  async invalidateShiftCache(shiftId: string) {
    const shift = await Shift.findById(shiftId);

    // Invalidate affected caches
    const date = shift.startTime.toISOString().split('T')[0];
    await redis.del(`shifts:${shift.locationId}:${date}`);

    // Invalidate eligibility cache
    await redis.del(`eligibility:${shiftId}`);

    // Broadcast to websockets
    io.emit('cache_invalidated', { entity: 'shift', id: shiftId });
  }
}

// Cache patterns:
// 1. Cache-Aside: Check cache, if miss query DB and store
// 2. Write-Through: Always update cache and DB
// 3. Write-Behind: Update cache first, async DB update
// 4. TTL-Based: Auto-expire entries (default: 1 hour for shifts, 24 hours for user data)
```

### Circuit Breaker Pattern (for external APIs)

```javascript
class PaymentServiceCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private failureThreshold = 5;
  private resetTimeout = 60000; // 1 minute

  async processPayment(payrollId: string) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Payment service is temporarily unavailable');
      }
    }

    try {
      const result = await this.paymentProvider.process(payrollId);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      // Alert ops team
      alertOpsTeam('Payment service circuit breaker OPEN');
    }
  }
}
```

---

## DEPLOYMENT & SCALING STRATEGIES

### Load Testing Recommendations

```
Target: 10,000 concurrent users
├── Shift browsing: 7,000 users (read-heavy)
├── Scheduling operations: 2,000 users (moderate CPU)
├── Time clock operations: 1,000 users (geofence checks, ~50ms per request)
└── Payroll calculations: During specific periods

Load test profile:
├── Ramp-up: 0 → 10K users over 30 minutes
├── Sustain: 10K users for 2 hours
└── Spike: Sudden 20% increase for 5 minutes

Expected resource utilization:
├── CPU: 60-70% (with room for spikes)
├── Memory: 55-65%
├── Network: <30% of capacity
└── Database connections: <50% pool
```

### Infrastructure Autoscaling

```yaml
# AWS ECS Autoscaling
AUtoScalingTargetTrackingScalingPolicyDetail:
  TargetValue: 70  # Scale when CPU > 70%
  PredefinedMetricSpecification:
    PredefinedMetricType: ECSServiceAverageCPUUtilization
  ScaleOutCooldown: 60  # seconds
  ScaleInCooldown: 300  # seconds
  MinCapacity: 3  # Always run at least 3 instances
  MaxCapacity: 20  # Max 20 instances

# Database Connection Pooling
mongodb_connection_pool:
  min_pool_size: 10
  max_pool_size: 50
  max_idle_time: 60000  # Close idle connections after 1 minute
  socket_timeout: 30000

# Redis Cluster Configuration
redis:
  cluster_mode: enabled
  nodes: 6  # 3 master + 3 slave
  replica_factor: 2
```

---

## CONCLUSION & NEXT STEPS

**Timeline to MVP Launch:**
- **Weeks 1-2**: Database design + API architecture setup
- **Weeks 3-5**: Core microservices (auth, scheduling, time clock)
- **Weeks 6-7**: Payroll engine + compliance layer
- **Week 8**: Testing + deployment preparation
- **Post-launch**: Iterate based on user feedback, implement SHOULD-HAVE features

**Key Success Metrics:**
- User retention: >80% after 30 days
- Shift fill rate: >95%
- Clock-in reliability: >99.5% uptime
- Payroll accuracy: 100%
- Support response time: <2 hours

**Future Roadmap:**
1. Q2: Auto-scheduling AI (after collecting 3 months of data)
2. Q3: Advanced analytics and forecasting
3. Q4: Multi-language support and regional compliance

This comprehensive architecture supports 10,000+ concurrent users while maintaining compliance, security, and exceptional user experience across web and mobile platforms.
