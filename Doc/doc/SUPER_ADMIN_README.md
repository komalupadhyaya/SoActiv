# Super Admin Module - README

## Overview

The Super Admin module transforms SoActiv from a single-gym management system into a multi-tenant SaaS platform. Super Admins can manage multiple gyms, control feature access, and monitor platform-wide metrics.

## ✅ Completed Implementation

### Phase 1: Database & Models ✓
- **Extended Gym Model** (`gym.model.ts`)
  - Added `plan`: "free" | "pro" | "enterprise"
  - Added `status`: "trial" | "active" | "suspended" | "expired"
  - Added `trialEndsAt` date field
  - Added `features` object with 5 boolean flags
  - Added `deletedAt` for soft deletes
  - Added 5 indexes for performance

- **SuperAdminLog Model** (`superAdminLog.model.ts`)
  - 14 action types (create_gym, suspend_gym, etc.)
  - IP address and user agent tracking
  - Metadata storage for old/new values
  - Compound indexes for efficient queries

- **Subscription Model** (`subscription.model.ts`)
  - Billing cycle (monthly/yearly)
  - Payment gateway ready (Stripe/Razorpay fields)
  - Status tracking (active, past_due, canceled, trialing)

### Phase 2: Authentication & Security ✓
- **Super Admin Auth Middleware** (`superAdminAuth.middleware.ts`)
  - Strict role verification (role === "superadmin")
  - IP address logging
  - User agent capture
  - Separate from regular admin auth

- **Feature Flag Middleware** (`featureFlag.middleware.ts`)
  - Checks gym feature enablement
  - Blocks access if feature disabled
  - Handles suspended/expired gyms
  - Super Admins bypass checks

- **Audit Logger Utility** (`superAdminLogger.ts`)
  - Helper functions for logging actions
  - Context extraction from requests
  - Non-blocking logging (doesn't break requests)

### Phase 3-5: Backend APIs ✓

#### Gym Management Controller (`superAdmin.gym.controllers.ts`)
- `POST /api/v1/super-admin/gyms` - Create gym + owner + subscription
- `GET /api/v1/super-admin/gyms` - List with pagination & filters
- `GET /api/v1/super-admin/gyms/:id` - Gym details + stats
- `PATCH /api/v1/super-admin/gyms/:id` - Update gym
- `PATCH /api/v1/super-admin/gyms/:id/status` - Suspend/activate
- `PATCH /api/v1/super-admin/gyms/:id/features/:featureName` - Toggle features
- `PATCH /api/v1/super-admin/gyms/:id/extend-trial` - Extend trial period
- `DELETE /api/v1/super-admin/gyms/:id` - Soft delete

#### Admin Management Controller (`superAdmin.admin.controllers.ts`)
- `POST /api/v1/super-admin/admins` - Create gym owner
- `GET /api/v1/super-admin/admins` - List with pagination
- `PATCH /api/v1/super-admin/admins/:id` - Update admin
- `POST /api/v1/super-admin/admins/:id/reset-password` - Reset password
- `POST /api/v1/super-admin/admins/:id/force-logout` - Invalidate sessions

#### Dashboard Controller (`superAdmin.dashboard.controllers.ts`)
- `GET /api/v1/super-admin/dashboard/metrics` - Platform metrics
- `GET /api/v1/super-admin/dashboard/charts` - Growth charts
- `GET /api/v1/super-admin/logs` - Audit log viewer

#### Authentication Routes
- `POST /api/v1/super-admin/login` - Super Admin login
- `POST /api/v1/super-admin/logout` - Super Admin logout

**All routes registered in `index.ts`** ✓

### Migration & Setup Scripts ✓
- **`migrateSaaSFields.ts`** - Updates existing gyms with SaaS fields
- **`createSuperAdmin.ts`** - Interactive script to create first Super Admin

### Phase 6: Frontend (Partial) ✓
- **Super Admin Login Page** (`SuperAdminLoginPage.tsx`)
  - Gradient design with Shield icon
  - Email + password authentication
  - Error handling
  - Security notice
  - Token storage

## 🚧 Remaining Work

### Frontend Components Needed
1. **SuperAdminLayout.tsx** - Layout with sidebar
2. **SuperAdminDashboard.tsx** - Metrics & charts
3. **GymsListPage.tsx** - Paginated gym list
4. **GymDetailsPage.tsx** - Gym details + feature toggles
5. **AdminsListPage.tsx** - Admin management
6. **AuditLogsPage.tsx** - Log viewer
7. **App.tsx** - Add Super Admin routes

### Feature Flag Integration
Apply `checkGymFeature` middleware to:
- PT routes (`/api/v1/pt/*`)
- Staff attendance routes (`/api/v1/staff-attendance/*`)
- Future: Payment, class, member portal routes

### Testing
- [ ] Test Super Admin authentication
- [ ] Test gym CRUD operations
- [ ] Test feature flag enforcement
- [ ] Test audit logging
- [ ] Test role isolation

## 📖 Usage Guide

### 1. Run Migration (One-time)
```bash
cd be
bun run utils/migrateSaaSFields.ts
```

This will:
- Set all existing gyms to "pro" plan
- Set status to "active"
- Enable all features
- Create subscriptions

### 2. Create First Super Admin (One-time)
```bash
cd be
bun run utils/createSuperAdmin.ts
```

Follow the prompts to create your Super Admin account.

### 3. Login as Super Admin
Navigate to: `http://localhost:5173/super-admin/login`

Use the credentials you created in step 2.

### 4. Manage Gyms
Once logged in, you can:
- Create new gyms
- Assign gym owners
- Toggle features (payments, attendance, PT, classes, member portal)
- Suspend/activate gyms
- Extend trial periods
- View platform metrics

## 🔐 Security Features

1. **Strict Role Verification** - Only users with `role="superadmin"` can access
2. **IP Logging** - All actions logged with IP address
3. **Audit Trail** - Complete history of all Super Admin actions
4. **Soft Deletes** - Gyms are never hard-deleted
5. **Session Tracking** - Login/logout events logged

## 🎯 Feature Flags

Super Admins can enable/disable features per gym:

| Feature | Description |
|---------|-------------|
| `payments` | Payment gateway integration |
| `attendance` | Member check-in/out system |
| `pt` | Personal Training module |
| `classes` | Group class management |
| `memberPortal` | Member login and self-service |

When a feature is disabled:
- Related routes return 403 Forbidden
- UI elements should be hidden (frontend implementation needed)
- Gym admins see upgrade message

## 📊 Dashboard Metrics

The Super Admin dashboard shows:
- Total gyms (active, trial, suspended, expired)
- Total members across all gyms
- SaaS revenue (monthly)
- New gyms (7 days, 30 days)
- Gym growth chart (12 months)
- Feature usage statistics
- Trial to paid conversion rate
- Plan distribution

## 🔄 Subscription Management

Subscriptions are automatically created when:
- A new gym is created
- Existing gyms are migrated

Subscription fields:
- `plan`: free, pro, enterprise
- `status`: active, past_due, canceled, trialing
- `billingCycle`: monthly, yearly
- `amount`: Price in smallest currency unit
- `nextBillingDate`: When next payment is due

**Note:** Payment gateway integration (Stripe/Razorpay) is not yet implemented. The subscription model is ready for future integration.

## 🚀 Next Steps

1. **Complete Frontend** - Build remaining Super Admin UI pages
2. **Feature Flag Integration** - Apply middleware to protected routes
3. **Testing** - Comprehensive testing of all features
4. **Payment Integration** - Connect Stripe/Razorpay for billing
5. **Email Notifications** - Send alerts for trial expiry, payment due, etc.

## 📝 API Examples

### Create a Gym
```bash
POST /api/v1/super-admin/gyms
Content-Type: application/json
Cookie: accessToken=<super-admin-token>

{
  "name": "FitZone Gym",
  "address": "123 Main St, City",
  "phone": "+1234567890",
  "ownerEmail": "owner@fitzone.com",
  "ownerName": "John Doe",
  "ownerPassword": "SecurePass123",
  "plan": "pro",
  "status": "trial"
}
```

### Toggle Feature
```bash
PATCH /api/v1/super-admin/gyms/:id/features/payments
Content-Type: application/json
Cookie: accessToken=<super-admin-token>

{
  "enabled": false
}
```

### Get Audit Logs
```bash
GET /api/v1/super-admin/logs?page=1&limit=50&action=suspend_gym
Cookie: accessToken=<super-admin-token>
```

## 🐛 Known Limitations

1. **Force Logout** - Currently only logs the action. Full token invalidation requires Redis or token versioning.
2. **Payment Gateway** - Not integrated yet. Subscription amounts are set to 0.
3. **Email Notifications** - Not implemented. Trial expiry, payment due alerts needed.
4. **Frontend Incomplete** - Only login page created. Dashboard and management pages needed.

## 📚 Related Files

**Backend:**
- Models: `gym.model.ts`, `superAdminLog.model.ts`, `subscription.model.ts`
- Middleware: `superAdminAuth.middleware.ts`, `featureFlag.middleware.ts`
- Controllers: `superAdmin.gym.controllers.ts`, `superAdmin.admin.controllers.ts`, `superAdmin.dashboard.controllers.ts`
- Routes: `superAdmin.routes.ts`
- Utils: `superAdminLogger.ts`, `migrateSaaSFields.ts`, `createSuperAdmin.ts`

**Frontend:**
- Pages: `SuperAdminLoginPage.tsx` (more to be created)

---

**Built with ❤️ for SoActiv SaaS Platform**
