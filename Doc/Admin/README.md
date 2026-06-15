# Admin (Gym Owner) Documentation

## Overview

The **Admin** is the gym owner. They have full control over their specific gym — all members, staff, enquiries, PT assignments, class schedules, announcements, and reports. Admins cannot see or access data from other gyms.

> Admin logs in at: **`/login`** (email + password)
> Admin portal: **`/admin/`**

---

## Responsibilities

| Area | Actions |
|------|---------|
| **Dashboard** | View KPIs, revenue, member stats, follow-up alerts |
| **Members** | Full CRUD on member profiles, membership dates, PT assignments |
| **Enquiries** | Manage CRM leads, convert leads to members |
| **Follow-Ups** | Create, assign, approve/reject reschedule requests |
| **Staff** | Create/edit/delete staff accounts, set positions and salaries |
| **PT Plans** | Create, activate/deactivate personal training packages |
| **PT Assignments** | Assign PT packages to members + trainers |
| **Classes** | Create and manage gym class sessions and timetables |
| **Schedules** | Create gym schedules (holidays, events) |
| **Reports** | Revenue, attendance, membership analytics |
| **Announcements** | Publish notices visible to staff and/or members |
| **Exercise Library** | Manage the gym's exercise database |
| **Cleaning Checklist** | Manage facility cleaning tasks |
| **Attendance** | View staff and member attendance records |
| **Member Support Inbox** | View and respond to member support tickets |
| **Contact Support** | Submit support tickets to Super Admin |

---

## Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin/dashboard` | Business metrics overview |
| Enquiries | `/admin/enquiries` | CRM lead list |
| New Enquiry | `/admin/enquiry-form` | Create enquiry |
| Edit Enquiry | `/admin/enquiries/edit/:id` | Edit enquiry |
| Expiring Enquiries | `/admin/enquiries-expiring` | Leads about to expire |
| Members List | `/admin/clients` | All registered members |
| Add Member | `/admin/client-form` | Register new member |
| Edit Member | `/admin/client-form/:id` | Edit member profile |
| PT Expiring | `/admin/pt-expiring` | Members with expiring PT packages |
| Staff | `/admin/staff-page` | Employee management |
| Follow-Ups | `/admin/follow-ups` | Follow-up task list |
| New Follow-Up | `/admin/follow-ups/new` | Create follow-up |
| Calendar | `/admin/calendar` | Monthly calendar view |
| Schedule | `/admin/schedule` | Class timetable |
| Reports | `/admin/reports` | Business analytics |
| Profile | `/admin/profile` | Gym owner profile |
| Staff Attendance | `/admin/staff-attendance` | View all staff attendance |
| Client Attendance | `/admin/attendance` | View all member check-ins |
| PT Plans | `/admin/pt-plans` | Personal training packages |
| PT Assignments | `/admin/pt-assignments` | View/manage all PT subscriptions |
| Announcements | `/admin/announcements` | Create/manage announcements |
| Classes | `/admin/classes` | Manage gym classes |
| Exercise Library | `/admin/exercises` | Manage exercises |
| Cleaning Checklist | `/admin/cleaning` | Facility cleaning task management |
| Member Support Inbox | `/admin/member-support` | Read & respond to member tickets |
| Contact Support | `/admin/contact-support` | Send support ticket to Super Admin |

---

## Authentication

Admins use standard email/password login.

- **Endpoint:** `POST /api/v1/user/login`
- **Cookie:** `accessToken`
- **Role:** `admin`
- **adminId:** Admin's own User `_id` — used to scope all queries

---

## Member Management

### Key Fields on a Client Profile
```
fullName, email, contactNumber, gender, dateOfBirth, address
startDate, endDate, status (active/expired/pending)
plan (basic/premium), timing (morning/evening etc.)
packagePrice
hasPersonalTraining → personalTrainer, personalTrainingPrice, personalTrainingDurationWeeks
salesRep, memberManager, trainer (Staff references)
emergencyContactName, emergencyContactNumber
notifications: { sms, email, push, whatsapp }
```

### Membership Status Auto-Calculation
The `status` field is automatically calculated on save:
- `active` if `endDate > today`
- `expired` if `endDate <= today`
- `remainingDays` is computed on every save/update

### Bulk Import
Admins can bulk import members via CSV:
```
POST /api/v1/client/bulk-upload
Content-Type: multipart/form-data
file: members.csv
```

---

## Staff Management

### Staff Positions
```
manager | trainer | sales | receptionist | cleaner | maintenance
```

### What Admin Can Do
- Create staff accounts (a matching `User` + `Staff` record is created)
- Set position, salary, joining date
- Activate/deactivate staff
- View staff attendance reports
- Bulk import via CSV

---

## PT (Personal Training) System

### Flow
```
Admin creates PTPlan → Admin assigns plan to member + trainer →
Trainer logs sessions → Sessions consumed → Status becomes 'completed'
```

### PTPlan Fields
- `name`, `price`, `totalSessions`, `validityDays`
- `isActive` — only active plans can be assigned

### PTAssignment Fields
- `memberId` → member being trained
- `planId` → which plan package
- `trainerId` → assigned trainer (Staff)
- `startDate`, `expiryDate` (auto-calculated from validityDays)
- `totalSessions`, `usedSessions`
- `status`: `active | expired | completed | cancelled`
- `sessionLogs[]` — timestamped log of each completed session

> **Note:** Always use optional chaining when rendering PT assignment data — linked member/trainer/plan documents may have been deleted: `assignment.memberId?.fullName || 'Unknown Member'`

---

## Class Management

Admins can create and manage gym class sessions with the `ClassManagementPage`:
- Create class sessions with schedule, capacity, and instructor
- View enrolled members per session
- Track attendance for each class

---

## Enquiry & CRM System

### Enquiry Status Flow
```
new → contacted → interested → converted (becomes a member) | lost
```

### Enquiry Sources
`website | social-media | referral | walk-in | advertisement | other`

### Expiry
Enquiries expire after `expiryDays` (default: 14 days). The `/admin/enquiries-expiring` page shows leads nearing expiry.

---

## Follow-Up System

Follow-ups are tasks assigned to staff to contact leads or members.

### Follow-Up Lifecycle
```
Admin creates → Assigned to staff → Staff updates status →
Staff completes/fails/requests reschedule → Admin approves/rejects reschedule
```

### Follow-Up Types
- `enquiry` — following up on a lead
- `pt` — following up on expiring PT package
- `membership` — following up on expiring membership
- `general` / `other` — other tasks (including cleaning tasks for Cleaners)

---

## Member Support Inbox

Admins and Managers can view support tickets submitted by members via `/member/contact-support`. The inbox is at `/admin/member-support` (`AdminSupportInboxPage`).

---

## Reports & Analytics

The `/admin/reports` page includes:
- Monthly revenue breakdown
- New member registrations over time
- Membership status distribution (active/expired/pending)
- Attendance trend charts
- Staff performance metrics
- PT utilization statistics
- Source of leads (enquiry origins)

---

## Data Isolation

All Admin data is isolated by the admin's User `_id`. Every query uses:
```ts
const adminId = user.adminId || user.id;
// All queries: { userId: adminId } or { createdBy: adminId }
```

This ensures an admin can never see another gym's data.

---

## Database Models Owned

| Model | Scope |
|-------|-------|
| `Client` | `userId = adminId` |
| `Staff` | `createdBy = adminId` |
| `Enquiry` | `userId = adminId` |
| `FollowUp` | scoped to admin's gym |
| `PTPlan` | `adminId = adminId` |
| `PTAssignment` | `adminId = adminId` |
| `Schedule` | scoped to admin |
| `Announcement` | scoped to admin |
| `ClientAttendance` | scoped to admin |
| `StaffAttendance` | scoped to admin |
| `GymClass` | scoped to admin |
| `ClassBooking` | scoped to admin |

---

## Relevant Files

### Backend
```
be/controllers/
    client.controllers.ts
    client.bulk.controllers.ts
    staff.controllers.ts
    staff.bulk.controllers.ts
    enquiry.controllers.ts
    enquiry.bulk.controllers.ts
    enquiry.expiry.controllers.ts
    followUp.controllers.ts
    pt.controllers.ts
    pt.expiry.controllers.ts
    schedule.controllers.ts
    staffAttendance.controllers.ts
    clientAttendance.controllers.ts
    announcement.controllers.ts
    exercise.controllers.ts
    gymClass.controllers.ts
    classBooking.controllers.ts
    contact.controllers.ts
```

### Frontend
```
fe/src/pages/admin/
    DashboardPage.tsx
    ClientListPage.tsx
    ClientFormPage.tsx
    StaffManagerPage.tsx
    EnquiriesPage.tsx
    EnquiryFormPage.tsx
    EnquiriesExpiringPage.tsx
    FollowUpsPage.tsx
    FollowUpFormPage.tsx
    PTPlansPage.tsx
    PTAssignmentsPage.tsx
    PTExpiringPage.tsx
    ReportsPage.tsx
    CalendarPage.tsx
    AdminAnnouncementsPage.tsx
    AdminExerciseLibrary.tsx
    ClassManagementPage.tsx
    AdminCleaningPage.tsx
    staffAttendance.tsx
    AdminSupportInboxPage.tsx
    ContactSupportPage.tsx

fe/src/components/layout/
    AdminLayout.tsx
    Sidebar.tsx
    Header.tsx
```
