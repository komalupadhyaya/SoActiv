import { Router } from 'express';
import {
    generateSessions,
    getSessionsByClass,
    getUpcomingSessions,
    getSessionById,
    cancelSession,
    updateSessionNotes,
    getAllSessions,
} from '../controllers/classSession.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminOrManager } from '../middlewares/permission.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const classSessionRouter = Router();

/**
 * @route   GET /api/v1/class-sessions/upcoming
 * @desc    Get upcoming sessions (for member booking view)
 * @access  Member, Admin, Manager
 */
classSessionRouter.get('/upcoming', authMiddleware, asyncHandler(getUpcomingSessions));

/**
 * @route   GET /api/v1/class-sessions/by-class/:classId
 * @desc    Get all sessions for a class
 * @access  Admin, Manager, Trainer
 */
classSessionRouter.get('/by-class/:classId', authMiddleware, asyncHandler(getSessionsByClass));

/**
 * @route   POST /api/v1/class-sessions/generate/:classId
 * @desc    Generate recurring sessions for a class
 * @access  Admin, Manager
 */
classSessionRouter.post('/generate/:classId', authMiddleware, requireAdminOrManager(), asyncHandler(generateSessions));

/**
 * @route   GET /api/v1/class-sessions
 * @desc    Get all sessions for the gym
 * @access  Admin, Manager
 */
classSessionRouter.get('/', authMiddleware, requireAdminOrManager(), asyncHandler(getAllSessions));

/**
 * @route   GET /api/v1/class-sessions/:sessionId
 * @desc    Get a specific session
 * @access  Admin, Manager, Trainer
 */
classSessionRouter.get('/:sessionId', authMiddleware, asyncHandler(getSessionById));

/**
 * @route   PATCH /api/v1/class-sessions/:sessionId/cancel
 * @desc    Cancel a session
 * @access  Admin, Manager, Trainer
 */
classSessionRouter.patch('/:sessionId/cancel', authMiddleware, asyncHandler(cancelSession));

/**
 * @route   PATCH /api/v1/class-sessions/:sessionId/notes
 * @desc    Update session notes
 * @access  Trainer, Manager, Admin
 */
classSessionRouter.patch('/:sessionId/notes', authMiddleware, asyncHandler(updateSessionNotes));

export default classSessionRouter;
