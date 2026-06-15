import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { GymClass } from '../models/gymClass.model';
import { ClassSession } from '../models/classSession.model';
import { ClassBooking } from '../models/classBooking.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';
import { createNotification } from '../utils/notification.helper';

/**
 * Helper: compute endTime from startTime + duration (in minutes)
 */
function computeEndTime(time: string, durationMinutes: number): string {
    const parts = time.split(':');
    const h = parseInt(parts[0] ?? '0', 10);
    const m = parseInt(parts[1] ?? '0', 10);
    const totalMins = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

/**
 * @desc    Generate recurring sessions for a class within a date range
 * @route   POST /api/v1/class-sessions/generate/:classId
 * @access  Admin, Manager
 */
export const generateSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classId } = req.params;
        const { startDate, endDate } = req.body;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        if (!startDate || !endDate) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'startDate and endDate are required');
        }

        const gymClass = await GymClass.findOne({
            _id: new Types.ObjectId(classId),
            adminId: new Types.ObjectId(adminId),
            status: 'active',
        });
        if (!gymClass) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Active class not found');

        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (start > end) throw new ApiError(HttpStatusCode.BAD_REQUEST, 'startDate must be before endDate');

        const endTime = computeEndTime(gymClass.time, gymClass.durationMinutes);
        const sessionsToCreate: any[] = [];

        const current = new Date(start);
        while (current <= end) {
            const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat

            let shouldCreate = false;
            if (gymClass.recurrence.type === 'none') {
                // Single session on startDate only
                if (current.getTime() === start.getTime()) shouldCreate = true;
            } else if (gymClass.recurrence.type === 'weekly') {
                shouldCreate = gymClass.recurrence.days.includes(dayOfWeek);
            }

            if (shouldCreate) {
                // Check if a session already exists for this date+class
                const existing = await ClassSession.findOne({
                    classId: gymClass._id,
                    date: new Date(current),
                });
                if (!existing) {
                    sessionsToCreate.push({
                        classId: gymClass._id,
                        adminId: new Types.ObjectId(adminId),
                        gymId: gymClass.gymId,
                        trainerId: gymClass.trainerId,
                        trainerUserId: gymClass.trainerUserId,
                        date: new Date(current),
                        time: gymClass.time,
                        endTime,
                        capacity: gymClass.capacity,
                        bookedCount: 0,
                        status: 'scheduled',
                    });
                }
            }

            current.setDate(current.getDate() + 1);
        }

        if (sessionsToCreate.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No new sessions to create (all already exist or no matching days)',
            });
        }

        const created = await ClassSession.insertMany(sessionsToCreate, { ordered: false });

        res.status(201).json({
            success: true,
            data: created,
            message: `${created.length} session(s) generated successfully`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all sessions for a specific class
 * @route   GET /api/v1/class-sessions/by-class/:classId
 * @access  Admin, Manager, Trainer (own class only)
 */
export const getSessionsByClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classId } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;
        const { from, to, status } = req.query;

        const filter: any = {
            classId: new Types.ObjectId(classId),
            adminId: new Types.ObjectId(adminId),
        };
        if (status) filter.status = status;
        if (from || to) {
            filter.date = {};
            if (from) {
                const fromDate = new Date(from as string);
                fromDate.setHours(0, 0, 0, 0);
                filter.date.$gte = fromDate;
            }
            if (to) {
                const toDate = new Date(to as string);
                toDate.setHours(23, 59, 59, 999);
                filter.date.$lte = toDate;
            }
        }

        // Trainers can only see their own sessions
        if (user.role === 'staff' && user.position === 'trainer') {
            filter.trainerUserId = new Types.ObjectId(user.id);
        }

        const sessions = await ClassSession.find(filter)
            .populate('trainerId', 'fullName position email')
            .sort({ date: 1, time: 1 });

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get upcoming sessions for member booking
 * @route   GET /api/v1/class-sessions/upcoming
 * @access  Member, Admin, Manager
 */
export const getUpcomingSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const gymId = user.gym;
        const { classId, days = 30 } = req.query;

        if (!gymId) throw new ApiError(HttpStatusCode.BAD_REQUEST, 'No gym associated with this account');

        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const futureDate = new Date(todayStart);
        futureDate.setDate(todayStart.getDate() + Number(days));
        futureDate.setHours(23, 59, 59, 999);

        const filter: any = {
            gymId: new Types.ObjectId(gymId),
            status: 'scheduled',
            date: { $gte: todayStart, $lte: futureDate },
        };
        if (classId) filter.classId = new Types.ObjectId(classId as string);

        const sessions = await ClassSession.find(filter)
            .populate('classId', 'name description color notes')
            .populate('trainerId', 'fullName email avatar')
            .sort({ date: 1, time: 1 })
            .limit(100);

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single session by ID
 * @route   GET /api/v1/class-sessions/:sessionId
 * @access  Admin, Manager, Trainer
 */
export const getSessionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const session = await ClassSession.findOne({
            _id: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
        })
            .populate('classId', 'name description color durationMinutes notes')
            .populate('trainerId', 'fullName position email avatar');

        if (!session) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Session not found');

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel a session (Trainer, Manager, Admin) with notification to booked members
 * @route   PATCH /api/v1/class-sessions/:sessionId/cancel
 * @access  Admin, Manager, Trainer
 */
export const cancelSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const { cancelReason } = req.body;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const session = await ClassSession.findOne({
            _id: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
        }).populate('classId', 'name');

        if (!session) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Session not found');
        if (session.status === 'cancelled') {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Session is already cancelled');
        }

        // Trainers can only cancel their own sessions
        if (user.role === 'staff' && user.position === 'trainer') {
            if (!session.trainerUserId?.equals(new Types.ObjectId(user.id))) {
                throw new ApiError(HttpStatusCode.FORBIDDEN, 'You can only cancel your own sessions');
            }
        }

        session.status = 'cancelled';
        session.cancelReason = cancelReason || 'Cancelled by trainer/manager';
        session.cancelledAt = new Date();
        session.cancelledBy = new Types.ObjectId(user.id);
        await session.save();

        // Cancel all active bookings for this session & release booked count
        const bookings = await ClassBooking.find({
            sessionId: session._id,
            status: { $in: ['booked', 'checked_in'] },
        }).select('userId');

        await ClassBooking.updateMany(
            { sessionId: session._id, status: { $in: ['booked', 'checked_in'] } },
            { status: 'cancelled', cancelledAt: new Date() }
        );

        // Reset bookedCount
        session.bookedCount = 0;
        await session.save();

        // Notify all booked members
        const className = (session.classId as any)?.name || 'Your class';
        const sessionDate = session.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

        try {
            for (const booking of bookings) {
                await createNotification({
                    recipientId: booking.userId,
                    recipientRole: 'member',
                    gymId: session.gymId,
                    type: 'class_cancelled',
                    title: `❌ Class Cancelled`,
                    message: `${className} on ${sessionDate} at ${session.time} has been cancelled. ${cancelReason ? `Reason: ${cancelReason}` : ''}`,
                    link: '/member/classes',
                    metadata: { sessionId: sessionId, classId: session.classId?.toString() },
                });
            }
        } catch (err) {
            console.error('[ClassSession] Cancel notification failed:', err);
        }

        res.status(200).json({ success: true, message: 'Session cancelled successfully', data: session });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update session notes (Trainer only)
 * @route   PATCH /api/v1/class-sessions/:sessionId/notes
 * @access  Trainer, Manager, Admin
 */
export const updateSessionNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const { notes } = req.body;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const session = await ClassSession.findOne({
            _id: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
        });
        if (!session) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Session not found');

        session.notes = notes;
        await session.save();

        res.status(200).json({ success: true, data: session, message: 'Session notes updated' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all sessions for the gym (admin/manager overview)
 * @route   GET /api/v1/class-sessions
 * @access  Admin, Manager
 */
export const getAllSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id;
        const { from, to, status, classId } = req.query;

        const filter: any = { adminId: new Types.ObjectId(adminId) };
        if (status) filter.status = status;
        if (classId) filter.classId = new Types.ObjectId(classId as string);
        if (from || to) {
            filter.date = {};
            if (from) {
                const fromDate = new Date(from as string);
                fromDate.setHours(0, 0, 0, 0);
                filter.date.$gte = fromDate;
            }
            if (to) {
                const toDate = new Date(to as string);
                toDate.setHours(23, 59, 59, 999);
                filter.date.$lte = toDate;
            }
        }

        const sessions = await ClassSession.find(filter)
            .populate('classId', 'name color durationMinutes')
            .populate('trainerId', 'fullName email')
            .sort({ date: 1, time: 1 });

        res.status(200).json({ success: true, data: sessions });
    } catch (error) {
        next(error);
    }
};
