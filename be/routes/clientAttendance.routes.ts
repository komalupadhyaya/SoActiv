// routes/clientAttendance.routes.ts

import { Router } from 'express';
import {
    memberCheckIn,
    memberCheckOut,
    getMyAttendance,
    getMyMonthlyAttendance,
    getClientAttendanceByAdmin,
    markClientAttendanceByStaff,
    getTodayAttendanceLogs,
} from '../controllers/clientAttendance.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin, requireAdminOrManager, requirePosition } from '../middlewares/permission.middleware';
import { checkGymFeature } from '../middlewares/featureFlag.middleware';

const clientAttendanceRouter = Router();

// GET /api/v1/client-attendance/today-logs
clientAttendanceRouter.get(
    '/today-logs',
    authMiddleware,
    checkGymFeature('attendance'),
    requirePosition(['manager', 'receptionist']),
    getTodayAttendanceLogs
);


// ── Member-only Routes ──────────────────────────────────────────────────────

// POST /api/v1/client-attendance/check-in
// Member records their daily gym entry
clientAttendanceRouter.post('/check-in', authMiddleware, checkGymFeature('attendance'), memberCheckIn);

// POST /api/v1/client-attendance/check-out
// Member records their gym exit (also computes duration via pre-save hook)
clientAttendanceRouter.post('/check-out', authMiddleware, checkGymFeature('attendance'), memberCheckOut);

// GET /api/v1/client-attendance/my
// Member fetches their complete attendance history
clientAttendanceRouter.get('/my', authMiddleware, checkGymFeature('attendance'), getMyAttendance);

// GET /api/v1/client-attendance/my/month?month=5&year=2026
// Member fetches current or specified month's attendance summary
clientAttendanceRouter.get('/my/month', authMiddleware, checkGymFeature('attendance'), getMyMonthlyAttendance);

// ── Admin/Staff Routes ───────────────────────────────────────────────────────

// GET /api/v1/client-attendance/client/:clientId
// Admin or Manager views attendance for a specific member
clientAttendanceRouter.get(
    '/client/:clientId',
    authMiddleware,
    checkGymFeature('attendance'),
    requireAdminOrManager(),
    getClientAttendanceByAdmin
);

// POST /api/v1/client-attendance/mark
// Staff marks check-in or check-out for a member
clientAttendanceRouter.post(
    '/mark',
    authMiddleware,
    checkGymFeature('attendance'),
    requirePosition(['manager', 'receptionist']),
    markClientAttendanceByStaff
);

export default clientAttendanceRouter;
