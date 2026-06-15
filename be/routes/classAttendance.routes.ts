import { Router } from 'express';
import {
    markClassAttendance,
    getSessionAttendance,
} from '../controllers/classAttendance.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const classAttendanceRouter = Router();

/**
 * @route   POST /api/v1/class-attendance/session/:sessionId
 * @desc    Mark attendance for a session (bulk)
 * @access  Trainer, Manager, Admin
 */
classAttendanceRouter.post('/session/:sessionId', authMiddleware, asyncHandler(markClassAttendance));

/**
 * @route   GET /api/v1/class-attendance/session/:sessionId
 * @desc    Get attendance records for a session
 * @access  Admin, Manager, Trainer
 */
classAttendanceRouter.get('/session/:sessionId', authMiddleware, asyncHandler(getSessionAttendance));

export default classAttendanceRouter;
