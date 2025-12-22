# Super Admin Module - Testing Guide

## Overview
This document provides test cases for the Super Admin SaaS module. Tests cover authentication, gym management, admin management, feature flags, and audit logging.

## Test Environment Setup

```bash
# Install test dependencies (if not already installed)
cd be
bun add -D @types/jest jest supertest

# Create test database
# Use a separate test database: soActive_test
```

## Test Categories

### 1. Authentication Tests

**Test: Super Admin Login - Success**
```
POST /api/v1/super-admin/login
Body: { email: "superadmin@test.com", password: "password123" }
Expected: 200, token returned, audit log created
```

**Test: Super Admin Login - Invalid Credentials**
```
POST /api/v1/super-admin/login
Body: { email: "superadmin@test.com", password: "wrong" }
Expected: 401 Unauthorized
```

**Test: Regular Admin Cannot Access Super Admin Routes**
```
POST /api/v1/super-admin/gyms (with admin token)
Expected: 403 Forbidden
```

**Test: Super Admin Logout**
```
POST /api/v1/super-admin/logout
Expected: 200, cookie cleared, audit log created
```

---

### 2. Gym Management Tests

**Test: Create Gym**
```
POST /api/v1/super-admin/gyms
Body: {
  name: "Test Gym",
  ownerEmail: "owner@test.com",
  ownerName: "John Doe",
  ownerPassword: "password123",
  plan: "pro",
  status: "trial"
}
Expected: 201, gym created, owner created, subscription created, audit log
```

**Test: List Gyms with Pagination**
```
GET /api/v1/super-admin/gyms?page=1&limit=20
Expected: 200, paginated list, member counts included
```

**Test: Get Gym Details**
```
GET /api/v1/super-admin/gyms/:id
Expected: 200, gym info, stats (members, staff), subscription
```

**Test: Update Gym**
```
PATCH /api/v1/super-admin/gyms/:id
Body: { name: "Updated Gym Name" }
Expected: 200, gym updated, audit log created
```

**Test: Suspend Gym**
```
PATCH /api/v1/super-admin/gyms/:id/status
Body: { status: "suspended" }
Expected: 200, status changed, audit log created
```

**Test: Toggle Feature - Disable Payments**
```
PATCH /api/v1/super-admin/gyms/:id/features/payments
Body: { enabled: false }
Expected: 200, feature disabled, audit log created
```

**Test: Soft Delete Gym**
```
DELETE /api/v1/super-admin/gyms/:id
Expected: 200, deletedAt set, audit log created
```

---

### 3. Admin Management Tests

**Test: Create Admin**
```
POST /api/v1/super-admin/admins
Body: {
  fullname: "Admin User",
  email: "admin@test.com",
  password: "password123",
  gymId: "gym_id_here"
}
Expected: 201, admin created, audit log
```

**Test: List Admins**
```
GET /api/v1/super-admin/admins?page=1&limit=20
Expected: 200, paginated list with gym info
```

**Test: Reset Admin Password**
```
POST /api/v1/super-admin/admins/:id/reset-password
Body: { newPassword: "newpass123" }
Expected: 200, password updated, audit log
```

**Test: Force Logout Admin**
```
POST /api/v1/super-admin/admins/:id/force-logout
Expected: 200, audit log created
```

---

### 4. Feature Flag Tests

**Test: PT Routes Blocked When Feature Disabled**
```
1. Disable PT feature for gym
2. Login as gym admin
3. Try to access PT routes
Expected: 403 Forbidden with message about feature not enabled
```

**Test: Attendance Routes Blocked When Feature Disabled**
```
1. Disable attendance feature for gym
2. Login as gym staff
3. Try to mark attendance
Expected: 403 Forbidden
```

**Test: Super Admin Bypasses Feature Checks**
```
1. Disable all features for a gym
2. Login as Super Admin
3. Access any route
Expected: 200 (Super Admin bypasses checks)
```

**Test: Suspended Gym Cannot Access Any Routes**
```
1. Suspend gym
2. Login as gym admin
3. Try to access any route
Expected: 403 Forbidden with suspension message
```

---

### 5. Dashboard & Metrics Tests

**Test: Get Dashboard Metrics**
```
GET /api/v1/super-admin/dashboard/metrics
Expected: 200, metrics object with:
  - Total gyms (by status)
  - Total members
  - Revenue
  - Growth stats
```

**Test: Get Dashboard Charts**
```
GET /api/v1/super-admin/dashboard/charts
Expected: 200, chart data:
  - Gym growth (12 months)
  - Feature usage
  - Trial conversion rate
  - Plan distribution
```

---

### 6. Audit Log Tests

**Test: All Actions Are Logged**
```
1. Perform various Super Admin actions
2. Query audit logs
Expected: All actions present with correct metadata
```

**Test: Audit Logs Include IP Address**
```
1. Login from specific IP
2. Check audit log
Expected: IP address captured
```

**Test: Filter Audit Logs by Action**
```
GET /api/v1/super-admin/logs?action=suspend_gym
Expected: Only suspend_gym actions returned
```

**Test: Filter Audit Logs by Date Range**
```
GET /api/v1/super-admin/logs?startDate=2024-01-01&endDate=2024-12-31
Expected: Logs within date range
```

---

## Manual Testing Checklist

### Setup
- [ ] Run migration script: `bun run utils/migrateSaaSFields.ts`
- [ ] Create Super Admin: `bun run utils/createSuperAdmin.ts`
- [ ] Start backend: `bun run dev`
- [ ] Start frontend: `cd fe && bun run dev`

### Authentication Flow
- [ ] Login as Super Admin at `/super-admin/login`
- [ ] Verify redirect to dashboard
- [ ] Verify sidebar navigation works
- [ ] Logout and verify redirect to login

### Gym Management
- [ ] Create new gym from dashboard
- [ ] View gyms list with pagination
- [ ] Search gyms by name
- [ ] Filter gyms by status
- [ ] Click gym to view details
- [ ] Toggle each feature (payments, attendance, PT, classes, member portal)
- [ ] Change gym status (active, trial, suspended, expired)
- [ ] Verify stats update correctly

### Feature Flag Enforcement
- [ ] Disable PT feature for a gym
- [ ] Login as that gym's admin
- [ ] Try to access PT routes
- [ ] Verify 403 error with feature message
- [ ] Re-enable PT feature
- [ ] Verify access restored

### Audit Logging
- [ ] Perform various actions
- [ ] View audit logs page (when implemented)
- [ ] Verify all actions logged
- [ ] Verify IP addresses captured

---

## Integration Test Example

```typescript
// Example test file: superAdmin.test.ts
import request from 'supertest';
import app from '../index';

describe('Super Admin Module', () => {
  let superAdminToken: string;
  let gymId: string;

  beforeAll(async () => {
    // Login as Super Admin
    const response = await request(app)
      .post('/api/v1/super-admin/login')
      .send({
        email: 'superadmin@test.com',
        password: 'password123'
      });
    
    superAdminToken = response.body.data.token;
  });

  describe('Gym Management', () => {
    it('should create a new gym', async () => {
      const response = await request(app)
        .post('/api/v1/super-admin/gyms')
        .set('Cookie', `accessToken=${superAdminToken}`)
        .send({
          name: 'Test Gym',
          ownerEmail: 'owner@test.com',
          ownerName: 'John Doe',
          ownerPassword: 'password123',
          plan: 'pro',
          status: 'trial'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.gym.name).toBe('Test Gym');
      
      gymId = response.body.data.gym._id;
    });

    it('should toggle gym feature', async () => {
      const response = await request(app)
        .patch(`/api/v1/super-admin/gyms/${gymId}/features/payments`)
        .set('Cookie', `accessToken=${superAdminToken}`)
        .send({ enabled: false });

      expect(response.status).toBe(200);
      expect(response.body.data.features.payments).toBe(false);
    });
  });

  describe('Feature Flags', () => {
    it('should block PT routes when feature disabled', async () => {
      // Disable PT feature
      await request(app)
        .patch(`/api/v1/super-admin/gyms/${gymId}/features/pt`)
        .set('Cookie', `accessToken=${superAdminToken}`)
        .send({ enabled: false });

      // Try to access PT route as gym admin
      const response = await request(app)
        .get('/api/v1/pt/plans')
        .set('Cookie', `accessToken=${gymAdminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('feature not enabled');
    });
  });
});
```

---

## Performance Tests

### Load Testing
- [ ] Test with 100+ gyms
- [ ] Test pagination performance
- [ ] Test dashboard metrics with large dataset
- [ ] Test audit log queries with 10,000+ entries

### Stress Testing
- [ ] Concurrent Super Admin logins
- [ ] Rapid feature toggles
- [ ] Bulk gym creation

---

## Security Tests

- [ ] Verify JWT expiration
- [ ] Verify role isolation (admin cannot access super-admin routes)
- [ ] Verify CSRF protection (if implemented)
- [ ] Verify SQL injection prevention
- [ ] Verify XSS prevention
- [ ] Verify rate limiting (if implemented)

---

## Edge Cases

- [ ] Create gym with duplicate owner email
- [ ] Toggle feature for non-existent gym
- [ ] Access deleted gym
- [ ] Extend trial for gym with no trial end date
- [ ] Reset password with weak password
- [ ] Filter logs with invalid date range

---

## Regression Tests

After any changes to the Super Admin module:
- [ ] Run all authentication tests
- [ ] Run all gym management tests
- [ ] Run all feature flag tests
- [ ] Verify audit logging still works
- [ ] Verify no breaking changes to existing gym functionality

---

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** All critical paths covered
- **E2E Tests:** Main user flows covered
- **Manual Tests:** All UI interactions verified

---

## Known Issues / Limitations

1. **Force Logout:** Currently only logs the action. Full token invalidation requires Redis or token versioning.
2. **Payment Gateway:** Not integrated yet. Subscription amounts are set to 0.
3. **Email Notifications:** Not implemented. Trial expiry, payment due alerts needed.

---

## Next Steps

1. Implement automated test suite using Jest + Supertest
2. Add E2E tests using Playwright or Cypress
3. Set up CI/CD pipeline to run tests on every commit
4. Add test coverage reporting
5. Implement remaining features (admin management page, audit logs page)
