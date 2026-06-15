import mongoose, { Schema, Document, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent';

export interface IClassAttendance extends Document {
    _id: Types.ObjectId;
    sessionId: Types.ObjectId;   // ref: ClassSession
    classId: Types.ObjectId;     // ref: GymClass
    memberId: Types.ObjectId;    // ref: Client
    userId: Types.ObjectId;      // ref: User (member's user account)
    adminId: Types.ObjectId;     // ref: User (gym owner)
    gymId: Types.ObjectId;       // ref: Gym
    status: AttendanceStatus;
    markedBy: Types.ObjectId;    // ref: User (trainer/manager who marked)
    markedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const classAttendanceSchema = new Schema<IClassAttendance>(
    {
        sessionId: {
            type: Schema.Types.ObjectId,
            ref: 'ClassSession',
            required: [true, 'Session ID is required'],
            index: true,
        },
        classId: {
            type: Schema.Types.ObjectId,
            ref: 'GymClass',
            required: [true, 'Class ID is required'],
        },
        memberId: {
            type: Schema.Types.ObjectId,
            ref: 'Client',
            required: [true, 'Member (Client) ID is required'],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
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
        },
        status: {
            type: String,
            enum: ['present', 'absent'],
            required: [true, 'Attendance status is required'],
        },
        markedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Marked by user is required'],
        },
        markedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// One attendance record per member per session
classAttendanceSchema.index({ sessionId: 1, memberId: 1 }, { unique: true });
classAttendanceSchema.index({ adminId: 1, sessionId: 1 });

export const ClassAttendance = mongoose.model<IClassAttendance>('ClassAttendance', classAttendanceSchema);
export default ClassAttendance;
