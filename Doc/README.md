# SoActiv — Project Documentation

> **SoActiv** is a full-stack, multi-tenant SaaS platform for gym management. It supports multiple gyms (tenants), each with their own admin, staff, and members — all governed from a single central Super Admin panel.

---

## 📁 Documentation Structure

```
Doc/
├── README.md                      ← This file (project overview & index)
├── ARCHITECTURE.md                ← Tech stack, system design, data flow
├── API_REFERENCE.md               ← All backend API endpoints
│
├── SuperAdmin/
│   └── README.md                  ← Super Admin role documentation
│
├── Admin/
│   └── README.md                  ← Gym Admin/Owner role documentation
│
├── Manager/
│   └── README.md                  ← Manager role documentation
│
├── Trainer/
│   └── README.md                  ← Trainer role documentation
│
├── Sales/
│   └── README.md                  ← Sales staff role documentation
│
├── Receptionist/
│   └── README.md                  ← Receptionist staff role documentation
│
├── Cleaner/
│   └── README.md                  ← Cleaner staff role documentation
│
└── Member/
    └── README.md                  ← Gym Member (client) documentation
```

---

## 🏛️ What is SoActiv?

SoActiv is a gym management SaaS application that helps gym owners digitize and automate their entire operations — from lead capture to member check-in, PT session logging, nutrition tracking, class scheduling, and monthly revenue reports.

### Key Capabilities

| Domain | Features |
|--------|----------|
| **SaaS Management** | Multi-tenant gyms, billing plans, feature flags, audit logs |
| **Member Management** | Registration, profiles, membership plans, check-in, attendance matrix |
| **CRM / Enquiries** | Lead capture, status pipeline, follow-up tasks, conversion tracking |
| **Personal Training** | PT plans, trainer assignment, session logging, expiry alerts |
| **Staff Management** | Role-based employee profiles, attendance, salary, permissions |
| **Nutrition & Fitness** | Trainer-assigned diet plans, meal logging, fitness goals, progress photos |
| **Class Scheduling** | Gym class management, timetables, member and staff booking |
| **Cleaning Management** | Task assignment and checklist tracking for cleaner staff |
| **Analytics** | Revenue reports, member statistics, attendance trends |
| **Announcements** | Gym-wide notices for staff and/or members |
| **Member Portal** | Self-service dashboard: attendance, nutrition, goals, support |

---

## 👥 Roles Overview

| Role | DB Value | Access Level | Portal URL |
|------|----------|-------------|------------|
| **Super Admin** | `superadmin` | Full SaaS control — all gyms | `/super-admin/` |
| **Admin** | `admin` | Full gym control — their gym only | `/admin/` |
| **Manager** | `staff` / `manager` | Staff & member oversight, CRM | `/staff/` |
| **Trainer** | `staff` / `trainer` | Own PT clients, sessions, nutrition | `/staff/` |
| **Sales** | `staff` / `sales` | Leads, enquiries, follow-ups | `/staff/` |
| **Receptionist** | `staff` / `receptionist` | Check-in, class booking, enquiries | `/staff/` |
| **Cleaner** | `staff` / `cleaner` | Assigned cleaning tasks only | `/staff/` |
| **Member** | `member` | Personal self-service portal | `/member/` |

---

## 🛠️ Quick Start for Developers

### Prerequisites
- **Bun** v1.2.5+ — [Install](https://bun.sh)
- **Node.js** v18+
- **MongoDB** running locally or in cloud

### Setup
```bash
# 1. Clone and install backend
cd SoActiv/be
bun install

# 2. Configure environment
# Create be/.env with the values below

# 3. One-time migration (adds SaaS fields to existing gyms)
bun run utils/migrateSaaSFields.ts

# 4. Create first Super Admin (run once)
bun run utils/createSuperAdmin.ts

# 5. Start backend
bun run dev              # Runs at http://localhost:8000

# 6. Start frontend (in another terminal)
cd ../fe
npm install
npm run dev              # Runs at http://localhost:5173
```

### Environment Variables (`be/.env`)
```env
PORT=8000
CORS_ORIGIN="http://localhost:5173"
MONGODB_URI="mongodb://127.0.0.1:27017/soActive"
ACCESS_TOKEN_SECRET="your-secret-jwt-key"
NODE_ENV="development"

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary (for progress photo uploads)
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret
```

> **Important:** The `createSuperAdmin.ts` script passes the raw password string — do **not** pre-hash it manually. The Mongoose `pre("save")` hook hashes it automatically. Manual pre-hashing causes a double-hash bug that breaks login.

---

## 📖 Read More

- [Architecture & Technical Design](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Super Admin Guide](./SuperAdmin/README.md)
- [Admin Guide](./Admin/README.md)
- [Manager Guide](./Manager/README.md)
- [Trainer Guide](./Trainer/README.md)
- [Sales Guide](./Sales/README.md)
- [Receptionist Guide](./Receptionist/README.md)
- [Cleaner Guide](./Cleaner/README.md)
- [Member Guide](./Member/README.md)
