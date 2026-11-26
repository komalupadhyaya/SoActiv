# SoActiv – Complete Tester Documentation

> **Project Type**: Multi-tenant Gym Management SaaS Platform  
> **Stack**: Node.js (Bun runtime) + Express + MongoDB (Backend) | React + Vite + TypeScript (Frontend)  
> **Base API URL**: `http://localhost:8000/api/v1`  
> **Frontend URL**: `http://localhost:5173`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [User Roles & Hierarchy](#2-user-roles--hierarchy)
3. [Environment Setup for Testing](#3-environment-setup-for-testing)
4. [Portal Access Guide](#4-portal-access-guide)
5. [Feature Modules – Test Scenarios](#5-feature-modules--test-scenarios)
   - [5.1 Authentication](#51-authentication)
   - [5.2 Gym Management (Super Admin)](#52-gym-management-super-admin)
   - [5.3 Staff Management (Admin/Manager)](#53-staff-management-adminmanager)
   - [5.4 Member Management](#54-member-management)
   - [5.5 Enquiries & Leads](#55-enquiries--leads)
   - [5.6 Follow-Ups](#56-follow-ups)
   - [5.7 Attendance – Staff](#57-attendance--staff)
   - [5.8 Attendance – Members](#58-attendance--members)
   - [5.9 Personal Training (PT)](#59-personal-training-pt)
   - [5.10 Gym Classes](#510-gym-classes)
   - [5.11 Class Bookings](#511-class-bookings)
   - [5.12 Schedule/Calendar](#512-schedulecalendar)
   - [5.13 Cleaning Checklist](#513-cleaning-checklist)
   - [5.14 Announcements](#514-announcements)
   - [5.15 Notifications](#515-notifications)
   - [5.16 Member Portal](#516-member-portal)
   - [5.17 Reports (Admin)](#517-reports-admin)
   - [5.18 Contact / Support Ticket](#518-contact--support-ticket)
6. [Permission Matrix](#6-permission-matrix)
7. [API Endpoint Reference](#7-api-endpoint-reference)
8. [Background Jobs & Schedulers](#8-background-jobs--schedulers)
9. [Known Constraints & Edge Cases](#9-known-constraints--edge-cases)
10. [Email Testing Notes](#10-email-testing-notes)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                  SOACTIV PLATFORM                    │
│                                                      │
│  ┌────────────────┐    ┌────────────────────────┐   │
│  │  Frontend (FE) │    │   Backend (BE)          │   │
│  │  React + Vite  │◄──►│   Bun + Express        │   │
│  │  Port: 5173    │    │   Port: 8000            │   │
│  └────────────────┘    └───────────┬────────────┘   │
│                                    │                  │
│                          ┌─────────▼────────┐        │
│                          │   MongoDB        │        │
│                          │   soActive DB    │        │
│                          └──────────────────┘        │
│                                                      │
│  Real-time: Socket.IO (attached to HTTP server)      │
│  File Storage: Cloudinary (avatars, uploads)         │
│  Email: Resend API                                   │
└──────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model
- Every **Gym** is an isolated tenant. Data is scoped by `gymId` or `createdBy (Admin ID)`.
- **Super Admin** is the platform owner — has access to all gyms.
- Each gym has one **Admin** (gym owner), and the admin creates Staff, Members under their gym.

---

## 2. User Roles & Hierarchy

| Role | Level | Scope | Description |
|------|-------|-------|-------------|
| `superadmin` | Platform | All gyms | Platform owner. Manages gyms, admins, plans. |
| `admin` | Gym | Own gym | Gym owner. Full control of their gym. |
| `staff` (manager) | Gym | Own gym | Can request staff CRUD. Full management access (no salary). |
| `staff` (trainer) | Gym | Assigned members | Manages PT sessions, nutrition, workout plans. |
| `staff` (sales) | Gym | Assigned leads | Manages enquiries and follow-ups. |
| `staff` (receptionist) | Gym | Front desk | Check-ins, class bookings, complaints. |
| `staff` (cleaner) | Gym | Cleaning tasks | Marks cleaning checklist items. |
| `staff` (maintenance) | Gym | — | Maintenance staff role. |
| `member` | Gym | Self | Member portal access – attendance, classes, goals. |

### Staff Positions (within role `staff`/`trainer`)
Valid positions: `manager`, `receptionist`, `cleaner`, `sales`, `maintenance`, `trainer`

---

## 3. Environment Setup for Testing

### Prerequisites
- Node.js + Bun installed
- MongoDB running locally on port 27017
- Database name: `soActive`

### Backend Setup
```bash
cd be
# Install dependencies
bun install
# Start dev server (hot reload)
bun run dev
# Server starts at http://localhost:8000
```

### Frontend Setup
```bash
cd fe
npm install
npm run dev
# App starts at http://localhost:5173
```

### Required `.env` Variables (`be/.env`)
```env
PORT=8000
CORS_ORIGIN="http://localhost:5173"
MONGODB_URI="mongodb://localhost:27017/soActive"
ACCESS_TOKEN_SECRET="your-secret-key"
NODE_ENV="development"

# Email (Resend API)
RESEND_API_KEY="re_xxxx"
EMAIL_FROM="SoActiv <onboarding@resend.dev>"

# Cloudinary
CLOUD_NAME=...
CLOUD_API_KEY=...
CLOUD_API_SECRET=...
```

### Creating a Super Admin (First Time Setup)
```bash
cd be
node utils/createSuperAdmin.js
```
> This script creates the superadmin user in the database. Log in via `/super-admin/login`.

### Creating Gym + Admin (via Super Admin Dashboard)
1. Log in to Super Admin portal.
2. Navigate to **Gyms → Create Gym**.
3. Navigate to **Admins → Create Admin** (link to the created gym).

---

## 4. Portal Access Guide

| Portal | URL | Who Uses It |
|--------|-----|-------------|
| Public Landing | `http://localhost:5173/` | Anyone (public) |
| Super Admin Login | `http://localhost:5173/super-admin/login` | Super Admin |
| Staff Login | `http://localhost:5173/staff/login` | All Staff |
| Admin Login | Same as staff login | Admin (role=admin) |
| Member Portal | `http://localhost:5173/member/dashboard` | Members |

> **Note**: There is **no separate admin login page** — admins use the staff login (`/staff/login`).

---

## 5. Feature Modules – Test Scenarios

---

### 5.1 Authentication

#### Test Cases

| # | Scenario | Expected Result |
|---|----------|-----------------|
| A1 | Login with valid admin credentials | Redirected to Admin Dashboard. `accessToken` cookie set. |
| A2 | Login with wrong password | HTTP 401, "Invalid credentials" |
| A3 | Login with non-existent email | HTTP 401, "Invalid credentials" |
| A4 | Login with Super Admin email at Staff login | Redirected to Super Admin dashboard or shows proper role error |
| A5 | Super Admin login at `/super-admin/login` | `super_admin_token` cookie set. Redirected to SA dashboard |
| A6 | Logout | Cookie cleared. Redirected to login page |
| A7 | Rate limiting on login | After 5 failed attempts in quick succession, requests are blocked |
| A8 | Accessing protected route without token | HTTP 401, "Access token is missing" |
| A9 | Accessing route with expired token | HTTP 401, "Access token has expired" |
| A10 | Force logout by Super Admin | Next request by that user returns 401 "Session invalidated" |
| A11 | Member trying to access admin route | HTTP 403 Forbidden |

#### Auth Cookies
- **Staff/Admin/Member sessions**: Cookie name `accessToken`
- **Super Admin sessions**: Cookie name `super_admin_token`
- These are **separate** and never overlap.

---

### 5.2 Gym Management (Super Admin)

#### Access: Super Admin only

| # | Scenario | Expected Result |
|---|----------|-----------------|
| G1 | Create new gym | Gym record + subscription created. `status=trial` for 14 days |
| G2 | List all gyms with filter/search | Returns paginated list, filtered correctly |
| G3 | View gym details | Shows all gym info, features, subscription |
| G4 | Update gym (name, address, phone) | Gym updated |
| G5 | Toggle gym features (payments, pt, classes, attendance, memberPortal) | Feature flag toggled. Affected routes return 403 for that gym |
| G6 | Change gym status to `suspended` | All gym users get "Gym is suspended" error on any request |
| G7 | Change gym status to `expired` | Similar to suspended |
| G8 | Soft-delete a gym | Gym marked deleted. Not visible in list. Admin cannot log in. |
| G9 | Extend trial period | `trialEndsAt` extended by N days |
| G10 | Create Admin for an active gym | Admin user created. Welcome email sent (if Resend configured). |
| G11 | Create Admin for a suspended/expired gym | HTTP 403, blocked |
| G12 | Reset Admin password | Password updated. Admin must use new password. |
| G13 | Force logout Admin | Admin's `tokenVersion` incremented. Their next request returns 401. |

#### Gym Statuses
| Status | Description |
|--------|-------------|
| `trial` | 14-day trial. Admin can use most features. |
| `active` | Fully active subscription. |
| `suspended` | All gym requests blocked. Super Admin can reactivate. |
| `expired` | Trial/subscription ended. Admin cannot access. |

#### Gym Feature Flags
Features can be toggled per gym. Disabled features return `403 Feature not enabled` for all requests.
| Feature | Controls |
|---------|---------|
| `payments` | Client payment records |
| `attendance` | Staff & member attendance |
| `pt` | Personal Training plans and sessions |
| `classes` | Gym class management and bookings |
| `memberPortal` | Member login and portal access |

---

### 5.3 Staff Management (Admin/Manager)

#### Access: Admin (full), Manager (requires Admin approval for CRUD)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| S1 | Admin creates staff (any position) | Staff + User account created. Welcome email sent. |
| S2 | Manager creates staff | Staff request created with `approvalStatus=pending_create`. Admin gets notification. |
| S3 | Admin approves manager's create request | Staff + User account created, `approvalStatus=approved` |
| S4 | Admin rejects manager's create request | Staff record deleted, manager notified |
| S5 | Create staff with duplicate email | HTTP 400, "User with this email already exists" |
| S6 | Create staff with duplicate phone | HTTP 400, "Staff member with this phone already exists" |
| S7 | Update staff details | Staff record updated |
| S8 | Delete staff | Staff record + associated User account deleted |
| S9 | Bulk upload staff via CSV | Multiple staff created from CSV file |
| S10 | List all staff | Returns all staff under logged-in admin's gym |
| S11 | Receptionist listing staff | Can view staff list (read-only) |
| S12 | Trainer trying to list all staff | HTTP 403 or filtered view |

#### Approval Workflow (Manager Actions)
```
Manager submits create/update/delete
         ↓
approvalStatus = "pending_create" / "pending_update" / "pending_delete"
         ↓
Admin sees notification + reviews request
         ↓
Admin approves → action executed
Admin rejects → request cancelled
```

---

### 5.4 Member Management

#### Access: Admin, Manager, Receptionist (view only)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| M1 | Admin creates member | Client + User account created. Welcome email sent. |
| M2 | Receptionist tries to create member | HTTP 403 (not allowed) |
| M3 | Create member with duplicate email (same gym) | HTTP 400, unique constraint |
| M4 | Create member with past `endDate` | Member created with `status=expired`, `remainingDays < 0` |
| M5 | View member list (Admin) | All gym members returned |
| M6 | View member list (Manager) | All gym members returned |
| M7 | View member list (Receptionist) | Member list visible (view only) |
| M8 | Trainer viewing members | Can only see assigned members |
| M9 | Update member details | Updated. `status` auto-recalculates from `endDate` |
| M10 | Delete member (Admin) | Hard delete. Client + User removed. |
| M11 | Manager requests delete | `deleteRequested=true`. Admin must approve via `reject-delete` or actual delete |
| M12 | Notify renewal for expiring member | Sends notification/email to member |
| M13 | Bulk upload members via CSV | Members created from file |
| M14 | Member with `hasPersonalTraining=true` but no trainer | Validation error |

#### Member Statuses (auto-calculated)
| Status | Condition |
|--------|-----------|
| `active` | `endDate > today` |
| `expired` | `endDate <= today` |
| `pending` | Manual override |

---

### 5.5 Enquiries & Leads

#### Access: Admin, Manager, Sales (own), Receptionist (create only)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| E1 | Create enquiry (authenticated) | Enquiry created with `status=new`, `expiryDate = createdAt + 14 days` |
| E2 | Public enquiry submission from landing page | Rate limited: 5 requests/15 min per IP |
| E3 | Enquiry auto-expires after 14 days | `isExpired=true`, `remainingDays < 0` |
| E4 | Admin extends enquiry expiry | `expiryDays` updated, `expiryDate` recalculated |
| E5 | View expiring enquiries | Returns enquiries with `isExpired=true` or close to expiry |
| E6 | Assign staff to enquiry | `assignedStaff` field updated |
| E7 | Update enquiry status | Valid statuses: `new`, `contacted`, `interested`, `converted`, `lost` |
| E8 | Delete enquiry | Hard delete |
| E9 | Sales staff sees only their own enquiries | Filtered by `assignedStaff = logged-in staff` |
| E10 | Bulk upload enquiries via CSV | Multiple enquiries created |

#### Enquiry Statuses
| Status | Meaning |
|--------|---------|
| `new` | Just submitted |
| `contacted` | Staff has contacted the prospect |
| `interested` | Prospect is interested |
| `converted` | Converted to a paying member |
| `lost` | Prospect not interested |

#### Enquiry Sources
`website`, `social-media`, `referral`, `walk-in`, `advertisement`, `other`

---

### 5.6 Follow-Ups

#### Access: Admin (full), Manager (full), Sales/Receptionist (own tasks only)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| F1 | Admin creates follow-up and assigns to sales staff | Follow-up created with `status=pending` |
| F2 | Sales staff views their assigned follow-ups | `GET /follow-up/my-tasks` returns their tasks |
| F3 | Staff updates follow-up status | Valid: `pending`, `completed`, `failed`, `rescheduled`, `cancelled` |
| F4 | Staff completes follow-up with notes | Status → `completed`. `completedAt` and `completionNotes` set. |
| F5 | Staff marks follow-up as failed | Status → `failed`. Reason saved. |
| F6 | Staff requests reschedule | Status → `reschedule_pending`. Admin gets notification. |
| F7 | Admin approves reschedule | `scheduledDate`/`scheduledTime` updated. Status → `rescheduled`. |
| F8 | Admin rejects reschedule | Status reverts to `pending`. Staff notified. |
| F9 | Follow-up reminder 1 hour before | Background scheduler fires notification to assigned staff |
| F10 | Delete follow-up (Admin only) | Hard delete |
| F11 | View upcoming follow-ups (today + 7 days) | Returns only future pending follow-ups |
| F12 | Admin views all gym follow-ups | Returns all, filtered by `userId` (admin's ID) |
| F13 | Duplicate follow-up prevention | Same staff + same date + same time + pending → rejected |

#### Follow-Up Types
`enquiry`, `client`, `pt`, `call`, `message`, `visit`, `other`

#### Follow-Up Statuses
| Status | Description |
|--------|-------------|
| `pending` | Awaiting action |
| `completed` | Done |
| `failed` | Could not be done |
| `rescheduled` | Reschedule approved |
| `cancelled` | Cancelled |
| `reschedule_pending` | Staff requested reschedule, awaiting admin approval |

---

### 5.7 Attendance – Staff

#### Access: Requires `attendance` feature enabled on gym

| # | Scenario | Expected Result |
|---|----------|-----------------|
| AT1 | Admin marks staff attendance for a date | Record created with `status` (present/absent/late/half-day) |
| AT2 | Get attendance by date | Returns all staff attendance for that date |
| AT3 | Get daily attendance sheet | Returns all staff with their status for a given date |
| AT4 | Get attendance history for a specific staff | Returns records for that staff member |
| AT5 | Update attendance record | Record updated |
| AT6 | Delete attendance record | Hard delete |
| AT7 | Get monthly attendance report | Summary for a given month |
| AT8 | Try when `attendance` feature is disabled | HTTP 403, "Feature not enabled" |

---

### 5.8 Attendance – Members

#### Access: Members (self check-in), Receptionist/Manager (staff mark)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| CA1 | Member checks in | Creates record with `checkInTime`, `status=checked_in` |
| CA2 | Member checks out | `checkOutTime` set, duration calculated |
| CA3 | Member checks in twice without checkout | Should be handled gracefully (prevent duplicate) |
| CA4 | Member views own attendance history | Returns all records for that member |
| CA5 | Member views monthly attendance | Summary for a specific month |
| CA6 | Receptionist marks check-in/out for a member | `POST /client-attendance/mark` |
| CA7 | Admin views attendance for a specific member | `GET /client-attendance/client/:clientId` |
| CA8 | Get today's attendance logs | Receptionist/Manager can view all check-ins for today |
| CA9 | Check-in when `attendance` feature disabled | HTTP 403 |

---

### 5.9 Personal Training (PT)

#### Access: Requires `pt` feature enabled on gym

| # | Scenario | Expected Result |
|---|----------|-----------------|
| PT1 | Admin creates PT plan (name, sessions, price, duration) | Plan created, `isActive=true` |
| PT2 | Admin lists all PT plans | All gym PT plans returned |
| PT3 | Admin toggles PT plan active/inactive | `isActive` toggled |
| PT4 | Admin/Manager/Sales assigns PT to a member | PT assignment created with sessions, expiry date |
| PT5 | Trainer views their PT assignments | Only their assigned members shown |
| PT6 | Trainer logs a PT session | Session logged, remaining sessions decremented |
| PT7 | PT expires (sessions used up or date passed) | Status updated to expired |
| PT8 | Admin views expiring PT packages | `/client/pt-expiring` or `/client/pt-expiring/by-trainer` |
| PT9 | Receptionist views PT plans | Read-only access |
| PT10 | Try when `pt` feature is disabled | HTTP 403 |

---

### 5.10 Gym Classes

#### Access: Admin (CRUD), Trainer (view own), Member (view + book)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| CL1 | Admin creates gym class | Class created with trainer, capacity, time, recurrence |
| CL2 | Class with `recurrence=weekly, days=[1,3,5]` | Sessions auto-generated for Mon/Wed/Fri |
| CL3 | Class with `recurrence=none` | One-time class session created |
| CL4 | Admin updates class details | Class updated |
| CL5 | Admin deactivates class | `status=inactive`. No new bookings allowed. |
| CL6 | Admin cancels class | `status=cancelled`. |
| CL7 | Trainer views their assigned classes | Filtered by `trainerUserId` |
| CL8 | Trainer marks attendance for class session | Session attendance marked |
| CL9 | Try when `classes` feature is disabled | HTTP 403 |

#### Class Fields
- `capacity`: 1–500 members
- `durationMinutes`: 15–480 minutes
- `time`: HH:MM format
- `recurrence`: `none` or `weekly` with specific days

---

### 5.11 Class Bookings

#### Access: Member (self-book), Receptionist (book on behalf), Trainer/Admin (view bookings)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| CB1 | Member books a class session | Booking created, available spots decremented |
| CB2 | Member books a full class | HTTP 400, "Class is full" |
| CB3 | Member cancels a booking | Booking cancelled, spot released |
| CB4 | Member self-checks-in (within 60 min of class start) | Booking status updated to `checked_in` |
| CB5 | Member tries to self-check-in too early | Rejected |
| CB6 | Receptionist books class for a member | `POST /class-bookings/staff-book` |
| CB7 | Get member's own bookings | `GET /class-bookings/my-bookings` |
| CB8 | Admin/Trainer views all bookings for a session | `GET /class-bookings/session/:sessionId` |

---

### 5.12 Schedule/Calendar

#### Access: Admin (full), Manager/Receptionist (create/update), Staff (view own)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| SC1 | Manager creates schedule event for staff | Event created, staff notified |
| SC2 | Staff views their own schedule | `GET /schedule/my-schedule` returns only their events |
| SC3 | Admin views all gym schedule events | Full schedule returned |
| SC4 | Complete a schedule event | `status=completed`, `completedAt` set |
| SC5 | Delete schedule event | Event deleted (Admin/Manager only) |
| SC6 | Check if a date is a holiday | `GET /schedule/holiday-check?date=YYYY-MM-DD` |

---

### 5.13 Cleaning Checklist

#### Access: Admin/Manager (templates), Cleaner (checklist)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| CC1 | Admin creates cleaning template for a cleaner | Template saved with checklist items |
| CC2 | Cleaner views today's checklist | Returns today's cleaning checklist |
| CC3 | Cleaner toggles a checklist item | Item marked done/undone |
| CC4 | Cleaner completes entire checklist | Checklist `status=completed`, `completedAt` set |
| CC5 | Manager views cleaning logs | History of all completed checklists |

---

### 5.14 Announcements

#### Access: Admin (create/delete), All Staff + Members (view)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| AN1 | Admin creates announcement | Notification sent to all gym users |
| AN2 | Staff views announcements | Own gym announcements listed |
| AN3 | Member views announcements | Member portal shows gym announcements |
| AN4 | Super Admin creates platform-wide announcement | All gym admins receive it |
| AN5 | Admin deletes announcement | Removed from list |

---

### 5.15 Notifications

#### Access: Any authenticated user (own notifications)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| N1 | Get notifications (paginated) | Returns user's notifications + unread count |
| N2 | Mark one notification as read | `isRead=true` |
| N3 | Mark all notifications as read | All set to `isRead=true` |
| N4 | Delete one notification | Removed |
| N5 | Clear all notifications | All removed |
| N6 | Trigger test notification | `POST /notifications/test-mock` creates a test notification |
| N7 | Real-time notification via Socket.IO | Bell icon updates instantly when new notification arrives |

---

### 5.16 Member Portal

#### Access: Members only (requires `memberPortal` feature enabled)

| # | Scenario | Expected Result |
|---|----------|-----------------|
| MP1 | Member logs in | Redirected to `/member/dashboard` |
| MP2 | Member views dashboard | Shows today's check-in status, remaining membership days, upcoming classes |
| MP3 | Member views attendance history | All check-ins displayed in calendar/table |
| MP4 | Member views their classes + books a class | Available sessions shown. Can book/cancel. |
| MP5 | Member views diet plan | Trainer-assigned diet plan shown |
| MP6 | Member views fitness goals | Personal goals and progress |
| MP7 | Member views progress photos | Uploaded progress photos shown |
| MP8 | Member uploads progress photo | Photo stored via Cloudinary |
| MP9 | Member views exercise library | All gym exercises listed |
| MP10 | Member views payment history | Membership payment records |
| MP11 | Member submits support ticket | Contact form submitted. Admin receives it in inbox. |
| MP12 | Member tries to access staff route | HTTP 403 |
| MP13 | Member portal disabled for gym | HTTP 403 on all member routes |

---

### 5.17 Reports (Admin)

#### Access: Admin only

| # | Scenario | Expected Result |
|---|----------|-----------------|
| R1 | View dashboard metrics | Active members, expiring soon, new enquiries, revenue summary |
| R2 | View member reports | Filter by status, plan, date range |
| R3 | View staff reports | Staff attendance and performance |
| R4 | View enquiry funnel report | Leads by source and status |
| R5 | View PT expiry report | Expiring PT packages grouped by trainer |
| R6 | Super Admin dashboard metrics | Platform-wide: gym count, member count, revenue |

---

### 5.18 Contact / Support Ticket

| # | Scenario | Expected Result |
|---|----------|-----------------|
| CT1 | Member submits support ticket | Ticket stored. Admin sees it in support inbox. |
| CT2 | Admin replies to ticket | Reply sent, ticket status updated |
| CT3 | Contact form on public landing page | Message stored, super admin can view |
| CT4 | Admin views support inbox | All tickets from their gym members |

---

## 6. Permission Matrix

### By Feature & Role

| Feature | Super Admin | Admin | Manager | Trainer | Sales | Receptionist | Cleaner | Member |
|---------|:-----------:|:-----:|:-------:|:-------:|:-----:|:------------:|:-------:|:------:|
| Gym CRUD | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Admin CRUD | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Plans CRUD | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Staff CRUD | ❌ | ✅ | Request | ❌ | ❌ | ❌ | ❌ | ❌ |
| Member CRUD | ❌ | ✅ | ✅ | ❌ | ❌ | View | ❌ | Self |
| Enquiries | ❌ | ✅ | ✅ | ❌ | Own | ✅ | ❌ | ❌ |
| Follow-Ups | ❌ | ✅ | ✅ | ❌ | Own | Limited | ❌ | ❌ |
| PT Plans | ❌ | ✅ | ✅ | View | View | View | ❌ | ❌ |
| PT Assign | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| PT Session Log | ❌ | ✅ | ✅ | Own | ❌ | ❌ | ❌ | ❌ |
| Classes CRUD | ❌ | ✅ | ❌ | View | ❌ | ❌ | ❌ | View |
| Class Booking | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Schedule | ❌ | ✅ | ✅ | View | ❌ | Create | ❌ | ❌ |
| Staff Attendance | ❌ | ✅ | ✅ | Self | Self | Self | Self | ❌ |
| Member Attendance | ❌ | ✅ | ✅ | ❌ | ❌ | Mark | ❌ | Self |
| Cleaning | ❌ | ❌ | Template | ❌ | ❌ | ❌ | Tasks | ❌ |
| Announcements | ❌ | ✅ | ❌ | View | View | View | ❌ | View |
| Notifications | ❌ | ✅ | Own | Own | Own | Own | Own | Own |
| Reports | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Nutrition (Diet) | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | View |
| Exercise Library | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | View |
| Progress Photos | ❌ | ❌ | ❌ | View | ❌ | ❌ | ❌ | Own |
| Fitness Goals | ❌ | ❌ | ❌ | View | ❌ | ❌ | ❌ | Own |
| Support Tickets | ❌ | View+Reply | ❌ | ❌ | ❌ | ❌ | ❌ | Create |

---

## 7. API Endpoint Reference

### Base URL: `http://localhost:8000/api/v1`

#### Auth / User
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/user/login` | Login (rate limited) | No |
| POST | `/user/register` | Register gym admin (self-signup) | No |
| POST | `/user/logout` | Logout | Yes |
| GET | `/user/getCurrentUser` | Get current user | Yes |
| PATCH | `/user/profile` | Update profile + avatar | Yes |
| POST | `/user/change-password` | Change password | Yes |

#### Super Admin
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/super-admin/auth/login` | Super Admin login | No |
| POST | `/super-admin/auth/logout` | Super Admin logout | SA |
| GET | `/super-admin/me` | Get Super Admin profile | SA |
| PATCH | `/super-admin/profile` | Update SA profile | SA |
| POST | `/super-admin/change-password` | Change SA password | SA |
| GET | `/super-admin/dashboard/metrics` | Platform metrics | SA |
| GET | `/super-admin/dashboard/charts` | Platform charts | SA |
| GET | `/super-admin/logs` | Audit logs | SA |
| POST | `/super-admin/gyms` | Create gym | SA |
| GET | `/super-admin/gyms` | List all gyms | SA |
| GET | `/super-admin/gyms/:id` | Get gym details | SA |
| PATCH | `/super-admin/gyms/:id` | Update gym | SA |
| PATCH | `/super-admin/gyms/:id/status` | Change gym status | SA |
| PATCH | `/super-admin/gyms/:id/features/:featureName` | Toggle feature | SA |
| PATCH | `/super-admin/gyms/:id/extend-trial` | Extend trial | SA |
| DELETE | `/super-admin/gyms/:id` | Soft-delete gym | SA |
| POST | `/super-admin/admins` | Create admin | SA |
| GET | `/super-admin/admins` | List admins | SA |
| PATCH | `/super-admin/admins/:id` | Update admin | SA |
| POST | `/super-admin/admins/:id/reset-password` | Reset admin password | SA |
| POST | `/super-admin/admins/:id/force-logout` | Force logout admin | SA |
| GET | `/super-admin/plans` | List subscription plans | No |
| POST | `/super-admin/plans` | Create plan | SA |
| PATCH | `/super-admin/plans/:id` | Update plan | SA |
| DELETE | `/super-admin/plans/:id` | Soft-delete plan | SA |
| POST | `/super-admin/impersonate/:adminId` | Impersonate admin | SA |

#### Staff
| Method | Path | Auth | Permission |
|--------|------|------|-----------|
| POST | `/staff` | Yes | Admin + Manager |
| GET | `/staff` | Yes | Admin, Manager, Receptionist |
| GET | `/staff/:id` | Yes | Admin, Manager |
| PUT | `/staff/:id` | Yes | Admin + Manager |
| DELETE | `/staff/:id` | Yes | Admin + Manager |
| PATCH | `/staff/:id/approve` | Yes | Admin only |
| PATCH | `/staff/:id/reject` | Yes | Admin only |
| PATCH | `/staff/update-profile` | Yes | Any staff |
| POST | `/staff/bulk-upload` | Yes | Admin only |

#### Clients (Members)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/client` | Create member |
| GET | `/client` | List members |
| GET | `/client/:id` | Get member |
| PUT | `/client/:id` | Update member |
| DELETE | `/client/:id` | Delete member |
| POST | `/client/bulk-upload` | Bulk create |
| GET | `/client/pt-expiring` | Expiring PT |
| GET | `/client/pt-expiring/by-trainer` | PT expiry by trainer |
| GET | `/client/:id/pt-status` | Client PT status |
| POST | `/client/:id/notify-renewal` | Notify renewal |

#### Enquiries
| Method | Path | Description |
|--------|------|-------------|
| POST | `/enquiry` | Create enquiry |
| POST | `/enquiry/public` | Public enquiry (rate limited) |
| GET | `/enquiry` | List all (admin/manager) |
| GET | `/enquiry/my` | Own enquiries |
| GET | `/enquiry/my-enquiries` | Role-filtered enquiries |
| GET | `/enquiry/expiring` | Expiring enquiries |
| GET | `/enquiry/:id` | Get enquiry |
| PUT | `/enquiry/:id` | Update enquiry |
| DELETE | `/enquiry/:id` | Delete enquiry |
| PUT | `/enquiry/:id/extend-expiry` | Extend expiry |
| PATCH | `/enquiry/:id/assign` | Assign staff |

#### Follow-Ups
| Method | Path | Description |
|--------|------|-------------|
| POST | `/follow-up` | Create follow-up |
| GET | `/follow-up` | List all (admin/manager) |
| GET | `/follow-up/my-tasks` | Staff's assigned tasks |
| GET | `/follow-up/upcoming` | Upcoming (7 days) |
| PUT | `/follow-up/:id` | Update follow-up |
| PUT | `/follow-up/:id/status` | Update status |
| PUT | `/follow-up/:id/complete` | Mark completed |
| PUT | `/follow-up/:id/complete-with-notes` | Complete with notes |
| PUT | `/follow-up/:id/fail` | Mark failed |
| PUT | `/follow-up/:id/reschedule` | Request reschedule |
| PUT | `/follow-up/:id/approve-reschedule` | Approve reschedule |
| PUT | `/follow-up/:id/reject-reschedule` | Reject reschedule |
| DELETE | `/follow-up/:id` | Delete follow-up |

#### Attendance (Staff)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/staff-attendance` | Mark attendance |
| PUT | `/staff-attendance/:id` | Update record |
| GET | `/staff-attendance/date/:date` | By date |
| GET | `/staff-attendance/sheet/:date` | Daily sheet |
| GET | `/staff-attendance/staff/:staffId` | By staff |
| DELETE | `/staff-attendance/:id` | Delete record |
| GET | `/staff-attendance/monthly` | Monthly report |

#### Attendance (Members)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/client-attendance/check-in` | Member check-in |
| POST | `/client-attendance/check-out` | Member check-out |
| GET | `/client-attendance/my` | Member's own history |
| GET | `/client-attendance/my/month` | Monthly summary |
| GET | `/client-attendance/client/:clientId` | Admin views member's attendance |
| POST | `/client-attendance/mark` | Staff marks for member |
| GET | `/client-attendance/today-logs` | Today's all check-ins |

#### Personal Training
| Method | Path | Description |
|--------|------|-------------|
| POST | `/pt/plans` | Create PT plan |
| GET | `/pt/plans` | List plans |
| PUT | `/pt/plans/:id` | Update plan |
| PATCH | `/pt/plans/:id/status` | Toggle plan status |
| POST | `/pt/assignments` | Assign PT to member |
| GET | `/pt/assignments` | List assignments |
| POST | `/pt/assignments/:id/session` | Log PT session |
| POST | `/pt/expiry-check` | Check expired packages |

#### Classes & Bookings
| Prefix | Description |
|--------|-------------|
| `/classes` | Gym class CRUD |
| `/class-sessions` | Session management |
| `/class-bookings` | Member booking |
| `/class-attendance` | Session attendance |

#### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | Get all (paginated) |
| PATCH | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |
| DELETE | `/notifications` | Clear all |
| DELETE | `/notifications/:id` | Delete one |
| POST | `/notifications/test-mock` | Trigger test notification |

---

## 8. Background Jobs & Schedulers

Two background schedulers run automatically when the server starts:

### Follow-Up Reminder Scheduler
- **Interval**: Every 60 seconds
- **Logic**: Checks all `pending` follow-ups with `reminderSent=false`. If the scheduled time is ≤ 1 hour away, sends notification to assigned staff and marks `reminderSent=true`.
- **Test**: Create a follow-up scheduled 55 minutes from now → verify notification arrives within 60 seconds.

### Meal Reminder Scheduler
- **Logic**: Checks each member's diet plan and sends meal reminders at appropriate times.
- **Test**: `POST /notifications/test-meal-reminder` with body `{"meal": "Breakfast"}` to trigger manually.

---

## 9. Known Constraints & Edge Cases

| # | Constraint | Details |
|---|-----------|---------|
| C1 | Enquiry email uniqueness | Unique per `userId + email` combo. Same email can exist under different admins. |
| C2 | Client email/phone uniqueness | Unique per `userId` (admin). Same email can exist in different gyms. |
| C3 | Staff email uniqueness | Global uniqueness in `users` collection. Same email cannot be used for two staff. |
| C4 | Follow-up duplicate prevention | Cannot create two `pending` follow-ups for same staff at same date+time. |
| C5 | Manager staff CRUD | Managers CANNOT directly create/update/delete staff. They must submit requests for Admin approval. |
| C6 | Receptionist restrictions | Cannot create/edit/delete members. Cannot edit lead status/notes. Can only update walk-in enquiries. |
| C7 | Gym isolation | Queries are isolated by `adminId` or `gymId`. Staff from Gym A cannot see Gym B data. |
| C8 | Token invalidation | Super Admin can force-logout any admin by incrementing `tokenVersion`. Next request returns 401. |
| C9 | Gym feature flags | Individual features (PT, Attendance, Classes, Member Portal, Payments) can be disabled per gym. Any route for that feature returns 403. |
| C10 | Suspended gym | When gym status is `suspended` or `expired`, all requests from that gym's users return gym-level errors. |
| C11 | PT assignment requires `pt` feature | Cannot assign PT or log sessions if `pt` feature is disabled for gym. |
| C12 | Member check-in | Members can only check in once per day. A second check-in triggers check-out logic. |
| C13 | Class booking capacity | Cannot book a session that is already at capacity. |
| C14 | Class self-check-in window | Member can only self-check-in within 60 minutes of class start time. |
| C15 | Trainer cannot edit other trainer's clients | PT session logging is scoped to the trainer's own assignments. |
| C16 | Public enquiry rate limit | Maximum 5 public enquiries per IP per 15 minutes. |
| C17 | Request body limit | Maximum `20kb` for all API requests. |
| C18 | Soft-delete for gyms and plans | Gyms and Plans use `deletedAt` soft-delete. Hard-deleted admins/users require database-level action. |

---

## 10. Email Testing Notes

### Current Configuration
- **Provider**: Resend API
- **Sender**: `onboarding@resend.dev` (sandbox/testing mode)

### Sandbox Restriction
In sandbox mode, **Resend only delivers emails to the email address registered with your Resend account** (the account owner's email). Emails sent to any other address are **accepted by the API but not delivered**.

### Trigger Points
| Event | Email Sent |
|-------|-----------|
| New staff member created | Welcome email to staff + copy to admin |
| New member (client) created | Welcome email to member |
| Staff creation (if sandbox) | Only delivered if recipient = Resend account email |

### For Production Email
To send emails to any recipient:
1. Verify a custom domain at [resend.com/domains](https://resend.com/domains)
2. Update `EMAIL_FROM` in `.env`:
   ```env
   EMAIL_FROM="SoActiv <hello@yourdomain.com>"
   ```

### Testing Email Manually
Use the test script (if available):
```bash
cd be
bun run scratch/test_resend_send.ts
```

---

*Documentation last updated: June 2026*  
*Generated from full project analysis of SoActiv codebase.*
