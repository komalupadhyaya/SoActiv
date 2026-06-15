import { Router } from 'express';
import {
    bookSession,
    cancelBooking,
    getMyBookings,
    getSessionBookings,
    selfCheckIn,
    staffBookSession,
} from '../controllers/classBooking.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePosition } from '../middlewares/permission.middleware';
import { asyncHandler } from '../lib/AsyncHandler';

const classBookingRouter = Router();

/**
 * @route   GET /api/v1/class-bookings/my-bookings
 * @desc    Get member's own bookings
 * @access  Member
 */
classBookingRouter.get('/my-bookings', authMiddleware, asyncHandler(getMyBookings));

/**
 * @route   GET /api/v1/class-bookings/session/:sessionId
 * @desc    Get all bookings for a session (staff view)
 * @access  Admin, Manager, Trainer
 */
classBookingRouter.get('/session/:sessionId', authMiddleware, asyncHandler(getSessionBookings));

/**
 * @route   POST /api/v1/class-bookings
 * @desc    Book a session slot
 * @access  Member
 */
classBookingRouter.post('/', authMiddleware, asyncHandler(bookSession));

/**
 * @route   PATCH /api/v1/class-bookings/:bookingId/cancel
 * @desc    Cancel a booking
 * @access  Member
 */
classBookingRouter.patch('/:bookingId/cancel', authMiddleware, asyncHandler(cancelBooking));

/**
 * @route   PATCH /api/v1/class-bookings/:bookingId/check-in
 * @desc    Self check-in (within 60 minutes of class start)
 * @access  Member
 */
classBookingRouter.patch('/:bookingId/check-in', authMiddleware, asyncHandler(selfCheckIn));

/**
 * @route   POST /api/v1/class-bookings/staff-book
 * @desc    Book a slot for a member by staff (restricted to receptionist position)
 * @access  Staff (Receptionist)
 */
classBookingRouter.post(
    '/staff-book',
    authMiddleware,
    requirePosition(['receptionist']),
    asyncHandler(staffBookSession)
);

export default classBookingRouter;
