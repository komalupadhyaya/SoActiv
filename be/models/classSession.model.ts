import mongoose, { Schema, Document, Types } from 'mongoose';

export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface IClassSession extends Document {
    _id: Types.ObjectId;
    classId: Types.ObjectId;          // ref: GymClass
    adminId: Types.ObjectId;          // ref: User (gym owner)
    gymId: Types.ObjectId;            // ref: Gym
    trainerId?: Types.ObjectId;       // ref: Staff (can differ for substitutes)
    trainerUserId?: Types.ObjectId;   // ref: User
    date: Date;                       // specific date of this occurrence
    time: string;                     // HH:MM — copied from parent class
    endTime: string;                  // computed at session generation
    status: SessionStatus;
    capacity: number;                 // copied from parent class at creation
    bookedCount: number;              // atomically incremented/decremented
    notes?: string;                   // trainer's session-specific notes
    cancelReason?: string;
    cancelledAt?: Date;
    cancelledBy?: Types.ObjectId;     // ref: User
    createdAt: Date;
    updatedAt: Date;
}

const classSessionSchema = new Schema<IClassSession>(
    {
        classId: {
            type: Schema.Types.ObjectId,
            ref: 'GymClass',
            required: [true, 'Class ID is required'],
            index: true,
        },
        adminId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Admin ID is required'],
            index: true,
        },
        gymId: {
            type: Schema.Types.ObjectId,
            ref: 'Gym',
            required: [true, 'Gym ID is required'],
            index: true,
        },
        trainerId: {
            type: Schema.Types.ObjectId,
            ref: 'Staff',
            default: null,
        },
        trainerUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        date: {
            type: Date,
            required: [true, 'Session date is required'],
            index: true,
        },
        time: {
            type: String,
            required: [true, 'Session time is required'],
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'],
        },
        endTime: {
            type: String,
            required: [true, 'Session end time is required'],
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:MM format'],
        },
        status: {
            type: String,
            enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        capacity: {
            type: Number,
            required: [true, 'Capacity is required'],
            min: [1, 'Capacity must be at least 1'],
        },
        bookedCount: {
            type: Number,
            default: 0,
            min: [0, 'Booked count cannot be negative'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [2000, 'Notes cannot exceed 2000 characters'],
        },
        cancelReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Cancel reason cannot exceed 500 characters'],
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancelledBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    { timestamps: true }
);

classSessionSchema.index({ adminId: 1, date: 1 });
classSessionSchema.index({ classId: 1, date: 1 });
classSessionSchema.index({ trainerId: 1, date: 1 });
classSessionSchema.index({ trainerUserId: 1, date: 1 });
classSessionSchema.index({ gymId: 1, date: 1, status: 1 });

export const ClassSession = mongoose.model<IClassSession>('ClassSession', classSessionSchema);
export default ClassSession;
