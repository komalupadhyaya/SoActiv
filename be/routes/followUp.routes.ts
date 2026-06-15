// routes/followUp.routes.ts
import { Router } from 'express';
import {
  createFollowUp,
  getAllFollowUps,
  getUpcomingFollowUps,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
  // Staff-specific endpoints
  getMyFollowUps,
  updateFollowUpStatus,
  completeFollowUpWithNotes,
  failFollowUp,
  rescheduleFollowUp,
  approveReschedule,
  rejectReschedule,
} from '../controllers/followUp.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const followUpRouter = Router();

/**
 * ============================================================
 * STAFF-SPECIFIC ROUTES (must come before generic routes)
 * ============================================================
 */

/**
 * @route   GET /api/v1/follow-up/my-tasks
 * @desc    Get follow-ups assigned to logged-in staff
 * @access  Private (Staff)
 */
followUpRouter.get('/my-tasks', authMiddleware, asyncHandler(getMyFollowUps));

/**
 * @route   PUT /api/v1/follow-up/:id/status
 * @desc    Update follow-up status (staff can only update their own)
 * @access  Private (Staff)
 */
followUpRouter.put('/:id/status', authMiddleware, asyncHandler(updateFollowUpStatus));

/**
 * @route   PUT /api/v1/follow-up/:id/complete-with-notes
 * @desc    Mark follow-up as completed with notes
 * @access  Private (Staff)
 */
followUpRouter.put('/:id/complete-with-notes', authMiddleware, asyncHandler(completeFollowUpWithNotes));

/**
 * @route   PUT /api/v1/follow-up/:id/fail
 * @desc    Mark follow-up as failed with reason
 * @access  Private (Staff)
 */
followUpRouter.put('/:id/fail', authMiddleware, asyncHandler(failFollowUp));

/**
 * @route   PUT /api/v1/follow-up/:id/reschedule
 * @desc    Reschedule a follow-up (Staff requests proposed reschedule)
 * @access  Private (Staff)
 */
followUpRouter.put('/:id/reschedule', authMiddleware, asyncHandler(rescheduleFollowUp));

/**
 * @route   PUT /api/v1/follow-up/:id/approve-reschedule
 * @desc    Approve a follow-up reschedule request (Admin only)
 * @access  Private (Admin)
 */
followUpRouter.put('/:id/approve-reschedule', authMiddleware, asyncHandler(approveReschedule));

/**
 * @route   PUT /api/v1/follow-up/:id/reject-reschedule
 * @desc    Reject a follow-up reschedule request (Admin only)
 * @access  Private (Admin)
 */
followUpRouter.put('/:id/reject-reschedule', authMiddleware, asyncHandler(rejectReschedule));

/**
 * ============================================================
 * GENERAL ROUTES
 * ============================================================
 */

/**
 * @route   GET /api/v1/follow-up/upcoming
 * @desc    Get upcoming follow-ups (today and next 7 days)
 * @access  Private
 * @note    Must come before /:id routes to avoid matching "upcoming" as an ID
 */
followUpRouter.get('/upcoming', authMiddleware, asyncHandler(getUpcomingFollowUps));

/**
 * @route   POST /api/v1/follow-up
 * @desc    Create a new follow-up
 * @access  Private (Admin, Manager)
 */
followUpRouter.post('/', authMiddleware, asyncHandler(createFollowUp));

/**
 * @route   GET /api/v1/follow-up
 * @desc    Get all follow-ups (with filters)
 * @access  Private
 */
followUpRouter.get('/', authMiddleware, asyncHandler(getAllFollowUps));

/**
 * @route   PUT /api/v1/follow-up/:id/complete
 * @desc    Mark a follow-up as completed
 * @access  Private
 */
followUpRouter.put('/:id/complete', authMiddleware, asyncHandler(completeFollowUp));

/**
 * @route   PUT /api/v1/follow-up/:id
 * @desc    Update a follow-up
 * @access  Private
 */
followUpRouter.put('/:id', authMiddleware, asyncHandler(updateFollowUp));

/**
 * @route   DELETE /api/v1/follow-up/:id
 * @desc    Delete a follow-up
 * @access  Private (Admin only)
 */
followUpRouter.delete('/:id', authMiddleware, asyncHandler(deleteFollowUp));

export default followUpRouter;
