import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ClassSession } from '../models/classSession.model';
import { ClassBooking } from '../models/classBooking.model';
import { ClassAttendance } from '../models/classAttendance.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';

/**
 * @desc    Trainer/Manager marks attendance for a session
 *          Accepts array of { memberId, userId, status } records (bulk)
 * @route   POST /api/v1/class-attendance/session/:sessionId
 * @access  Trainer, Manager, Admin
 */
export const markClassAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const { attendanceRecords } = req.body; // [{ memberId, userId, status }]
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'attendanceRecords array is required');
        }

        const session = await ClassSession.findOne({
            _id: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
        });
        if (!session) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Session not found');
        if (session.status === 'cancelled') {
            throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Cannot mark attendance for a cancelled session');
        }

        // Prevent marking attendance too early (only allowed starting 15 minutes before class)
        const timeParts = session.time.split(':').map(Number);
        const h = timeParts[0] ?? 0;
        const m = timeParts[1] ?? 0;
        const sessionStart = new Date(session.date);
        sessionStart.setHours(h, m, 0, 0);
        const diffInMinutes = (sessionStart.getTime() - Date.now()) / (1000 * 60);
        if (diffInMinutes > 15) {
            throw new ApiError(
                HttpStatusCode.BAD_REQUEST,
                'Attendance marking is not open yet. It opens 15 minutes before the class starts.'
            );
        }

        // Trainers can only mark attendance for their own sessions
        if (user.role === 'staff' && user.position === 'trainer') {
            if (!session.trainerUserId?.equals(new Types.ObjectId(user.id))) {
                throw new ApiError(HttpStatusCode.FORBIDDEN, 'You can only mark attendance for your own sessions');
            }
        }

        const results: any[] = [];
        const now = new Date();

        for (const record of attendanceRecords) {
            const { memberId, userId, status } = record;
            if (!memberId || !userId || !['present', 'absent'].includes(status)) continue;

            // Upsert attendance — update if exists, create otherwise
            const attendance = await ClassAttendance.findOneAndUpdate(
                {
                    sessionId: session._id,
                    memberId: new Types.ObjectId(memberId),
                },
                {
                    sessionId: session._id,
                    classId: session.classId,
                    memberId: new Types.ObjectId(memberId),
                    userId: new Types.ObjectId(userId),
                    adminId: new Types.ObjectId(adminId),
                    gymId: session.gymId,
                    status,
                    markedBy: new Types.ObjectId(user.id),
                    markedAt: now,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push(attendance);

            // Update booking status to 'attended' or 'no_show'
            await ClassBooking.findOneAndUpdate(
                {
                    sessionId: session._id,
                    memberId: new Types.ObjectId(memberId),
                    status: { $in: ['booked', 'checked_in'] },
                },
                { status: status === 'present' ? 'attended' : 'no_show' }
            );
        }

        res.status(200).json({
            success: true,
            data: results,
            message: `Attendance marked for ${results.length} member(s)`,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get attendance for a session
 * @route   GET /api/v1/class-attendance/session/:sessionId
 * @access  Admin, Manager, Trainer
 */
export const getSessionAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const attendance = await ClassAttendance.find({
            sessionId: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
        })
            .populate('memberId', 'fullName email contactNumber')
            .populate('userId', 'name email avatar')
            .sort({ markedAt: 1 });

        // Also fetch bookings to get the full booked member list (including unmarked)
        const bookings = await ClassBooking.find({
            sessionId: new Types.ObjectId(sessionId),
            adminId: new Types.ObjectId(adminId),
            status: { $nin: ['cancelled'] },
        })
            .populate('memberId', 'fullName email contactNumber')
            .populate('userId', 'name email avatar');

        res.status(200).json({
            success: true,
            data: {
                attendance,
                bookings,
            },
        });
    } catch (error) {
        next(error);
    }
};
