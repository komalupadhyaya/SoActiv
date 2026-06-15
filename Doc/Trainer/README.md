# Trainer Documentation

## Overview

The **Trainer** is a staff member focused on personal training clients. They can view and interact with their assigned PT clients, log completed sessions, prescribe diet and nutrition plans, manage class sessions, and view the schedule. They are restricted to their own client data and cannot access global member lists or other staff records.

> Trainer logs in at: **`/staff/login`**
> Trainer portal: **`/staff/`**

---

## Position

The Trainer's position in the database is: **`"trainer"`**

In the system:
- `User.role = 'staff'`
- `Staff.position = 'trainer'`

---

## Permissions

| Feature | Access Level |
|---------|-------------|
| **Dashboard** | ✅ View own stats and tasks |
| **My PT Clients** | ✅ View & manage own PT assignments |
| **Log PT Sessions** | ✅ Log completed sessions for own clients |
| **Client Nutrition** | ✅ Prescribe/view diet plans for own clients |
| **My Members** | ✅ View members assigned to them |
| **My Classes** | ✅ View and manage own class sessions |
| **Schedule** | ✅ View class timetable |
| **Own Attendance** | ✅ Mark own punch-in/punch-out |
| **Announcements** | ✅ View |
| **Follow-Ups** | Mark complete/failed, request reschedule, update notes |
| **Global Members List** | ❌ Cannot access unassigned members |
| **Staff List** | ❌ No access |
| **Salary / Payments** | ❌ No access |

---

## Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/staff/dashboard` | Overview and stats |
| My PT Clients | `/staff/pt-clients` | Active PT assignments for trainer |
| Client Nutrition | `/staff/client-nutrition` | Manage diet plans for clients |
| My Members | `/staff/my-clients` | Members assigned to this trainer |
| My Classes | `/staff/my-classes` | Trainer's own class sessions |
| Schedule | `/staff/schedule` | View class timetable |
| Own Attendance | `/staff/attendance` | Own attendance records |
| Announcements | `/staff/announcements` | Gym announcements |
| Profile | `/staff/profile` | Own profile settings |

---

## PT Clients Page (`/staff/pt-clients`)

This is the trainer's primary workspace. It shows all active PT assignments where `trainerId` equals the current trainer's staff ID.

**Each PT card shows:**
- Client name and plan name
- Session progress bar (used / total)
- Expiry date
- "Log Completed Session" button (only enabled when status = `active`)
- Last session date and notes

**Session Logging:**
```
Trainer clicks "Log Completed Session"
    ↓
Modal opens: Select date, add optional notes
    ↓
POST /api/v1/pt/assignments/:id/session
Body: { date, notes }
    ↓
Backend checks:
  • assignment.trainerId === req.user.staffId (ownership)
  • assignment.status === 'active'
  • usedSessions < totalSessions
  • expiryDate > today
    ↓
Increments usedSessions, pushes to sessionLogs[]
If sessions exhausted → status = 'completed'
```

### Defensive Rendering (Important)

When rendering PT client cards, always use optional chaining on populated references because a client or plan document might have been deleted from the database:

```tsx
// ✅ Correct — safe, won't crash:
{assignment.memberId?.fullName || 'Unknown Member'}
{assignment.planId?.name || 'Unknown Plan'}

// ❌ Wrong — crashes if reference is null:
{assignment.memberId.fullName}
```

This fix is applied in `TrainerPTClientsPage.tsx` and `PTAssignmentsPage.tsx`.

---

## Client Nutrition (`/staff/client-nutrition`)

Trainers create and manage diet plans for their assigned clients.

**Diet Plan Fields:**
- `clientId` — the member this plan is for
- `title` — plan name
- `meals[]` — array of meals with `name`, `time`, `foods[]`
  - Each food: `name`, `quantity`, `unit`, `calories`, `protein`, `carbs`, `fat`
- `totalCalories`, `totalProtein`, `totalCarbs`, `totalFat`
- `notes` — additional instructions
- `startDate`, `endDate`

**API Endpoints:**
```
GET    /api/v1/diet-plans           # Get plans (filtered to trainer's clients)
POST   /api/v1/diet-plans           # Create new plan
PUT    /api/v1/diet-plans/:id       # Update plan
DELETE /api/v1/diet-plans/:id       # Delete plan
```

---

## My Classes (`/staff/my-classes`)

Trainers can view and manage the class sessions they are assigned to instruct. The `TrainerClassesPage` shows upcoming and past sessions, enrollment counts, and allows marking attendance for participants.

---

## My Members (`/staff/my-clients`)

Shows members whose `trainer` field references this trainer's Staff ID. This is a simplified view — trainers can see basic info and contact details but cannot edit member profiles.

---

## Session Log Data Structure

Each completed session logged by the trainer is stored in `PTAssignment.sessionLogs[]`:

```ts
sessionLogs: [{
  date: Date,              // When the session was held
  notes?: string,          // Optional trainer notes
  loggedBy: ObjectId       // Trainer's staffId
}]
```

---

## Data Isolation for Trainers

When a trainer hits `GET /api/v1/pt/assignments`, the backend automatically filters:

```ts
if (user.role === 'staff' && user.position === 'trainer') {
    query.trainerId = user.staffId;  // Only see own assignments
}
```

Trainers cannot bypass this to see other trainers' clients.

---

## Relevant Files

### Frontend
```
fe/src/pages/staff/
    TrainerPTClientsPage.tsx       # Main trainer workspace — PT client cards
    TrainerMembers.tsx             # Trainer's assigned general members
    TrainerNutrition.tsx           # Diet plan management for clients
    TrainerClassesPage.tsx         # Trainer's class session management
    StaffDashboard.tsx             # Shared dashboard

fe/src/components/pt/
    SessionLogModal.tsx            # Modal for logging a completed PT session
    PTPlanFormModal.tsx            # PT plan creation modal
    PTAssignModal.tsx              # Assign PT to member
```

### Backend
```
be/controllers/
    pt.controllers.ts
        getPTAssignments()         # Scoped to trainerId for trainers
        logPTSession()             # Validates trainer ownership before logging

    pt.expiry.controllers.ts
        getExpiringPTByTrainer()   # Expiring PT grouped by trainer

    dietPlan.controllers.ts        # Diet plan CRUD

    gymClass.controllers.ts        # Class session management

be/routes/pt.routes.ts
    POST /assignments/:id/session  # requirePosition(['admin', 'manager', 'trainer'])
```

### Hooks
```
fe/src/hooks/
    usePT.tsx                      # fetchAssignments, logSession
    useDietPlan.tsx                # Diet plan CRUD
```
