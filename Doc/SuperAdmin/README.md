# Super Admin Documentation

## Overview

The **Super Admin** is the highest-privileged user in SoActiv. This role exists at the **SaaS platform level** — above individual gyms. A Super Admin manages all gyms (tenants), their billing, feature access, admin accounts, contact form submissions, pricing plans, and platform-wide analytics from one central panel.

> Super Admin logs in at: **`/super-admin/login`**
> Super Admin portal: **`/super-admin/`**

---

## Responsibilities

| Area | Actions |
|------|---------|
| **Gym Management** | Create, view, update, suspend, activate, delete gyms |
| **Billing** | Assign SaaS plans (free/pro/enterprise), manage subscriptions |
| **Feature Flags** | Enable/disable features per gym |
| **Admin Accounts** | Create, update, reset passwords of gym owners |
| **Analytics** | View platform-wide metrics and growth charts |
| **Audit Trail** | View all admin actions with IP and timestamp |
| **Plans** | Manage public SaaS pricing plans |
| **Contact Inbox** | Read public contact form submissions |
| **Announcements** | Post platform-wide announcements |
| **Profile** | Update own profile and password |
| **Impersonation** | Log in as any gym admin for support |

---

## Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/super-admin/dashboard` | Platform metrics and growth charts |
| Gyms List | `/super-admin/gyms` | All registered gyms |
| Gym Details | `/super-admin/gyms/:id` | Single gym details, stats, feature toggles |
| Admins List | `/super-admin/admins` | All gym owner accounts |
| Plans | `/super-admin/plans` | SaaS pricing plans |
| Contact Inbox | `/super-admin/contacts` | Contact form submissions |
| Announcements | `/super-admin/announcements` | Platform-wide notices |
| Profile | `/super-admin/profile` | Own profile settings |

---

## Authentication

Super Admin uses a **separate authentication flow** from regular gym admins:

- **Login endpoint:** `POST /api/v1/super-admin/auth/login`
- **Cookie name:** `super_admin_token` (separate from the gym admin `accessToken`)
- **Middleware:** `requireSuperAdminAuth` (not the same as `authMiddleware`)

> This separation prevents a gym admin from accidentally inheriting Super Admin privileges.

**Login flow:**
```
POST /api/v1/super-admin/auth/login
Body: { email, password }

Response sets HTTP-only cookie: super_admin_token
All subsequent Super Admin requests read this cookie.
```

### ⚠️ Super Admin Password Setup

The `createSuperAdmin.ts` script creates the initial Super Admin account. It must pass the **raw (unhashed) password** to `User.create()`. The Mongoose `pre("save")` hook on the User model automatically hashes it once.

**Do NOT manually pre-hash** with `bcrypt.hash()` before calling `User.create()` — this causes a double-hash that makes login fail with `401 Unauthorized`.

**Default credentials:**
Set via `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` environment variables.
URL:      http://localhost:5173/super-admin/login

**Create super admin:**
```bash
cd be
bun run utils/createSuperAdmin.ts
```

---

## Feature Flags

Super Admin can toggle the following features per gym:

| Flag Name | What It Controls |
|-----------|-----------------|
| `payments` | Payment gateway / billing features |
| `attendance` | Client check-in/out system |
| `pt` | Personal Training module |
| `classes` | Group class scheduling |
| `memberPortal` | Members can log in and use self-service portal |

**Toggle via API:**
```
PATCH /api/v1/super-admin/gyms/:gymId/features/:featureName
Body: { "enabled": true }
```

When a feature is **disabled**, the corresponding backend routes return `403 Forbidden` via the `checkGymFeature` middleware. The Member portal also displays warning banners for disabled features.

---

## SaaS Plans

Super Admin manages the pricing plans listed on the public Pricing page:

**Plan fields:**
- `name` — Plan display name (e.g., "Pro", "Enterprise")
- `price` — Monthly price
- `features` — Array of included feature descriptions
- `maxMembers` — Member limit
- `maxStaff` — Staff limit
- `isActive` — Whether plan is publicly visible

---

## Gym Lifecycle

```
Create Gym → Trial (14 days) → Active → Suspended → (Reactivate or Delete)
```

| Status | Meaning |
|--------|---------|
| `trial` | New gym, limited-time free access |
| `active` | Paid subscription, full access |
| `suspended` | Manually suspended, no access |
| `expired` | Trial ended without upgrading |

Gyms are **soft-deleted** (not permanently removed). The `deletedAt` field is set.

---

## Admin Impersonation

Super Admins can impersonate any gym admin for support and debugging:

```
POST /api/v1/super-admin/impersonate/:adminId
```

This generates a temporary token with the admin's credentials. All actions under impersonation are logged in the audit trail.

---

## Audit Trail

Every Super Admin action is recorded in the `superadminlogs` collection:

| Logged Fields | Example |
|--------------|---------|
| `action` | `suspend_gym`, `toggle_feature`, `login` |
| `targetType` | `gym`, `admin`, `system` |
| `targetId` | The affected gym/admin ObjectId |
| `performedBy` | Super Admin user ID |
| `ipAddress` | Client IP address |
| `userAgent` | Browser info |
| `metadata` | Before/after values |
| `createdAt` | Timestamp |

**View logs:**
```
GET /api/v1/super-admin/logs?page=1&limit=50&action=suspend_gym
```

---

## Dashboard Metrics

The Super Admin dashboard shows platform-wide aggregated data:

- Total gyms (by status: active, trial, suspended, expired)
- Total members across all gyms
- Monthly SaaS revenue
- New gyms in the last 7 / 30 days
- Gym growth chart (last 12 months)
- Feature usage statistics
- Plan distribution chart

---

## Database Models Used

| Model | File |
|-------|------|
| `User` | `user.model.ts` |
| `Gym` | `gym.model.ts` |
| `Subscription` | `subscription.model.ts` |
| `SuperAdminLog` | `superAdminLog.model.ts` |

---

## Relevant Files

### Backend
```
be/controllers/
    superAdmin.gym.controllers.ts         # Gym CRUD
    superAdmin.admin.controllers.ts       # Admin account management
    superAdmin.dashboard.controllers.ts   # Platform metrics
    superAdmin.impersonation.controllers.ts
    superAdmin.plan.controllers.ts        # SaaS plans
    superAdmin.profile.controllers.ts     # SA profile/password
    superAdmin.session.controllers.ts     # GET /me

be/middlewares/
    superAdminAuth.middleware.ts          # Auth guard (reads super_admin_token)
    featureFlag.middleware.ts             # checkGymFeature()

be/utils/
    superAdminLogger.ts                   # Audit logging helper
    createSuperAdmin.ts                   # CLI seeder (pass raw password — no pre-hashing)
    migrateSaaSFields.ts                  # One-time migration
```

### Frontend
```
fe/src/pages/superAdmin/
    SuperAdminLoginPage.tsx
    SuperAdminDashboard.tsx
    GymsListPage.tsx
    GymDetailsPage.tsx
    AdminsListPage.tsx
    PlansPage.tsx
    ContactsInboxPage.tsx
    SuperAdminAnnouncementsPage.tsx
    SuperAdminProfilePage.tsx

fe/src/components/layout/
    SuperAdminLayout.tsx                  # Sidebar + layout wrapper
    SuperAdminSidebar.tsx
    SuperAdminHeader.tsx
```
