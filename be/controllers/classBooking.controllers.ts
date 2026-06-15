import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ClassSession } from '../models/classSession.model';
import { ClassBooking } from '../models/classBooking.model';
import { Client } from '../models/client.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';
import { createNotification } from '../utils/notification.helper';

/**
 * @desc    Book a session (Member only) — atomically prevents overbooking
 * @route   POST /api/v1/class-bookings
 * @access  Member
 */
export const bookSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.body;
        const user = (req as any).user;
        const userId = user.id;
        const gymId = user.gym;

        if (!sessionId) throw new ApiError(HttpStatusCode.BAD_REQUEST, 'sessionId is required');

        // Find the member's client record by their user email
        const { User } = await import('../models/user.model');
        const memberUser = await User.findById(userId).select('email');
        if (!memberUser) throw new ApiError(HttpStatusCode.NOT_FOUND, 'User account not found');

        const clientRecord = await Client.findOne({ email: memberUser.email.toLowerCase() });
        if (!clientRecord) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Member client record not found');

        // Check for existing active booking in this session
        const existingBooking = await ClassBooking.findOne({
            sessionId: new Types.ObjectId(sessionId),
            userId: new Types.ObjectId(userId),
            status: { $in: ['booked', 'checked_in'] },
        });
        if (existingBooking) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'You are already booked into this session');
        }

        // Atomically increment bookedCount only if capacity is not exceeded (overbooking guard)
        const session = await ClassSession.findOneAndUpdate(
            {
                _id: new Types.ObjectId(sessionId),
                gymId: new Types.ObjectId(gymId),
                status: 'scheduled',
                $expr: { $lt: ['$bookedCount', '$capacity'] },
            },
            { $inc: { bookedCount: 1 } },
            { new: true }
        ).populate('classId', 'name adminId');

        if (!session) {
            const rawSession = await ClassSession.findById(sessionId);
            if (!rawSession) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Session not found');
            if (rawSession.status !== 'scheduled') throw new ApiError(HttpStatusCode.BAD_REQUEST, 'This session is not available for booking');
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'This session is fully booked');
        }

        const classData = session.classId as any;
        const adminId = classData?.adminId || session.adminId;

        // Create booking record
        const booking = await ClassBooking.create({
            sessionId: session._id,
            classId: session.classId,
            memberId: clientRecord._id,
            userId: new Types.ObjectId(userId),
            adminId: adminId,
            gymId: new Types.ObjectId(gymId),
            status: 'booked',
            bookedAt: new Date(),
        });

        res.status(201).json({ success: true, data: booking, message: `Booking confirmed! See you in class 🎉` });

        // Send confirmation notification
        try {
            const className = classData?.name || 'Class';
            const sessionDate = session.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            await createNotification({
                recipientId: new Types.ObjectId(userId),
                recipientRole: 'member',
                gymId,
                type: 'class_booking_confirmed',
                title: `✅ Class Booking Confirmed`,
                message: `Your slot for ${className} on ${sessionDate} at ${session.time} has been confirmed.`,
                link: '/member/classes',
                metadata: { bookingId: (booking as any)._id.toString(), sessionId },
            });
        } catch (err) {
            console.error('[ClassBooking] Confirmation notification failed:', err);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel a booking (Member cancels their own booking)
 * @route   PATCH /api/v1/class-bookings/:bookingId/cancel
 * @access  Member
 */
export const cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId } = req.params;
        const user = (req as any).user;
        const userId = user.id;

        const booking = await ClassBooking.findOne({
            _id: new Types.ObjectId(bookingId),
            userId: new Types.ObjectId(userId),
        });
        if (!booking) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Booking not found');
        if (booking.status === 'cancelled') throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Booking already cancelled');

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();

        // Decrement bookedCount on the session
        await ClassSession.findByIdAndUpdate(booking.sessionId, {
            $inc: { bookedCount: -1 },
        });

        res.status(200).json({ success: true, message: 'Booking cancelled', data: booking });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get member's own bookings
 * @route   GET /api/v1/class-bookings/my-bookings
 * @access  Member
 */
export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const userId = user.id;
        const { status, upcoming } = req.query;

        const filter: any = { userId: new Types.ObjectId(userId) };
        if (status) filter.status = status;

        let bookings = await ClassBooking.find(filter)
            .populate({
                path: 'sessionId',
                select: 'date time endTime status notes',
            })
            .populate('classId', 'name description color durationMinutes')
            .sort({ bookedAt: -1 });

        // Filter upcoming if requested
        if (upcoming === 'true') {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            
            bookings = bookings.filter((b: any) => {
                const session = b.sessionId;
                if (!session || !session.date) return false;
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);
                return sessionDate >= todayStart && session.status === 'scheduled';
            });
        }

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all bookings for a session (Admin/Manager/Trainer view)
 * @route   GET /api/v1/class-bookings/session/:sessionId
 * @access  Admin, Manager, Trainer
 */
export const getSessionBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const bookings = await ClassBooking.find({
            sessionId: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
            status: { $ne: 'cancelled' },
        })
            .populate('memberId', 'fullName email contactNumber')
            .populate('userId', 'name email avatar')
            .sort({ bookedAt: 1 });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Member self check-in (within 30 minutes of session start)
 * @route   PATCH /api/v1/class-bookings/:bookingId/check-in
 * @access  Member
 */
export const selfCheckIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bookingId } = req.params;
        const user = (req as any).user;
        const userId = user.id;

        const booking = await ClassBooking.findOne({
            _id: new Types.ObjectId(bookingId),
            userId: new Types.ObjectId(userId),
            status: 'booked',
        }).populate('sessionId', 'date time status');

        if (!booking) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Active booking not found');

        const session = booking.sessionId as any;
        if (!session || session.status === 'cancelled') {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Session is not available');
        }

        // Allow check-in within 60 minutes before class start
        const now = new Date();
        const [h, m] = session.time.split(':').map(Number);
        const sessionStart = new Date(session.date);
        sessionStart.setHours(h, m, 0, 0);

        const diffMinutes = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
        if (diffMinutes > 60) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, `Check-in opens 60 minutes before class start. Class starts at ${session.time}`);
        }
        if (diffMinutes < -30) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Check-in window has passed. Class has ended');
        }

        booking.status = 'checked_in';
        booking.checkInAt = now;
        await booking.save();

        res.status(200).json({ success: true, data: booking, message: 'Checked in successfully! ✅' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Book a session for a member (Receptionist/Staff booking on behalf of member)
 * @route   POST /api/v1/class-bookings/staff-book
 * @access  Staff (Receptionist)
 */
export const staffBookSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId, memberId } = req.body;
        const user = (req as any).user;
        const gymId = user.gym;

        if (!sessionId) throw new ApiError(HttpStatusCode.BAD_REQUEST, 'sessionId is required');
        if (!memberId) throw new ApiError(HttpStatusCode.BAD_REQUEST, 'memberId is required');

        // Find the client record
        const clientRecord = await Client.findOne({ _id: new Types.ObjectId(memberId) });
        if (!clientRecord) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Member client record not found');

        // Find corresponding user account by email to get their userId
        const { User } = await import('../models/user.model');
        const memberUser = await User.findOne({ email: clientRecord.email.toLowerCase() }).select('_id');
        if (!memberUser) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Member user account not found');

        // Check for existing active booking
        const existingBooking = await ClassBooking.findOne({
            sessionId: new Types.ObjectId(sessionId),
            memberId: clientRecord._id,
            status: { $in: ['booked', 'checked_in'] },
        });
        if (existingBooking) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Member is already booked into this session');
        }

        // Atomically increment bookedCount only if capacity is not exceeded
        const session = await ClassSession.findOneAndUpdate(
            {
                _id: new Types.ObjectId(sessionId),
                gymId: new Types.ObjectId(gymId),
                status: 'scheduled',
                $expr: { $lt: ['$bookedCount', '$capacity'] }, // overbooking guard
            },
            { $inc: { bookedCount: 1 } },
            { new: true }
        ).populate('classId', 'name adminId');

        if (!session) {
            const rawSession = await ClassSession.findById(sessionId);
            if (!rawSession) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Session not found');
            if (rawSession.status !== 'scheduled') throw new ApiError(HttpStatusCode.BAD_REQUEST, 'This session is not available for booking');
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'This session is fully booked');
        }

        const classData = session.classId as any;
        const adminId = classData?.adminId || session.adminId;

        // Create booking record
        const booking = await ClassBooking.create({
            sessionId: session._id,
            classId: session.classId,
            memberId: clientRecord._id,
            userId: memberUser._id,
            adminId: adminId,
            gymId: new Types.ObjectId(gymId),
            status: 'booked',
            bookedAt: new Date(),
        });

        res.status(201).json({ success: true, data: booking, message: `Successfully booked ${clientRecord.fullName} into class! 🎉` });

        // Send confirmation notification to member
        try {
            const className = classData?.name || 'Class';
            const sessionDate = session.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
            await createNotification({
                recipientId: memberUser._id,
                recipientRole: 'member',
                gymId,
                type: 'class_booking_confirmed',
                title: `✅ Class Booking Confirmed`,
                message: `Receptionist booked your slot for ${className} on ${sessionDate} at ${session.time}.`,
                link: '/member/classes',
                metadata: { bookingId: (booking as any)._id.toString(), sessionId },
            });
        } catch (err) {
            console.error('[ClassBooking] Confirmation notification failed:', err);
        }
    } catch (error) {
        next(error);
    }
};

