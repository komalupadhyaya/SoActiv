# API Reference

All API endpoints are prefixed with `/api/v1`. Authentication is via HTTP-only cookies.

> **Base URL:** `http://localhost:8000/api/v1`

---

## 🔐 Authentication (`/user`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/user/register` | Register new gym (owner account) | ❌ |
| POST | `/user/login` | Login as admin/member | ❌ |
| POST | `/user/logout` | Logout current session | ✅ |
| GET | `/user/getCurrentUser` | Get logged-in user profile | ✅ |
| POST | `/user/google-signin` | Login via Google/Firebase | ❌ |
| PUT | `/user/update-profile` | Update profile info | ✅ |
| POST | `/user/change-password` | Change password | ✅ |

---

## 👥 Clients (`/client`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/client` | Get all clients (filterable) | ✅ Admin/Staff |
| POST | `/client` | Create new client | ✅ Admin/Staff |
| GET | `/client/:id` | Get single client | ✅ |
| PUT | `/client/:id` | Update client | ✅ |
| DELETE | `/client/:id` | Delete client | ✅ |
| POST | `/client/bulk-upload` | CSV bulk import | ✅ Admin/Manager |
| GET | `/client/pt-expiring` | Clients with expiring PT | ✅ |
| GET | `/client/pt-expiring/by-trainer` | PT expiring grouped by trainer | ✅ Admin |
| GET | `/client/:id/pt-status` | PT status for one client | ✅ |

---

## 👨‍💼 Staff (`/staff`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/staff` | Get all staff members | ✅ Admin |
| POST | `/staff` | Create new staff member | ✅ Admin |
| GET | `/staff/:id` | Get staff member by ID | ✅ |
| PUT | `/staff/:id` | Update staff member | ✅ Admin |
| DELETE | `/staff/:id` | Delete staff member | ✅ Admin |
| POST | `/staff/bulk-upload` | CSV bulk import of staff | ✅ Admin |
| GET | `/staff/me` | Get own staff profile | ✅ Staff |

---

## 📋 Enquiries (`/enquiry`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/enquiry` | Get all enquiries | ✅ |
| POST | `/enquiry` | Create enquiry | ✅ |
| GET | `/enquiry/:id` | Get single enquiry | ✅ |
| PUT | `/enquiry/:id` | Update enquiry | ✅ |
| DELETE | `/enquiry/:id` | Delete enquiry | ✅ Admin |
| POST | `/enquiry/bulk-upload` | CSV bulk import | ✅ |
| GET | `/enquiry/expiring` | Get expiring enquiries | ✅ |

---

## 📞 Follow-Ups (`/follow-up`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/follow-up` | Get all follow-ups | ✅ |
| POST | `/follow-up` | Create follow-up | ✅ Admin/Manager |
| GET | `/follow-up/my-tasks` | Get my assigned follow-ups | ✅ Staff |
| GET | `/follow-up/upcoming` | Upcoming follow-ups (7 days) | ✅ |
| PUT | `/follow-up/:id` | Update follow-up | ✅ |
| PUT | `/follow-up/:id/status` | Update status | ✅ Staff |
| PUT | `/follow-up/:id/complete` | Mark completed | ✅ |
| PUT | `/follow-up/:id/complete-with-notes` | Complete with notes | ✅ Staff |
| PUT | `/follow-up/:id/fail` | Mark as failed | ✅ Staff |
| PUT | `/follow-up/:id/reschedule` | Request reschedule | ✅ Staff |
| PUT | `/follow-up/:id/approve-reschedule` | Approve reschedule | ✅ Admin |
| PUT | `/follow-up/:id/reject-reschedule` | Reject reschedule | ✅ Admin |
| DELETE | `/follow-up/:id` | Delete follow-up | ✅ Admin |

---

## 🏋️ Personal Training (`/pt`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/pt/plans` | Get all PT plans | ✅ Admin/Manager/Sales |
| POST | `/pt/plans` | Create PT plan | ✅ Admin |
| PUT | `/pt/plans/:id` | Update PT plan | ✅ Admin |
| PATCH | `/pt/plans/:id/status` | Toggle plan active/inactive | ✅ Admin |
| GET | `/pt/assignments` | Get assignments (scoped by role) | ✅ |
| POST | `/pt/assignments` | Assign PT to member | ✅ Admin/Manager/Sales |
| POST | `/pt/assignments/:id/session` | Log completed session | ✅ Trainer/Admin |
| POST | `/pt/expiry-check` | Trigger expiry status update | ✅ Admin/Manager |

---

## 📅 Schedule (`/schedule`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/schedule` | Get all schedules | ✅ |
| POST | `/schedule` | Create schedule | ✅ Admin/Manager |
| GET | `/schedule/:id` | Get single schedule | ✅ |
| PUT | `/schedule/:id` | Update schedule | ✅ Admin/Manager |
| DELETE | `/schedule/:id` | Delete schedule | ✅ Admin/Manager |

---

## 📊 Staff Attendance (`/staff-attendance`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/staff-attendance` | Get attendance records | ✅ |
| POST | `/staff-attendance` | Log attendance | ✅ |
| GET | `/staff-attendance/my` | My own attendance | ✅ Staff |
| PUT | `/staff-attendance/:id` | Update attendance | ✅ Manager/Admin |

---

## 🔔 Attendance (`/client-attendance`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/client-attendance` | Get all check-ins | ✅ |
| POST | `/client-attendance/check-in` | Member check-in | ✅ |
| POST | `/client-attendance/check-out` | Member check-out | ✅ |
| GET | `/client-attendance/member/:memberId` | Member's attendance history | ✅ |

---

## 🥗 Diet Plans (`/diet-plans`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/diet-plans` | Get all diet plans | ✅ |
| POST | `/diet-plans` | Create diet plan | ✅ Trainer |
| GET | `/diet-plans/:id` | Get single plan | ✅ |
| PUT | `/diet-plans/:id` | Update plan | ✅ Trainer |
| DELETE | `/diet-plans/:id` | Delete plan | ✅ |

---

## 💪 Exercises (`/exercises`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/exercises` | Get exercise library | ✅ |
| POST | `/exercises` | Add exercise | ✅ Admin/Trainer |
| PUT | `/exercises/:id` | Update exercise | ✅ |
| DELETE | `/exercises/:id` | Delete exercise | ✅ |

---

## 🎯 Fitness Goals (`/fitness-goals`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/fitness-goals` | Get goals | ✅ |
| POST | `/fitness-goals` | Create goal | ✅ |
| PUT | `/fitness-goals/:id` | Update goal | ✅ |
| DELETE | `/fitness-goals/:id` | Delete goal | ✅ |

---

## 📷 Progress Photos (`/progress-photos`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/progress-photos` | Get all photos | ✅ |
| POST | `/progress-photos` | Upload photo | ✅ |
| DELETE | `/progress-photos/:id` | Delete photo | ✅ |

---

## 📢 Announcements (`/announcements`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/announcements` | Get all announcements | ✅ |
| POST | `/announcements` | Create announcement | ✅ Admin |
| PUT | `/announcements/:id` | Update announcement | ✅ Admin |
| DELETE | `/announcements/:id` | Delete announcement | ✅ Admin |

---

## 🔔 Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| GET | `/notifications` | Get my notifications | ✅ |
| PUT | `/notifications/:id/read` | Mark as read | ✅ |
| DELETE | `/notifications/:id` | Delete notification | ✅ |

---

## 🛡️ Super Admin (`/super-admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| POST | `/super-admin/auth/login` | Super Admin login | ❌ |
| POST | `/super-admin/auth/logout` | Super Admin logout | ✅ SA |
| GET | `/super-admin/me` | Get Super Admin profile | ✅ SA |
| PATCH | `/super-admin/profile` | Update profile | ✅ SA |
| POST | `/super-admin/change-password` | Change password | ✅ SA |
| GET | `/super-admin/dashboard/metrics` | Platform-wide metrics | ✅ SA |
| GET | `/super-admin/dashboard/charts` | Growth charts | ✅ SA |
| GET | `/super-admin/gyms` | List all gyms | ✅ SA |
| POST | `/super-admin/gyms` | Create new gym | ✅ SA |
| GET | `/super-admin/gyms/:id` | Gym details + stats | ✅ SA |
| PATCH | `/super-admin/gyms/:id` | Update gym info | ✅ SA |
| PATCH | `/super-admin/gyms/:id/status` | Suspend/activate gym | ✅ SA |
| PATCH | `/super-admin/gyms/:id/features/:name` | Toggle feature flag | ✅ SA |
| PATCH | `/super-admin/gyms/:id/extend-trial` | Extend trial period | ✅ SA |
| DELETE | `/super-admin/gyms/:id` | Soft delete gym | ✅ SA |
| GET | `/super-admin/admins` | List all gym admins | ✅ SA |
| POST | `/super-admin/admins` | Create gym admin | ✅ SA |
| PATCH | `/super-admin/admins/:id` | Update gym admin | ✅ SA |
| POST | `/super-admin/admins/:id/reset-password` | Reset admin password | ✅ SA |
| POST | `/super-admin/admins/:id/force-logout` | Force logout admin | ✅ SA |
| POST | `/super-admin/impersonate/:adminId` | Impersonate admin | ✅ SA |
| GET | `/super-admin/plans` | List SaaS plans | Public |
| POST | `/super-admin/plans` | Create SaaS plan | ✅ SA |
| PATCH | `/super-admin/plans/:id` | Update SaaS plan | ✅ SA |
| DELETE | `/super-admin/plans/:id` | Delete SaaS plan | ✅ SA |
| GET | `/super-admin/logs` | Audit logs | ✅ SA |
