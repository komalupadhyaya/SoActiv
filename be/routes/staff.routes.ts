// routes/staff.routes.ts

import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaffById,
  deleteStaffById,
  updateStaffProfile,
  approveStaffRequest,
  rejectStaffRequest,
} from '../controllers/staff.controllers';
import { bulkUploadStaff } from '../controllers/staff.bulk.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { bulkUpload } from '../middlewares/upload.middleware';
import { requireAdmin, requirePosition, requireAdminOrManager } from '../middlewares/permission.middleware';
import { checkGymStatus } from '../middlewares/checkGymStatus.middleware';
import { checkPlanLimit } from '../middlewares/checkPlanLimit.middleware';

const staffRouter = Router();

// Apply authentication and gym status check to all routes
staffRouter.use(authMiddleware);
staffRouter.use(checkGymStatus);

/**
 * @route   POST /api/v1/staff/bulk-upload
 * @desc    Bulk upload staff via CSV or XML
 * @access  Private (Admin Only)
 */
staffRouter.post('/bulk-upload', requireAdmin(), bulkUpload.single('file'), bulkUploadStaff);

/**
 * @route   POST /api/staff
 * @desc    Create a new staff member (user-owned)
 * @access  Private (Admin + Manager)
 */
staffRouter.post('/', requireAdminOrManager(), checkPlanLimit('staff'), createStaff);

/**
 * @route   GET /api/staff
 * @desc    Get all staff members for logged-in user (with optional filters)
 * @access  Private (Admin + Manager)
 */
staffRouter.get('/', requirePosition(['admin', 'manager', 'receptionist']), getAllStaff);

/**
 * @route   GET /api/staff/:id
 * @desc    Get a single staff member by ID (must belong to user)
 * @access  Private (Admin + Manager)
 * Note: Trainer seeing self is handled by separate profile route or lenient check if needed, 
 * but for "Staff Management" usually Admin/Manager.
 */
staffRouter.get('/:id', requirePosition(['admin', 'manager']), getStaffById);

/**
 * @route   PUT /api/staff/:id
 * @desc    Update a staff member (must belong to user)
 * @access  Private (Admin + Manager)
 */
staffRouter.put('/:id', requireAdminOrManager(), updateStaffById);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete a staff member (must belong to user)
 * @access  Private (Admin + Manager)
 */
staffRouter.delete('/:id', requireAdminOrManager(), deleteStaffById);

/**
 * @route   PATCH /api/staff/:id/approve
 * @desc    Approve a staff CRUD request
 * @access  Private (Admin Only)
 */
staffRouter.patch('/:id/approve', requireAdmin(), approveStaffRequest);

/**
 * @route   PATCH /api/staff/:id/reject
 * @desc    Reject a staff CRUD request
 * @access  Private (Admin Only)
 */
staffRouter.patch('/:id/reject', requireAdmin(), rejectStaffRequest);

import upload from '../middlewares/upload.middleware';

/**
 * @route   PATCH /api/staff/update-profile
 * @desc    Update logged-in staff's profile (Avatar, Password, Details)
 * @access  Private (Any Staff)
 */
staffRouter.patch(
  '/update-profile',
  upload.single('avatar'),
  updateStaffProfile
);

export default staffRouter;