// routes/followUp.routes.ts
import { Router } from 'express';
import {
  createFollowUp,
  getAllFollowUps,
  getUpcomingFollowUps,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
} from '../controllers/followUp.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const followUpRouter = Router();

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
 * @access  Private (Admin, Sales, Trainer)
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

