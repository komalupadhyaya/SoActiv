# Manager Documentation

## Overview

The **Manager** is a staff member with elevated oversight access. They can supervise staff members, view member lists, manage the CRM pipeline and follow-up tasks, oversee team attendance, manage PT assignments, handle member support tickets, manage the exercise library, and create new member profiles. They cannot access salary/payment data.

> Manager logs in at: **`/staff/login`**
> Manager portal: **`/staff/`**

---

## Position

The Manager's `position` field in the database is: **`"manager"`**

In the system:
- `User.role = 'staff'`
- `Staff.position = 'manager'`

---

## Permissions

| Feature | Access Level |
|---------|-------------|
| **Dashboard** | ✅ View metrics and tasks |
| **Members List** | ✅ View & create new members |
| **Staff List** | ✅ View (no create/edit/delete — admin-only) |
| **Enquiries / Leads** | ✅ Full CRM access (view, update, create) |
| **Follow-Ups** | ✅ Manage all tasks, approve/reject reschedule requests |
| **Schedule** | ✅ View only |
| **Team Attendance** | ✅ View & manage all staff attendance |
| **Own Attendance** | ✅ Mark own attendance |
| **PT Assignments** | ✅ View & manage PT assignment list |
| **Classes** | ✅ View/manage class schedule |
| **Member Support Inbox** | ✅ View and respond to member support tickets |
| **Announcements** | ✅ View |
| **Salary / Payments** | ❌ No access |
| **Create/Delete Staff** | ❌ No access (admin-only) |

---

## Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/staff/dashboard` | Overview stats and task reminders |
| Members List | `/staff/members` | View and create member profiles |
| Enquiries | `/staff/enquiries` | CRM lead pipeline |
| Follow-Ups | `/staff/follow-ups` | All follow-up tasks |
| Staff List | `/staff/staff-list` | View all staff (read-only) |
| Team Attendance | `/staff/team-attendance` | View/manage all staff punch-in records |
| Own Attendance | `/staff/attendance` | Own attendance record |
| PT Assignments | `/staff/pt-assignments` | View PT subscription list |
| Member Support | `/staff/member-support` | View member support tickets |
| Classes | `/staff/classes` | View/manage class schedule |
| Schedule | `/staff/schedule` | Class timetable |
| Announcements | `/staff/announcements` | Gym announcements |
| Profile | `/staff/profile` | Own profile |

---

## Route Access (Technical)

Routes available to managers use `requirePosition(['manager', ...])` middleware:

```ts
// Members — manager, receptionist, trainer can view
<ProtectedRoute allowedPositions={['manager', 'receptionist', 'trainer']}>

// Enquiries — manager, sales, receptionist can access
<ProtectedRoute allowedPositions={['manager', 'sales', 'receptionist']}>

// Staff List — manager only
<ProtectedRoute allowedPositions={['manager']}>

// Team Attendance — manager only
<ProtectedRoute allowedPositions={['manager']}>

// PT Assignments — manager only (in staff portal)
<ProtectedRoute allowedPositions={['manager']}>

// Member Support — manager only
<ProtectedRoute allowedPositions={['manager']}>

// Classes — manager only
<ProtectedRoute allowedPositions={['manager']}>
```

---

## Follow-Up Management

Managers can:
- View all follow-up tasks assigned to any staff
- Create follow-up notes
- Mark tasks as completed
- View upcoming follow-ups (next 7 days)
- Approve or reject reschedule requests from staff

**API Endpoints used:**
```
GET /api/v1/follow-up                         # All follow-ups
GET /api/v1/follow-up/upcoming                # This week's tasks
PUT /api/v1/follow-up/:id/approve-reschedule
PUT /api/v1/follow-up/:id/reject-reschedule
```

---

## Team Attendance

Managers can view and manage attendance records for all staff:
- View full attendance history per staff member
- Approve/flag attendance discrepancies

**API Endpoints used:**
```
GET /api/v1/staff-attendance         # All staff attendance records
PUT /api/v1/staff-attendance/:id     # Update attendance record
```

---

## CRM / Enquiries Access

Managers share the `/staff/enquiries` page with Sales and Receptionist staff. They can:
- View all leads and their current status
- Update lead status (new → contacted → interested → converted/lost)
- Add notes and comments
- Set follow-up dates
- Assign leads to sales staff

---

## Member Support Inbox

Managers can view and respond to support tickets submitted by members via `/member/contact-support`.

```
GET /api/v1/contact        # View all submitted tickets
```

---

## What a Manager Cannot Do

- ❌ Create, edit, or delete staff members (admin-only)
- ❌ Access salary or payment information
- ❌ Create or modify PT plans (admin-only)
- ❌ Access billing or subscription settings
- ❌ Create gym-wide announcements (admin-only)
- ❌ Delete follow-ups (admin-only)

---

## Relevant Files

### Frontend
```
fe/src/pages/staff/
    StaffDashboard.tsx         # Dashboard (shared with all staff)
    MembersList.tsx            # Members view
    StaffFollowUps.tsx         # Follow-up management
    SalesLeads.tsx             # CRM leads (shared with sales/receptionist)
    StaffManager.tsx           # Staff list (view-only for manager)
    StaffAttendance.tsx        # Team attendance management
    Attendance.tsx             # Own attendance
    Schedule.tsx               # Schedule view
    StaffAnnouncementsPage.tsx

fe/src/components/layout/
    StaffLayout.tsx            # Sidebar navigation for all staff roles
    StaffSidebar.tsx
    StaffTopbar.tsx
```

### Backend Middleware
```
be/middlewares/
    permission.middleware.ts   # requirePosition(['manager', ...])
    auth.middleware.ts         # Populates req.user.position = 'manager'
```
