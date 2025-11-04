# New Features Documentation - Gym Management System

## Overview
This document describes the new modules integrated into the Gym Management System. All features are accessible from the admin dashboard and follow the existing project structure and design patterns.

---

## 🎯 Features Implemented

### 1. **Enquiries Expiring Module**

#### Description
Tracks all client enquiries with automatic expiry calculation based on creation date and configurable expiry period.

#### Backend Implementation
- **Model Updates** (`be/models/enquiry.model.ts`):
  - Added `expiryDays` field (default: 14 days)
  - Added `expiryDate` field (auto-calculated)
  - Added `isExpired` boolean field
  - Added `remainingDays` field
  - Pre-save hook automatically calculates expiry status

- **Controllers** (`be/controllers/enquiry.expiry.controllers.ts`):
  - `getExpiringEnquiries`: Fetch enquiries expiring within X days
  - `extendEnquiryExpiry`: Extend expiry by additional days
  - `updateEnquiryExpiryStatus`: Batch update expiry status (for cron jobs)

- **Routes** (`be/routes/enquiry.routes.ts`):
  - `GET /api/v1/enquiry/expiring?days=7`
  - `PUT /api/v1/enquiry/:id/extend-expiry`
  - `POST /api/v1/enquiry/update-expiry-status`

#### Frontend Implementation
- **Hook** (`fe/src/hooks/useEnquiryExpiry.tsx`):
  - `fetchExpiringEnquiries(days)`: Fetch expiring enquiries
  - `extendEnquiryExpiry(id, additionalDays)`: Extend expiry

- **Dashboard Card** (`fe/src/components/dashboard/ExpiringEnquiriesCard.tsx`):
  - Shows total expiring, expired, and expiring soon counts
  - Color-coded alerts (red for expired, yellow for expiring soon)
  - Quick navigation to detailed view

- **Detailed Page** (`fe/src/pages/admin/EnquiriesExpiringPage.tsx`):
  - Filterable by days (3, 7, 14, 30)
  - Tabbed view: All, Expired, Expiring Soon
  - Extend expiry functionality
  - View enquiry details

#### Access Control
- **Admin**: Full access
- **Sales**: Full access
- **Trainer**: No access
- **Front Desk**: No access

---

### 2. **PT (Personal Training) Expiring Module**

#### Description
Tracks Personal Training packages and calculates expiry based on end date. Shows packages that are about to expire or already expired.

#### Backend Implementation
- **Controllers** (`be/controllers/pt.expiry.controllers.ts`):
  - `getExpiringPTPackages`: Fetch PT packages expiring within X days
  - `getExpiringPTByTrainer`: Group expiring PT by trainer
  - `getClientPTStatus`: Get PT status for specific client

- **Routes** (`be/routes/client.routes.ts`):
  - `GET /api/v1/client/pt-expiring?days=7`
  - `GET /api/v1/client/pt-expiring/by-trainer?days=7`
  - `GET /api/v1/client/:id/pt-status`

#### Frontend Implementation
- **Hook** (`fe/src/hooks/usePTExpiry.tsx`):
  - `fetchExpiringPT(days)`: Fetch expiring PT packages
  - `fetchPTByTrainer(days)`: Fetch grouped by trainer
  - `getClientPTStatus(clientId)`: Get specific client PT status

- **Dashboard Card** (`fe/src/components/dashboard/ExpiringPTCard.tsx`):
  - Shows total expiring, expired, and expiring soon counts
  - Purple-themed design
  - Quick navigation to detailed view

- **Detailed Page** (`fe/src/pages/admin/PTExpiringPage.tsx`):
  - Filterable by days (3, 7, 14, 30)
  - Tabbed view: All, Expired, Expiring Soon
  - View client details
  - Create follow-up directly from PT card

#### Access Control
- **Admin**: Full access
- **Sales**: No access
- **Trainer**: Can view only their assigned clients
- **Front Desk**: No access

---

### 3. **Follow-Ups Module**

#### Description
Allows staff to log and track follow-ups for enquiries, clients, and PT packages. Includes scheduled date/time and notes.

#### Backend Implementation
- **Model** (`be/models/followUp.model.ts`):
  - Fields: `assignedTo`, `type` (enquiry/client/pt), `relatedId`, `relatedName`, `scheduledDate`, `scheduledTime`, `note`, `status`, `completedAt`
  - Pre-save hook sets `completedAt` when status changes to completed

- **Controllers** (`be/controllers/followUp.controllers.ts`):
  - `createFollowUp`: Create new follow-up
  - `getAllFollowUps`: Get all with filters (status, type, assignedTo, date)
  - `getUpcomingFollowUps`: Get follow-ups for next 7 days
  - `updateFollowUp`: Update follow-up
  - `completeFollowUp`: Mark as completed
  - `deleteFollowUp`: Delete follow-up

- **Routes** (`be/routes/followUp.routes.ts`):
  - `POST /api/v1/follow-up`
  - `GET /api/v1/follow-up`
  - `GET /api/v1/follow-up/upcoming`
  - `PUT /api/v1/follow-up/:id`
  - `PUT /api/v1/follow-up/:id/complete`
  - `DELETE /api/v1/follow-up/:id`

#### Frontend Implementation
- **Hook** (`fe/src/hooks/useFollowUp.tsx`):
  - `fetchFollowUps(filters)`: Fetch with filters
  - `fetchUpcomingFollowUps()`: Fetch upcoming
  - `createFollowUp(data)`: Create new
  - `updateFollowUp(id, updates)`: Update
  - `completeFollowUp(id)`: Mark complete
  - `deleteFollowUp(id)`: Delete

- **Dashboard Card** (`fe/src/components/dashboard/UpcomingFollowUpsCard.tsx`):
  - Shows upcoming follow-ups count
  - Today's follow-ups list
  - Quick complete action
  - Blue-themed design

- **List Page** (`fe/src/pages/admin/FollowUpsPage.tsx`):
  - Filter by status (pending/completed/cancelled)
  - Filter by type (enquiry/client/pt)
  - Complete and delete actions
  - Color-coded by type and status

- **Form Page** (`fe/src/pages/admin/FollowUpFormPage.tsx`):
  - Create new follow-up
  - Assign to staff member
  - Schedule date and time
  - Add notes (max 500 characters)
  - Pre-fill support from navigation state

#### Access Control
- **Admin**: Full access
- **Sales**: Can view/manage their own follow-ups
- **Trainer**: Can view/manage their own follow-ups
- **Front Desk**: No access

---

### 4. **Calendar View**

#### Description
Unified calendar view showing all expiring enquiries, PT packages, and scheduled follow-ups.

#### Frontend Implementation
- **Page** (`fe/src/pages/admin/CalendarPage.tsx`):
  - Monthly calendar grid
  - Color-coded events:
    - Orange: Enquiry expiring
    - Purple: PT expiring
    - Blue: Follow-up scheduled
    - Red: Expired items
  - Navigate between months
  - Click on date to view details
  - Summary stats at bottom
  - Legend for event types

#### Features
- Auto-updates based on current date
- Shows up to 3 events per day (with "+X more" indicator)
- Highlights today's date
- Responsive grid layout

#### Access Control
- **Admin**: Full access
- **Sales**: Can view enquiries and follow-ups
- **Trainer**: Can view PT packages and follow-ups
- **Front Desk**: Read-only access

---

### 5. **Role-Based Access Control**

#### Description
Extended user role system to support granular permissions.

#### Backend Implementation
- **Model Updates** (`be/models/user.model.ts`):
  - Extended role enum: `["user", "admin", "sales", "trainer", "frontdesk"]`

#### Frontend Implementation
- **Type Updates** (`fe/src/types/index.ts`):
  - Updated User role type to include new roles

#### Role Permissions

| Feature | Admin | Sales | Trainer | Front Desk |
|---------|-------|-------|---------|------------|
| Enquiries Expiring | ✅ Full | ✅ Full | ❌ | ❌ |
| PT Expiring | ✅ Full | ❌ | ✅ Own Clients | ❌ |
| Follow-Ups | ✅ Full | ✅ Own | ✅ Own | ❌ |
| Calendar | ✅ Full | ✅ View | ✅ View | ✅ View Only |
| Dashboard | ✅ Full | ✅ Limited | ✅ Limited | ✅ View Only |

---

## 📁 File Structure

### Backend Files Created/Modified
```
be/
├── models/
│   ├── user.model.ts (modified - added roles)
│   ├── enquiry.model.ts (modified - added expiry fields)
│   └── followUp.model.ts (new)
├── controllers/
│   ├── enquiry.expiry.controllers.ts (new)
│   ├── followUp.controllers.ts (new)
│   └── pt.expiry.controllers.ts (new)
├── routes/
│   ├── enquiry.routes.ts (modified - added expiry routes)
│   ├── followUp.routes.ts (new)
│   └── client.routes.ts (modified - added PT expiry routes)
└── index.ts (modified - registered follow-up routes)
```

### Frontend Files Created/Modified
```
fe/src/
├── types/
│   └── index.ts (modified - added FollowUp, PTExpiryData types, updated User roles)
├── hooks/
│   ├── useFollowUp.tsx (new)
│   ├── useEnquiryExpiry.tsx (new)
│   └── usePTExpiry.tsx (new)
├── components/
│   ├── dashboard/
│   │   ├── ExpiringEnquiriesCard.tsx (new)
│   │   ├── ExpiringPTCard.tsx (new)
│   │   └── UpcomingFollowUpsCard.tsx (new)
│   └── layout/
│       └── Sidebar.tsx (modified - added new navigation items)
├── pages/
│   └── admin/
│       ├── DashboardPage.tsx (modified - added new cards)
│       ├── EnquiriesExpiringPage.tsx (new)
│       ├── PTExpiringPage.tsx (new)
│       ├── FollowUpsPage.tsx (new)
│       ├── FollowUpFormPage.tsx (new)
│       └── CalendarPage.tsx (new)
└── App.tsx (modified - added new routes)
```

---

## 🚀 Usage Guide

### For Admins
1. **Dashboard**: View summary cards for all expiring items and follow-ups
2. **Enquiries Expiring**: Monitor and extend enquiry expiry dates
3. **PT Expiring**: Track PT packages and create follow-ups
4. **Follow-Ups**: Manage all follow-up tasks across the system
5. **Calendar**: Unified view of all scheduled items

### For Sales Staff
1. **Dashboard**: View enquiry-related metrics
2. **Enquiries Expiring**: Manage enquiry expiry
3. **Follow-Ups**: Track and complete assigned follow-ups
4. **Calendar**: View enquiries and follow-ups

### For Trainers
1. **Dashboard**: View PT-related metrics
2. **PT Expiring**: Monitor their clients' PT packages
3. **Follow-Ups**: Manage PT-related follow-ups
4. **Calendar**: View PT packages and follow-ups

### For Front Desk
1. **Calendar**: View-only access to see scheduled items
2. **Dashboard**: Basic metrics view

---

## 🔧 API Endpoints Summary

### Enquiry Expiry
- `GET /api/v1/enquiry/expiring?days=7` - Get expiring enquiries
- `PUT /api/v1/enquiry/:id/extend-expiry` - Extend expiry
- `POST /api/v1/enquiry/update-expiry-status` - Batch update (cron)

### PT Expiry
- `GET /api/v1/client/pt-expiring?days=7` - Get expiring PT packages
- `GET /api/v1/client/pt-expiring/by-trainer?days=7` - Group by trainer
- `GET /api/v1/client/:id/pt-status` - Get client PT status

### Follow-Ups
- `POST /api/v1/follow-up` - Create follow-up
- `GET /api/v1/follow-up` - Get all (with filters)
- `GET /api/v1/follow-up/upcoming` - Get upcoming
- `PUT /api/v1/follow-up/:id` - Update
- `PUT /api/v1/follow-up/:id/complete` - Mark complete
- `DELETE /api/v1/follow-up/:id` - Delete

---

## ✅ Testing Checklist

### Backend
- [ ] Test enquiry expiry calculation on save
- [ ] Test follow-up creation and status updates
- [ ] Test PT expiry calculation
- [ ] Test role-based filtering in controllers
- [ ] Test all API endpoints with Postman/Thunder Client

### Frontend
- [ ] Navigate to Dashboard - verify new cards appear
- [ ] Click "View All Expiring Enquiries" - verify navigation
- [ ] Test enquiry expiry extension
- [ ] Test PT expiring page with different filters
- [ ] Create a new follow-up
- [ ] Complete a follow-up from dashboard card
- [ ] View calendar and verify events appear
- [ ] Test navigation between months in calendar
- [ ] Verify role-based access (test with different user roles)

---

## 🎨 Design Consistency

All new features follow the existing design system:
- **Colors**: Orange (enquiries), Purple (PT), Blue (follow-ups), Red (expired)
- **Components**: Reuse existing Card, Button, Select components
- **Layout**: Consistent spacing, shadows, and hover effects
- **Icons**: Lucide React icons matching existing style
- **Responsive**: Mobile-friendly grid layouts

---

## 📝 Notes

1. **Automatic Updates**: Expiry status is calculated on every save via pre-save hooks
2. **Cron Jobs**: Consider setting up a cron job to call `/api/v1/enquiry/update-expiry-status` daily
3. **Notifications**: Future enhancement could add email/SMS notifications for expiring items
4. **Calendar Library**: Current implementation is custom; consider react-big-calendar for advanced features
5. **Performance**: For large datasets, implement pagination on list pages

---

## 🐛 Known Issues / Future Enhancements

- [ ] Add email notifications for expiring items
- [ ] Add SMS reminders for follow-ups
- [ ] Implement recurring follow-ups
- [ ] Add export functionality for reports
- [ ] Implement advanced calendar features (drag-and-drop, recurring events)
- [ ] Add analytics dashboard for conversion rates

---

**Last Updated**: 2025-11-04
**Version**: 1.0.0

