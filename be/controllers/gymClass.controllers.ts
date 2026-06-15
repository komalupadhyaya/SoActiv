import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { GymClass } from '../models/gymClass.model';
import { ClassSession } from '../models/classSession.model';
import { Staff } from '../models/staff.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';

/**
 * Helper: compute endTime string from startTime + duration
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
 * @desc    Create a new class
 * @route   POST /api/v1/classes
 * @access  Admin, Manager
 */
export const createGymClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id;
        const gymId = user.gym;

        if (!gymId) throw new ApiError(HttpStatusCode.BAD_REQUEST, 'No gym associated with this account');

        const {
            name, description, notes, trainerId, capacity,
            durationMinutes, time, color, recurrence,
        } = req.body;

        // Resolve trainer's userId from staff record
        let trainerUserId: Types.ObjectId | null = null;
        if (trainerId) {
            const staffRecord = await Staff.findById(trainerId).select('userId');
            if (!staffRecord) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Trainer staff record not found');
            trainerUserId = staffRecord.userId as Types.ObjectId;
        }

        const gymClass = await GymClass.create({
            adminId: new Types.ObjectId(adminId),
            gymId: new Types.ObjectId(gymId),
            name,
            description,
            notes,
            trainerId: trainerId ? new Types.ObjectId(trainerId) : null,
            trainerUserId,
            capacity,
            durationMinutes,
            time,
            color: color || '#F97316',
            recurrence: recurrence || { type: 'none', days: [] },
            status: 'active',
        });

        const populated = await GymClass.findById(gymClass._id)
            .populate('trainerId', 'fullName position email');

        res.status(201).json({ success: true, data: populated, message: 'Class created successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all classes for a gym (Admin/Manager: all classes; Trainer: only their classes)
 * @route   GET /api/v1/classes
 * @access  Admin, Manager, Trainer
 */
export const getGymClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id;
        const role = user.role;
        const position = user.position;

        const filter: any = {
            adminId: new Types.ObjectId(adminId),
            status: { $ne: 'cancelled' },
        };

        // Trainers only see their own classes
        if (role === 'staff' && position === 'trainer') {
            filter.trainerUserId = new Types.ObjectId(user.id);
        }

        const classes = await GymClass.find(filter)
            .populate('trainerId', 'fullName position email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single class by ID
 * @route   GET /api/v1/classes/:id
 * @access  Admin, Manager, Trainer
 */
export const getGymClassById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const gymClass = await GymClass.findOne({
            _id: new Types.ObjectId(id),
            adminId: new Types.ObjectId(adminId),
        }).populate('trainerId', 'fullName position email avatar');

        if (!gymClass) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Class not found');

        res.status(200).json({ success: true, data: gymClass });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a class
 * @route   PUT /api/v1/classes/:id
 * @access  Admin, Manager
 */
export const updateGymClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const gymClass = await GymClass.findOne({
            _id: new Types.ObjectId(id),
            adminId: new Types.ObjectId(adminId),
        });
        if (!gymClass) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Class not found');

        const allowedFields = ['name', 'description', 'notes', 'trainerId', 'capacity', 'durationMinutes', 'time', 'color', 'recurrence', 'status'];
        const updates: any = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Re-resolve trainerUserId if trainerId changed
        if (updates.trainerId) {
            const staffRecord = await Staff.findById(updates.trainerId).select('userId');
            if (!staffRecord) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Trainer not found');
            updates.trainerUserId = staffRecord.userId;
        }

        const updated = await GymClass.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
            .populate('trainerId', 'fullName position email avatar');

        res.status(200).json({ success: true, data: updated, message: 'Class updated successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete (soft-cancel) a class
 * @route   DELETE /api/v1/classes/:id
 * @access  Admin, Manager
 */
export const deleteGymClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const gymClass = await GymClass.findOne({
            _id: new Types.ObjectId(id),
            adminId: new Types.ObjectId(adminId),
        });
        if (!gymClass) throw new ApiError(HttpStatusCode.NOT_FOUND, 'Class not found');

        // Soft-cancel: mark as cancelled (preserve session history)
        gymClass.status = 'cancelled';
        await gymClass.save();

        // Cancel all future scheduled sessions
        await ClassSession.updateMany(
            {
                classId: gymClass._id,
                status: 'scheduled',
                date: { $gte: new Date() },
            },
            { status: 'cancelled', cancelReason: 'Parent class cancelled', cancelledAt: new Date() }
        );

        res.status(200).json({ success: true, message: 'Class cancelled successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get trainer's own classes (staff-specific shortcut)
 * @route   GET /api/v1/classes/my-classes
 * @access  Trainer
 */
export const getMyClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id;

        const classes = await GymClass.find({
            adminId: new Types.ObjectId(adminId),
            trainerUserId: new Types.ObjectId(user.id),
            status: { $ne: 'cancelled' },
        }).populate('trainerId', 'fullName position email avatar')
          .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: classes });
    } catch (error) {
        next(error);
    }
};
