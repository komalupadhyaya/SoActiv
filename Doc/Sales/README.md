# Sales Staff Documentation

## Overview

The **Sales** staff member is responsible for handling leads (enquiries), managing the CRM pipeline, and following up with potential customers. They have a focused portal — primarily the leads list, follow-up tasks, schedule view, and their own attendance. They cannot access members, staff management, or financial data.

> Sales logs in at: **`/staff/login`**
> Sales portal: **`/staff/`**

---

## Position

The Sales position in the database is: **`"sales"`**

In the system:
- `User.role = 'staff'`
- `Staff.position = 'sales'`

---

## Permissions

| Feature | Access Level |
|---------|-------------|
| **Dashboard** | ✅ Own task overview and lead reminders |
| **Enquiries / Leads** | ✅ View and update all leads for the gym |
| **Follow-Ups** | ✅ View own assigned tasks, update status |
| **Schedule** | ✅ View class timetable |
| **Own Attendance** | ✅ Mark own attendance |
| **Announcements** | ✅ View |
| **Members List** | ❌ No access |
| **Staff List** | ❌ No access |
| **PT Assignments** | ❌ No access via portal (PT can be assigned during conversion) |
| **Salary / Payments** | ❌ No access |

> **Note:** Sales can call `POST /api/v1/pt/assignments` to assign a PT package when converting a lead to a member, but they do not have access to the PT Assignments page in the staff portal.

---

## Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/staff/dashboard` | Overview stats and follow-up reminders |
| Enquiries / Leads | `/staff/enquiries` | CRM pipeline |
| Follow-Ups | `/staff/follow-ups` | Own assigned follow-up tasks |
| Schedule | `/staff/schedule` | Class timetable (view only) |
| Own Attendance | `/staff/attendance` | Own attendance records |
| Announcements | `/staff/announcements` | Gym announcements |
| Profile | `/staff/profile` | Own profile settings |

---

## CRM Pipeline (`/staff/enquiries`)

The **SalesLeads** page is the core workspace for the sales team. It displays all enquiries captured for the gym.

### Enquiry Status Flow
```
new → contacted → interested → converted → (becomes a paid member)
                                         ↘ lost
```

### What Sales Can Do on an Enquiry
- View lead details (name, phone, email, source, budget, interests)
- Update lead status
- Add comments/notes
- Set follow-up date
- Assign the lead to themselves or another staff member

### Enquiry Source Types
| Source | When Used |
|--------|----------|
| `website` | Online form submission |
| `social-media` | Instagram/Facebook DM or ad |
| `referral` | Word-of-mouth from existing member |
| `walk-in` | Came directly to the gym |
| `advertisement` | Offline ads (newspaper, banner, etc.) |
| `other` | Any other source |

---

## Follow-Up Tasks (`/staff/follow-ups`)

Sales staff see follow-up tasks assigned to them. These tasks may relate to:
- Following up with a lead (`type: 'enquiry'`)
- Following up with a member about expiring membership (`type: 'membership'`)
- Following up on an expiring PT package (`type: 'pt'`)

### Follow-Up Actions Available to Sales
- View assigned tasks
- Update status (pending → in-progress → completed/failed)
- Mark task as complete with notes
- Mark task as failed with reason
- Request to reschedule (Admin/Manager must approve)

### API Endpoints Used
```
GET /api/v1/follow-up/my-tasks                  # Own tasks
PUT /api/v1/follow-up/:id/status                # Update status
PUT /api/v1/follow-up/:id/complete-with-notes
PUT /api/v1/follow-up/:id/fail
PUT /api/v1/follow-up/:id/reschedule            # Request reschedule
```

---

## Lead Expiry Alert

Enquiries expire after `expiryDays` (default 14 days from creation). The Sales dashboard highlights leads expiring soon so Sales knows to prioritize them.

**Expiry fields on `Enquiry` model:**
```ts
expiryDays: number       // Default: 14
expiryDate: Date         // Calculated on creation
isExpired: boolean       // Auto-recalculated
remainingDays: number    // Days left
```

---

## PT Assignment by Sales

When converting an enquiry to a member, Sales may assign a PT package:

```
POST /api/v1/pt/assignments
Body: { memberId, planId, trainerId, startDate }
Auth: requirePosition(['admin', 'manager', 'sales'])
```

Sales can also view available plans for quoting to leads:
```
GET /api/v1/pt/plans
```

---

## What a Sales Staff Cannot Do

- ❌ Create, edit, or delete member profiles (admin-only)
- ❌ Access the member management portal
- ❌ View or manage other staff records
- ❌ Access salary or payment data
- ❌ Create or modify schedules
- ❌ Create announcements
- ❌ Delete follow-ups or enquiries

---

## Relevant Files

### Frontend
```
fe/src/pages/staff/
    SalesLeads.tsx             # Main sales CRM page
    StaffFollowUps.tsx         # Follow-up task management
    StaffDashboard.tsx         # Dashboard (shared across all staff)
    Attendance.tsx             # Own attendance
    Schedule.tsx               # Schedule view
    StaffAnnouncementsPage.tsx
```

### Backend
```
be/controllers/
    enquiry.controllers.ts     # Lead CRUD and status updates
    followUp.controllers.ts    # Follow-up task operations
    pt.controllers.ts          # assignPT() — sales can use this

be/routes/
    enquiry.routes.ts
    followUp.routes.ts
    pt.routes.ts
        POST /assignments      # requirePosition(['admin', 'manager', 'sales'])
```

### Hooks
```
fe/src/hooks/
    useEnquiry.tsx             # Enquiry CRUD and filtering
    useFollowUp.tsx            # Follow-up task management
```
