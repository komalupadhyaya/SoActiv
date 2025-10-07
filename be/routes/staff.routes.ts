// routes/staff.routes.ts

import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaffById,
  deleteStaffById,
} from '../controllers/staff.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';

const staffRouter = Router();

/**
 * @route   POST /api/staff
 * @desc    Create a new staff member (user-owned)
 * @access  Private
 */
staffRouter.post('/', authMiddleware, createStaff);

/**
 * @route   GET /api/staff
 * @desc    Get all staff members for logged-in user (with optional filters)
 * @access  Private
 */
staffRouter.get('/', authMiddleware, getAllStaff);

/**
 * @route   GET /api/staff/:id
 * @desc    Get a single staff member by ID (must belong to user)
 * @access  Private
 */
staffRouter.get('/:id', authMiddleware, getStaffById);

/**
 * @route   PUT /api/staff/:id
 * @desc    Update a staff member (must belong to user)
 * @access  Private
 */
staffRouter.put('/:id', authMiddleware, updateStaffById);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete a staff member (must belong to user)
 * @access  Private
 */
staffRouter.delete('/:id', authMiddleware, deleteStaffById);

export default staffRouter;