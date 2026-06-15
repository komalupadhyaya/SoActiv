# Cleaner Staff Documentation

## Overview

The **Cleaner** is a staff member responsible for the maintenance, hygiene, and cleanliness of the gym facility. They have a highly restricted portal that only allows them to view their assigned cleaning tasks (via the Follow-Ups system), mark tasks as completed, log their own attendance, and view gym announcements. They do not have access to any member lists, staff directories, sales CRM systems, or financial records.

> Cleaner logs in at: **`/staff/login`**
> Cleaner portal: **`/staff/`**

---

## Position

The Cleaner's position in the database is: **`"cleaner"`**

In the system:
- `User.role = 'staff'`
- `Staff.position = 'cleaner'`

---

## Permissions

| Feature | Access Level | Description |
|---------|-------------|-------------|
| **Dashboard** | ✅ Own stats and assigned tasks | Task counts, punch-in/out status, and announcements |
| **Cleaning Tasks** | ✅ View & complete own tasks | View assigned facility tasks, log completion, mark failed, request reschedule |
| **Own Attendance** | ✅ Mark own attendance | Punch in and out to record working hours |
| **Announcements** | ✅ View | General gym notices posted by Admin or Manager |
| **Profile** | ✅ Edit own profile | Update personal details, avatar, password |
| **Members List** | ❌ No access | Cannot view or search the gym member database |
| **Staff Directory** | ❌ No access | Cannot view other staff members |
| **Sales Leads (CRM)** | ❌ No access | Cannot view enquiries or sales pipelines |
| **Finance & Payments** | ❌ No access | Cannot view salaries, invoices, or revenue reports |
| **Schedule Calendar** | ❌ No access | Cannot access the gym schedule or calendar page |
| **Class Booking** | ❌ No access | |
| **PT System** | ❌ No access | |

---

## Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/staff/dashboard` | Pending task count, today's check-in status, recent announcements |
| My Tasks | `/staff/follow-ups` | Assigned facility cleaning tasks board |
| Own Attendance | `/staff/attendance` | Log and review punch-in/out times |
| Announcements | `/staff/announcements` | General announcements board |
| Profile | `/staff/profile` | Manage login credentials and personal info |

---

## Cleaning Tasks Workflow (`/staff/follow-ups`)

Cleaning tasks are created by the **Admin** or **Manager** and assigned directly to the Cleaner. The Cleaner manages them through the **My Follow-Ups** view.

### Task Flow
```
Task Created (Admin/Manager assigns a FollowUp with type='other')
    ↓
Task appears on Cleaner's Dashboard and Tasks Page
    ↓
Cleaner performs the work
    ↓
Cleaner clicks "Complete" or "Mark Failed"
    ↓
Enters optional notes (e.g. "Towels refilled, floors mopped")
    ↓
Task marked 'completed' / 'failed'
```

### Task Retrieval
The backend fetches Cleaner-specific tasks by querying `FollowUp` where `assignedTo` matches the Cleaner's staff ID:
```
GET /api/v1/follow-up/my-tasks?status=pending
```

> **Note:** The receptionist dashboard's **Upcoming Tasks / Follow-ups** section is filtered to exclude cleaning tasks (`type = 'other'`) so they don't clutter the front-desk view.

### Task Completion
```
PUT /api/v1/follow-up/:id/complete-with-notes
Body: { completionNotes: "Cleaned cardio zone" }
```

### Task Failure
```
PUT /api/v1/follow-up/:id/fail
Body: { failureReason: "Equipment not available" }
```

### Reschedule Request
Cleaners can request a reschedule which must be approved by Admin or Manager:
```
PUT /api/v1/follow-up/:id/reschedule
Body: { proposedDate: "2026-06-20" }
```

---

## Dashboard Widget

On the shared Staff Dashboard, cleaners see:
- Count of pending cleaning tasks
- Today's punch-in/out status
- Recent announcements
- Quick links to their task list and attendance

---

## Data Isolation for Cleaners

Cleaners are isolated from sensitive member and staff information:

1. **Member Data:** The route `/staff/members` is restricted in the frontend. The backend also scopes client queries to the gym admin — cleaners get empty results from any direct API calls.

2. **Staff Data:** The backend utility `getVisibleStaff` restricts cleaners to only see their own staff record:
   ```ts
   // Only trainer/sales/cleaner see themselves
   staffList = await Staff.find({
       userId,
       status: 'active',
   }).select('_id');
   ```

3. **Task Type Isolation:** Facility cleaning tasks use `type: 'other'` in the `FollowUp` model and are not linked to any `clientId` or `enquiryId`, keeping them completely separate from member records.

---

## Relevant Files

### Frontend
```
fe/src/pages/staff/
    StaffFollowUps.tsx         # List of assigned cleaning tasks, complete/fail actions
    StaffDashboard.tsx         # Dashboard containing task counts, check-in widgets
    Attendance.tsx             # Punch in/out component
    StaffAnnouncementsPage.tsx # View news and bulletins
    ProfileEdit.tsx            # Edit avatar and contact info
```

### Backend
```
be/controllers/
    followUp.controllers.ts    # Get and complete tasks (getMyTasks, completeWithNotes, fail)
    staff.controllers.ts       # Profile updates and self staff retrieval

be/routes/
    followUp.routes.ts         # requirePosition(['admin', 'manager', 'sales', 'cleaner'])
    staff.routes.ts            # Staff profile endpoints
```

### Hooks & Contexts
```
fe/src/hooks/
    useFollowUp.tsx            # API hooks for my-tasks retrieval and completion
```
