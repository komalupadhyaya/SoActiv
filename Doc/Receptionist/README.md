# Receptionist Documentation

## Overview

The **Receptionist** is a front-desk staff member responsible for day-to-day gym operations, customer support, and sales pipeline logging. They check members in/out, view the members directory (read-only), register member complaints, schedule appointments, book class sessions on behalf of members, and log walk-in leads for follow-up by the Sales team.

> Receptionist logs in at: **`/staff/login`**
> Receptionist portal: **`/staff/dashboard`** or **`/staff/`**

---

## Position

The Receptionist's position in the database is: **`"receptionist"`**

In the system:
- `User.role = 'staff'`
- `Staff.position = 'receptionist'`

---

## Permissions

| Feature | Access Level | Description |
|---------|-------------|-------------|
| **Dashboard** | ✅ Full Access | Front-desk quick links, today's check-ins, and gym alerts |
| **Check-In/Out** | ✅ Full Access | Search members and log manual check-in/out |
| **Members Directory** | 👁️ Read-Only | Search members, view contacts and trainer info (cannot edit) |
| **Class Booking** | ✅ Full Access | Timetable view to book or cancel sessions on behalf of members |
| **PT / Appt. Booking** | ✅ Full Access | Schedule consultation, tour, or assessment events |
| **Support / Complaints** | ✅ Full Access | Create support tickets on behalf of members |
| **Enquiries & Leads** | ✅ Full Access | View, edit, and create all prospect enquiries (walk-in lead flow) |
| **New Enquiry Form** | ✅ Full Access | Register new walk-in leads |
| **Follow-Ups** | ✅ View own tasks, update status | Same task access as Sales |
| **Announcements** | ✅ View | Read active gym notifications |
| **Staff Directory** | 👁️ Read-Only | Read-only access for assignment purposes |
| **Salary / Payments** | ❌ No access | |

---

## Portal Pages

| Page | URL | Component / Description |
|------|-----|------------------------|
| **Dashboard** | `/staff/dashboard` | `ReceptionistDashboard.tsx` — Hub of front-desk widgets |
| **Check In/Out** | `/staff/check-in` | `CheckInPage.tsx` — Manual log of check-in and check-out |
| **Book Class** | `/staff/book-class` | `BookClassPage.tsx` — Timetable classes for booking |
| **Book Appointment** | `/staff/book-appointment` | `BookAppointmentPage.tsx` — PT/tour/assessment scheduler |
| **Register Complaint** | `/staff/complaints` | `RegisterComplaintPage.tsx` — Member complaints logger |
| **Sales Leads** | `/staff/enquiries` | `SalesLeads.tsx` — All leads and enquiries |
| **New Enquiry** | `/staff/enquiries/new` | `StaffEnquiryFormPage.tsx` — Log a new walk-in prospect |
| **Edit Enquiry** | `/staff/enquiries/edit/:id` | `StaffEnquiryFormPage.tsx` — Edit lead details |
| **Announcements** | `/staff/announcements` | `StaffAnnouncementsPage.tsx` — Read gym notifications |
| **Own Attendance** | `/staff/attendance` | Own attendance records |
| **Profile** | `/staff/profile` | Own profile settings |

---

## Key Operational Flows

### 1. Walk-In Lead Flow
When a prospect visits the gym, the receptionist registers them as a walk-in lead:
```
Prospect visits gym
    ↓
Receptionist opens /staff/enquiries/new
    ↓
Fills details (Name, Phone, Email, Source='walk-in')
Selects Sales Representative and Follow-Up Date
    ↓
POST /api/v1/enquiry
    ↓
Backend saves Enquiry AND triggers:
  • Creates a pending FollowUp task for the Sales rep
  • Creates a calendar Schedule event for the Sales rep
  • Dispatches a real-time Notification to the Sales rep
```

### 2. Manual Member Check-In & Check-Out
Front-desk check-in log for members without active apps or cards.

- Receptionist searches member by name/phone/email
- Clicks "Check-In" or "Check-Out" button
- Triggers `POST /api/v1/client-attendance/mark` with `{ clientId, action: 'checkin' | 'checkout' }`
- Backend logs entry/exit timestamps, calculates duration, and prevents double check-ins

### 3. Class Booking on Behalf of Member
Members are restricted from self-booking classes. Booking is performed by the Receptionist.

- Receptionist opens `/staff/book-class`
- Timetable displays upcoming classes, slots left, and status
- Receptionist selects a class and searches/selects the member
- Triggers `POST /api/v1/class-bookings/staff-book` with `{ classSessionId, memberId }`

### 4. Appointment / PT Booking
The Receptionist can schedule consultation, gym tour, or PT assessment appointments for prospects and members:

- Opens `/staff/book-appointment`
- Selects member or prospect, date, time, appointment type
- Saves to the scheduling system

### 5. Registering a Member Complaint
Members report issues (facility, equipment, staff behavior) through the receptionist:

- Opens `/staff/complaints`
- Fills complaint form: member, complaint type, description
- Submits via the contact/support API

---

## Data Isolation & RBAC Enforcements

### Enquiry Retrieval
Receptionists have the same view privileges as Managers:
```ts
if (staff.position === 'manager' || staff.position === 'receptionist') {
  // Can retrieve and list all enquiries for the gym
} else {
  // Sales representatives only see their assigned leads
  filter.assignedStaff = staff._id;
}
```

### Enquiry Update Access
Receptionists (like managers and admins) can modify all lead fields, including re-assigning sales reps and updating follow-up dates. Standard sales staff are limited to updating status and comments on their assigned leads only.

---

## Relevant Files

### Frontend
```
fe/src/pages/staff/
    ReceptionistDashboard.tsx      # Main receptionist hub
    StaffEnquiryFormPage.tsx       # Create/edit walk-in leads
    SalesLeads.tsx                 # Enquiries listing with receptionist actions
    receptionist/
        CheckInPage.tsx            # Manual attendance logger
        BookClassPage.tsx          # Class booking panel
        BookAppointmentPage.tsx    # Appointment scheduling page
        RegisterComplaintPage.tsx  # Member support logger
```

### Backend
```
be/controllers/
    enquiry.controllers.ts         # Create/fetch/update enquiries
    followUp.controllers.ts        # createOrUpdateEnquiryFollowUp trigger
    clientAttendance.controllers.ts# markClientAttendanceByStaff
    classBooking.controllers.ts    # staffBookSession class booking
    schedule.controllers.ts        # createScheduleEvent validation

be/routes/
    enquiry.routes.ts              # /my-enquiries, /, /:id routes
    followUp.routes.ts             # Follow-up routes
    clientAttendance.routes.ts     # POST /mark route
    classBooking.routes.ts         # POST /staff-book route
    staff.routes.ts                # Staff fetch validation
```
