import { Router } from 'express';
import {
    createScheduleEvent,
    getAllScheduleEvents,
    getMySchedule,
    updateScheduleEvent,
    completeScheduleEvent,
    deleteScheduleEvent,
    checkHoliday
} from '../controllers/schedule.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminOrManager, requirePosition } from '../middlewares/permission.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const scheduleRouter = Router();

/**
 * @route   GET /api/v1/schedule/holiday-check
 * @desc    Check if a date has a holiday
 * @access  Private
 */
scheduleRouter.get('/holiday-check', authMiddleware, asyncHandler(checkHoliday));

/**
 * @route   GET /api/v1/schedule/my-schedule
 * @desc    Get schedule events assigned to logged-in staff
 * @access  Private (Staff only)
 * @note    Must come before /:id routes
 */
scheduleRouter.get('/my-schedule', authMiddleware, asyncHandler(getMySchedule));

/**
 * @route   POST /api/v1/schedule
 * @desc    Create a new schedule event
 * @access  Private (Admin, Manager, Receptionist)
 */
scheduleRouter.post('/', authMiddleware, requirePosition(['manager', 'receptionist']), asyncHandler(createScheduleEvent));

/**
 * @route   GET /api/v1/schedule
 * @desc    Get all schedule events (with RBAC filtering)
 * @access  Private
 */
scheduleRouter.get('/', authMiddleware, asyncHandler(getAllScheduleEvents));

/**
 * @route   PUT /api/v1/schedule/:id/complete
 * @desc    Mark schedule event as completed
 * @access  Private (Assigned staff)
 */
scheduleRouter.put('/:id/complete', authMiddleware, asyncHandler(completeScheduleEvent));

/**
 * @route   PUT /api/v1/schedule/:id
 * @desc    Update a schedule event
 * @access  Private (Admin, Manager only)
 */
scheduleRouter.put('/:id', authMiddleware, requirePosition(['manager', 'receptionist']), asyncHandler(updateScheduleEvent));

/**
 * @route   DELETE /api/v1/schedule/:id
 * @desc    Delete a schedule event
 * @access  Private (Admin, Manager only)
 */
scheduleRouter.delete('/:id', authMiddleware, requireAdminOrManager(), asyncHandler(deleteScheduleEvent));

export default scheduleRouter;
