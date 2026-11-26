# Staff Permission Rules

This document outlines the permission structure for the SoActiv Staff Portal.

## Roles vs Positions
- **Admin**: Full access to their gym.
- **Staff**: Restricted access based on `position`.
    - Positions: `manager`, `trainer`, `sales`, `receptionist`, `cleaner`.

## Permission Matrix

| Feature | Manager | Trainer | Sales | Receptionist | Cleaner |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Staff Management** | Request Approval | ❌ | ❌ | ❌ | ❌ |
| **Member Management** | View Only | View Assigned | View Leads | Check-in Only | ❌ |
| **Gym Schedule** | View | View Own | ❌ | View | ❌ |
| **Attendance** | Mark (All) | Mark (Self) | Mark (Self) | Mark (Self) | Mark (Self) |
| **Payments/Salary** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Tasks** | Manage | ❌ | View Own | ❌ | View Own |
| **Cleaning** | ❌ | ❌ | ❌ | ❌ | Mark Done |

## Detailed Rules

### 1. MANAGER
- **Can**:
    - View staff under their admin.
    - Request to Create, Edit, or Delete staff (requires Admin approval).
    - View attendance of all staff.
    - View members list.
    - Help admin manage tasks.
    - Mark attendance for staff.
- **Cannot**:
    - Add, Edit, or Delete staff directly without Admin approval.
    - Access payment or salary pages.

### 2. TRAINER
- **Can**:
    - View own assigned members.
    - View own schedule.
    - Mark self-attendance.
    - View/Create workout plans.
- **Cannot**:
    - View other staff data.
    - Access member CRUD.

### 3. SALES
- **Can**:
    - View assigned leads.
    - Add notes to leads.
    - View own tasks.
- **Cannot**:
    - Access staff or member global lists.
    - Access payments.

### 4. RECEPTIONIST
- **Can**:
    - View member list.
    - Mark member check-in/out.
    - View class schedules.
    - Manage Enquiries.
    - Manage Class Bookings.
    - Register Complaints.
    - View Announcements.
- **Cannot**:
    - Edit schedules.
    - CRUD members.
    - Manage Staff.
    - Access Payments/Salary.
    - Create Classes.
    - View Reports/Attendance Reports.

#### Receptionist Access Matrix

| Feature | Access |
| :--- | :---: |
| Member Check-In | ✅ |
| Member List | View Only |
| Member CRUD | ❌ |
| Staff Management | ❌ |
| Payments | ❌ |
| Salary | ❌ |
| Enquiries | ✅ |
| Follow-Ups | Limited |
| Class Bookings | ✅ |
| Class Creation | ❌ |
| Complaint Registration | ✅ |
| Announcements | View Only |
| Reports | ❌ |
| Attendance Reports | ❌ |

#### Example Workflows

##### Member Entry
```
Member Arrives
      ↓
Receptionist scans QR
      ↓
Attendance Marked
      ↓
Dashboard updated
```

##### Walk-In Lead
```
Prospect visits gym
       ↓
Receptionist creates enquiry
       ↓
Assigned to Sales
       ↓
Sales follow-up scheduled
```

##### Complaint
```
Member reports issue
       ↓
Receptionist logs complaint
       ↓
Manager reviews
       ↓
Resolved or escalated
```


### 5. CLEANER
- **Can**:
    - View assigned cleaning tasks.
    - Mark tasks completed.
- **Cannot**:
    - Access any member or staff data.

## Technical Implementation
- **Middleware**: `requirePosition(['manager', 'trainer'])` enforces route access.
- **Data Isolation**: All queries must filter by `createdBy` (Admin ID) or `assignedTo` (Staff ID).
