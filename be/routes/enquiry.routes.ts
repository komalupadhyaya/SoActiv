// routes/enquiryRoutes.ts
import { Router } from 'express';
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiriesByUser,
  assignStaffToEnquiry,
} from '../controllers/enquiry.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';

const enquiryRouter = Router();

/**
 * @route   POST /api/enquiries
 * @desc    Create a new enquiry (authenticated user)
 * @access  Private
 */
enquiryRouter.post('/', authMiddleware, createEnquiry);

/**
 * @route   GET /api/enquiries
 * @desc    Get all enquiries (admin or manager level filtering)
 * @access  Private
 */
enquiryRouter.get('/', authMiddleware, getEnquiries);

/**
 * @route   GET /api/enquiries/my
 * @desc    Get all enquiries created by the logged-in user
 * @access  Private
 */
enquiryRouter.get('/my', authMiddleware, getEnquiriesByUser);

/**
 * @route   GET /api/enquiries/:id
 * @desc    Get a single enquiry by ID
 * @access  Private
 */
enquiryRouter.get('/:id', authMiddleware, getEnquiryById);

/**
 * @route   PUT /api/enquiries/:id
 * @desc    Update an enquiry (by ID)
 * @access  Private
 */
enquiryRouter.put('/:id', authMiddleware, updateEnquiry);

/**
 * @route   DELETE /api/enquiries/:id
 * @desc    Delete an enquiry (hard delete)
 * @access  Private
 */
enquiryRouter.delete('/:id', authMiddleware, deleteEnquiry);

/**
 * @route   PATCH /api/enquiries/:id/assign
 * @desc    Assign a staff member to an enquiry
 * @access  Private
 */
enquiryRouter.patch('/:id/assign', authMiddleware, assignStaffToEnquiry);

export default enquiryRouter;