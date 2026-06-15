# Architecture & Technical Design

## System Architecture

SoActiv follows a clean client-server architecture with multi-tenant data isolation:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │
│  │  Admin   │  │  Staff   │  │  Member  │  │ Super Admin  │     │
│  │  Portal  │  │  Portal  │  │  Portal  │  │    Panel     │     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘     │
└───────┼─────────────┼─────────────┼────────────────┼─────────────┘
        │             │             │                │
        └─────────────┴─────────────┴────────────────┘
                              │ HTTP REST + WebSocket
┌─────────────────────────────▼───────────────────────────────────┐
│                    BACKEND (Bun + Express + TypeScript)          │
│                                                                  │
│  Auth Middleware  →  Permission Middleware  →  Controllers       │
│                                                                  │
│  Background Schedulers:                                          │
│    • Meal Reminder Scheduler (daily)                             │
│    • Follow-Up Reminder Scheduler (daily)                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────▼───────────────┐
              │         MongoDB Database        │
              │  (Mongoose ODM, multi-tenant)  │
              └────────────────────────────────┘
```

---

## Technology Stack

### Backend (`be/`)

| Layer | Technology |
|-------|-----------|
| **Runtime** | [Bun](https://bun.sh) v1.2.5+ |
| **Framework** | Express.js v5 |
| **Language** | TypeScript |
| **Database** | MongoDB + Mongoose ODM |
| **Auth** | JWT (HTTP-only cookies) + Bcrypt |
| **Real-time** | Socket.IO |
| **File Uploads** | Multer + Cloudinary |
| **Google SSO** | Firebase Admin SDK |
| **Email** | Nodemailer + Resend |
| **Containerization** | Docker (Dockerfile included) |

### Frontend (`fe/`)

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 |
| **Language** | TypeScript |
| **Build Tool** | Vite |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Forms** | React Hook Form |
| **Real-time** | Socket.io-client |
| **QR Code** | qrcode.react + @yudiel/react-qr-scanner |

---

## Multi-Tenancy Design

Every gym is a **tenant**. Data isolation is enforced through the `adminId` / `userId` / `gym` field on every document.

```
Super Admin
    └── Gym A (tenant)
            ├── Admin (owner/userId)
            ├── Staff (createdBy = Admin ID, gym = Gym ID)
            └── Clients (userId = Admin ID)

    └── Gym B (tenant)
            ├── Admin
            ├── Staff
            └── Clients
```

**Key Rule:** Every query must filter by the admin's ID (or gym ID) to prevent cross-tenant data leakage.

---

## Project Directory Structure

```
SoActiv/
├── Doc/                           # This documentation folder
├── be/                            # Backend (Bun + Express + TypeScript)
│   ├── controllers/               # Business logic handlers
│   │   ├── user.controller.ts
│   │   ├── client.controllers.ts
│   │   ├── client.bulk.controllers.ts
│   │   ├── staff.controllers.ts
│   │   ├── staff.bulk.controllers.ts
│   │   ├── enquiry.controllers.ts
│   │   ├── enquiry.bulk.controllers.ts
│   │   ├── enquiry.expiry.controllers.ts
│   │   ├── followUp.controllers.ts
│   │   ├── schedule.controllers.ts
│   │   ├── pt.controllers.ts
│   │   ├── pt.expiry.controllers.ts
│   │   ├── clientAttendance.controllers.ts
│   │   ├── staffAttendance.controllers.ts
│   │   ├── dietPlan.controllers.ts
│   │   ├── exercise.controllers.ts
│   │   ├── fitnessGoal.controllers.ts
│   │   ├── progressPhoto.controllers.ts
│   │   ├── announcement.controllers.ts
│   │   ├── notification.controllers.ts
│   │   ├── contact.controllers.ts
│   │   └── superAdmin.*.controllers.ts
│   ├── models/                    # Mongoose schemas
│   │   ├── user.model.ts
│   │   ├── gym.model.ts
│   │   ├── client.model.ts
│   │   ├── staff.model.ts
│   │   ├── plan.model.ts
│   │   ├── enquiry.model.ts
│   │   ├── followUp.model.ts
│   │   ├── schedule.model.ts
│   │   ├── ptPlan.model.ts
│   │   ├── ptAssignment.model.ts
│   │   ├── clientAttendance.model.ts
│   │   ├── staffAttendance.model.ts
│   │   ├── dietPlan.model.ts
│   │   ├── exercise.model.ts
│   │   ├── fitnessGoal.model.ts
│   │   ├── progressPhoto.model.ts
│   │   ├── announcement.model.ts
│   │   ├── notification.model.ts
│   │   ├── contact.model.ts
│   │   ├── subscription.model.ts
│   │   └── superAdminLog.model.ts
│   ├── routes/                    # API route registrations
│   ├── middlewares/               # Auth, permission, rate limiting
│   │   ├── auth.middleware.ts
│   │   ├── superAdminAuth.middleware.ts
│   │   ├── permission.middleware.ts
│   │   ├── featureFlag.middleware.ts
│   │   ├── checkGymStatus.middleware.ts
│   │   ├── checkPlanLimit.middleware.ts
│   │   └── upload.middleware.ts
│   ├── lib/                       # ApiError, AsyncHandler, constants
│   ├── db/                        # MongoDB connection
│   ├── utils/                     # Schedulers, migration scripts, seeders
│   └── index.ts                   # Server entry point
│
└── fe/                            # Frontend (React + Vite + TypeScript)
    └── src/
        ├── App.tsx                # Routes and context wrappers
        ├── contexts/              # AuthContext, ThemeContext, ToastContext
        ├── hooks/                 # Custom data hooks per domain
        ├── components/            # Shared UI components
        │   ├── ui/                # Button, Card, Input, Modal, Badge, etc.
        │   ├── layout/            # AdminLayout, StaffLayout, MemberLayout
        │   ├── routing/           # ProtectedRoute
        │   ├── pt/                # PTAssignModal, SessionLogModal, etc.
        │   ├── schedule/          # Schedule UI components
        │   └── forms/             # Registration forms
        └── pages/
            ├── admin/             # Gym Admin pages
            ├── staff/             # Staff portal pages
            ├── member/            # Member portal pages
            ├── superAdmin/        # Super Admin panel
            └── auth/              # Login/Register pages
```

---

## Authentication Flow

```
1. User submits email + password
2. Backend verifies credentials (bcrypt hash comparison)
3. Backend generates JWT signed with ACCESS_TOKEN_SECRET
4. JWT stored in HTTP-only cookie (accessToken)
5. Every subsequent request sends cookie automatically
6. authMiddleware verifies JWT and populates req.user
7. Permission middleware checks role/position before controller runs
```

### Token Storage

| User Type | Cookie Name |
|-----------|-------------|
| Admin / Staff / Member | `accessToken` |
| Super Admin | `super_admin_token` |

Super Admin uses a **separate cookie** to prevent session collisions with gym admin accounts.

---

## Data Flow Example: Logging a PT Session

```
Trainer clicks "Log Session"
    ↓
Frontend: POST /api/v1/pt/assignments/:id/session
    ↓
authMiddleware → verifies JWT, sets req.user (role=staff, position=trainer)
    ↓
requirePosition(['trainer']) → allows trainer through
    ↓
logPTSession controller:
    • Find assignment by ID
    • Verify assignment.trainerId === req.user.staffId
    • Check assignment is 'active' and sessions remain
    • Increment usedSessions, push to sessionLogs[]
    • If usedSessions >= totalSessions → mark 'completed'
    ↓
Response: Updated assignment with new session log
    ↓
Frontend: Updates card with new session count
```

---

## Feature Flags

Super Admins can toggle features on/off per gym:

| Flag | Controlled Routes |
|------|------------------|
| `pt` | `/api/v1/pt/*` |
| `attendance` | `/api/v1/client-attendance/*` |
| `payments` | Future payment routes |
| `classes` | Future class scheduling routes |
| `memberPortal` | `/member/*` login |

Middleware: `checkGymFeature('pt')` reads the gym's `features.pt` field and returns 403 if disabled.

---

## Real-time Features (Socket.IO)

The Socket.IO server is mounted at startup in `index.ts` and attached to every request via `req.io`.

Current real-time usage:
- **Attendance check-in** broadcasts live updates to admin dashboards
- **Notifications** are emitted to specific user sockets

To emit from a controller:
```ts
const io = (req as any).io;
io.to(socketRoom).emit('eventName', { data });
```
