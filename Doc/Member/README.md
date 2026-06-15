# Member (Client) Documentation

## Overview

A **Member** is a gym client with a registered account. They access the **Member Portal** — a self-service dashboard where they can track their fitness journey, view their membership status, log meals, track fitness goals, upload progress photos, browse exercises, book classes, and contact gym support.

> Member logs in at: **`/login`** (email + password)
> Member portal: **`/member/`**

---

## User Role

In the system:
- `User.role = 'member'`
- Linked to a `Client` record via `Client.userId = User._id`

---

## Member Portal Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/member/dashboard` | Membership overview, quick stats, attendance matrix |
| Payments | `/member/payments` | Membership payment history and status |
| Attendance | `/member/attendance` | Own check-in/check-out history |
| Progress Photos | `/member/progress-photos` | Upload and view body transformation photos |
| Fitness Goals | `/member/fitness-goals` | Set and track fitness targets |
| Nutrition | `/member/nutrition` | Meal diary and assigned diet plans |
| Exercise Library | `/member/exercises` | Browse the gym's exercise database |
| Classes | `/member/classes` | View and track gym class schedule |
| Contact Support | `/member/contact-support` | Submit support tickets to the gym |
| Profile | `/member/profile` | View and update personal profile |

---

## Dashboard (`/member/dashboard`)

The member dashboard is the home screen. It shows:

- **Stats Row** — Today's check-in status, days remaining, gym timing, membership plan
- **Calorie Budget & Nutrition Card** — If a diet plan is assigned: calorie ring (logged vs. target) and macro progress bars (Protein, Carbs, Fats). If no plan: a prompt to visit the Nutrition Portal.
- **Monthly Attendance Block Matrix** — Visual 7-column calendar grid for the current month:
  - 🟢 Green = checked-in day
  - 🔴 Red = absent day (past, not checked in)
  - 🟠 Orange = today (pulsing)
  - ⬜ Grey = Sunday or scheduled holiday (rest day)
  - Faded = future days
- **Quick Actions** — My Profile, Gym Support, Attendance Tracking, Billing & Invoices
- **Membership Details** — Plan type, expiry date, remaining days, status badge
- **Announcements** — Latest gym-wide notices (filtered to `members` or `all`)
- **Your Profile Info** — Contact, email, start date, expiry, emergency contact

### Quick Actions Navigation

| Card | Navigates To |
|------|-------------|
| My Profile | `/member/profile` |
| Gym Support | `/member/contact-support` |
| Attendance Tracking | `/member/attendance` |
| Billing & Invoices | `/member/payments` |

---

## Membership Status

The member's status is automatically calculated based on their `endDate`:

| Status | When |
|--------|------|
| `active` | `endDate > today` |
| `expired` | `endDate <= today` |
| `pending` | Pre-start membership |

Membership fields visible to member:
- `plan`: `basic` or `premium`
- `startDate`, `endDate`, `remainingDays`
- `packagePrice`, `timing`
- `hasPersonalTraining`, `personalTrainer`

---

## Attendance (`/member/attendance`)

Members view their own gym check-in history. The full attendance history page includes:
- Monthly summary with a visual calendar
- Check-in/out timestamps and duration
- Attendance streak tracking

Attendance is logged when:
- Receptionist manually checks them in via `/staff/check-in`
- Member scans a QR code at the gym entrance (if enabled)

**API Endpoint:**
```
GET /api/v1/client-attendance/member/:memberId
```

---

## Progress Photos (`/member/progress-photos`)

Members upload transformation photos to track visual progress over time.

- Photos uploaded to **Cloudinary**
- Each photo associated with a date
- Chronological gallery view

**API Endpoints:**
```
GET    /api/v1/progress-photos        # Get own photos
POST   /api/v1/progress-photos        # Upload (multipart/form-data)
DELETE /api/v1/progress-photos/:id    # Delete photo
```

---

## Fitness Goals (`/member/fitness-goals`)

Members set and track fitness targets.

**Goal fields:**
- `type` — weight loss, muscle gain, endurance, flexibility, other
- `targetValue` — numerical target (e.g., target weight in kg)
- `currentValue` — current metric value
- `unit` — kg, reps, minutes, etc.
- `targetDate` — deadline
- `status` — in-progress, achieved, abandoned
- `notes` — personal notes

**API Endpoints:**
```
GET    /api/v1/fitness-goals
POST   /api/v1/fitness-goals
PUT    /api/v1/fitness-goals/:id
DELETE /api/v1/fitness-goals/:id
```

---

## Nutrition / Meal Diary (`/member/nutrition`)

Two nutrition features:

### 1. Assigned Diet Plans (from Trainer)
If the member has a personal trainer, the trainer assigns a structured diet plan. Members view:
- Plan name and date range
- Meals (breakfast, lunch, dinner, snacks) with food items and macros
- Daily nutritional targets (calories, protein, carbs, fat)

### 2. Personal Meal Log
Members log their own daily meals. Each entry tracks foods consumed and their macro breakdown.

**Dashboard preview:** The `MemberDashboard` shows a calorie ring and macro progress bars when a plan is active.

**API Endpoints:**
```
GET /api/v1/diet-plans        # Get assigned diet plans
```

---

## Classes (`/member/classes`)

Members can view the gym class schedule, see upcoming sessions, and track their class bookings. Note: class booking is performed by the Receptionist on behalf of members.

---

## Contact Support (`/member/contact-support`)

Members can submit support tickets directly to the gym through the **MemberSupportPage**. This is also accessible via the "Gym Support" Quick Action on the dashboard.

**API Endpoints:**
```
POST /api/v1/contact        # Submit support ticket
GET  /api/v1/contact        # View submitted tickets
```

---

## Exercise Library (`/member/exercises`)

Members browse the gym's exercise database — the same database maintained by admins and used by trainers.

**Features:**
- Filter by muscle group, equipment, or difficulty
- View exercise name, description, and demonstration instructions

**API Endpoint:**
```
GET /api/v1/exercises
```

---

## Profile (`/member/profile`)

Members view and update:
- Name, contact number, date of birth, gender, address
- Emergency contact details
- Notification preferences (SMS, email, push, WhatsApp)

---

## Gym Feature Flags

When a gym admin disables certain features via the Super Admin panel, the member dashboard shows warning banners:

| Feature Flag | Effect When Disabled |
|---|---|
| `memberPortal` | Hides Workout Plans, Diet, Progress Photos, Goals |
| `attendance` | Hides attendance tracking section |
| `pt` | Hides Personal Training section |
| `classes` | Hides Class Scheduling section |
| `payments` | Hides Payment History section |

---

## Notifications

Members receive notifications for:
- Membership expiring soon
- PT package sessions running low
- New announcements from gym admin
- New diet plan assigned by trainer

**API Endpoints:**
```
GET    /api/v1/notifications              # Get own notifications
PUT    /api/v1/notifications/:id/read     # Mark as read
DELETE /api/v1/notifications/:id
```

---

## Data Privacy & Isolation

Members can only access **their own data**. All member-scoped queries are protected by:
1. The JWT cookie identifying their `userId`
2. Backend queries filtering by `memberId = req.user.id`

---

## Relevant Files

### Frontend
```
fe/src/pages/member/
    MemberDashboard.tsx       # Home screen — stats, attendance matrix, quick actions
    MemberPayments.tsx        # Payment history
    MemberAttendance.tsx      # Check-in history with calendar view
    MemberProgressPhotos.tsx  # Body transformation gallery
    MemberGoals.tsx           # Fitness goal tracker
    MemberNutrition.tsx       # Meal diary + assigned diet plans
    MemberExerciseLibrary.tsx # Exercise browser
    MemberClassesPage.tsx     # Class schedule viewer
    MemberSupportPage.tsx     # Support ticket submission

fe/src/pages/common/
    UserProfilePage.tsx       # Shared profile page (Admin, Staff, Member)

fe/src/components/layout/
    MemberLayout.tsx          # Sidebar navigation for member portal
    MemberSidebar.tsx         # Sidebar with nav items + settings modal
    MemberTopbar.tsx          # Top navigation bar
```

### Backend
```
be/controllers/
    clientAttendance.controllers.ts  # Check-in/out
    progressPhoto.controllers.ts     # Progress photo upload
    fitnessGoal.controllers.ts       # Goal CRUD
    dietPlan.controllers.ts          # Diet plan view
    exercise.controllers.ts          # Exercise library
    notification.controllers.ts      # Notifications
    contact.controllers.ts           # Support ticket submission

be/models/
    client.model.ts                  # Main member profile
    clientAttendance.model.ts        # Check-in records
    progressPhoto.model.ts           # Photo uploads
    fitnessGoal.model.ts             # Goal tracking
    dietPlan.model.ts                # Trainer-assigned diet plans
```

### Hooks
```
fe/src/hooks/
    useClientAttendance.tsx    # Attendance history
    useProgressPhotos.tsx      # Photo gallery
    useFitnessGoals.tsx        # Goal management
    useDietPlan.tsx            # Diet plan access
    useNotifications.ts        # Notification management
    useAnnouncement.tsx        # Gym announcements
    useSchedule.tsx            # Holiday schedule (for attendance matrix)
```
