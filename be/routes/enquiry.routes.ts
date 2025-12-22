// routes/enquiryRoutes.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createEnquiry,
  createPublicEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiriesByUser,
  assignStaffToEnquiry,
} from '../controllers/enquiry.controllers';
import { bulkUploadEnquiries } from '../controllers/enquiry.bulk.controllers';
import {
  getExpiringEnquiries,
  extendEnquiryExpiry,
  updateEnquiryExpiryStatus,
} from '../controllers/enquiry.expiry.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { bulkUpload } from '../middlewares/upload.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const enquiryRouter = Router();

// Rate limiter for public enquiries: 5 requests per 15 minutes per IP
const publicEnquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many enquiries from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/enquiries/bulk-upload
 * @desc    Bulk upload enquiries from CSV or XML file
 * @access  Private
 */
enquiryRouter.post('/bulk-upload', authMiddleware, bulkUpload.single('file'), bulkUploadEnquiries);

/**
 * @route   POST /api/enquiries/update-expiry-status
 * @desc    Batch update expiry status for all enquiries
 * @access  Private (Admin only)
 * @note    Must come before /:id routes to avoid matching "update-expiry-status" as an ID
 */
enquiryRouter.post('/update-expiry-status', authMiddleware, asyncHandler(updateEnquiryExpiryStatus));

/**
 * @route   GET /api/enquiries/expiring
 * @desc    Get all enquiries that are expiring soon or already expired
 * @access  Private (Admin, Sales)
 * @note    Must come before /:id routes to avoid matching "expiring" as an ID
 */
enquiryRouter.get('/expiring', authMiddleware, asyncHandler(getExpiringEnquiries));

/**
 * @route   GET /api/enquiries/my
 * @desc    Get all enquiries created by the logged-in user
 * @access  Private
 * @note    Must come before /:id routes to avoid matching "my" as an ID
 */
enquiryRouter.get('/my', authMiddleware, getEnquiriesByUser);

/**
 * @route   POST /api/enquiries
 * @desc    Create a new enquiry (authenticated user)
 * @access  Private
 */
enquiryRouter.post('/', authMiddleware, createEnquiry);
enquiryRouter.post('/public', publicEnquiryLimiter, createPublicEnquiry);

/**
 * @route   GET /api/enquiries
 * @desc    Get all enquiries (admin or manager level filtering)
 * @access  Private
 */
enquiryRouter.get('/', authMiddleware, getEnquiries);

/**
 * @route   PUT /api/enquiries/:id/extend-expiry
 * @desc    Extend the expiry date of an enquiry
 * @access  Private (Admin, Sales)
 */
enquiryRouter.put('/:id/extend-expiry', authMiddleware, asyncHandler(extendEnquiryExpiry));

/**
 * @route   PATCH /api/enquiries/:id/assign
 * @desc    Assign a staff member to an enquiry
 * @access  Private
 */
enquiryRouter.patch('/:id/assign', authMiddleware, assignStaffToEnquiry);

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

export default enquiryRouter;