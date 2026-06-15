import mongoose, { Schema, Document, Types } from 'mongoose';

export type BookingStatus = 'booked' | 'cancelled' | 'attended' | 'no_show' | 'checked_in';

export interface IClassBooking extends Document {
    _id: Types.ObjectId;
    sessionId: Types.ObjectId;   // ref: ClassSession
    classId: Types.ObjectId;     // ref: GymClass
    memberId: Types.ObjectId;    // ref: Client
    userId: Types.ObjectId;      // ref: User (member's user account)
    adminId: Types.ObjectId;     // ref: User (gym owner — for tenant isolation)
    gymId: Types.ObjectId;       // ref: Gym
    status: BookingStatus;
    bookedAt: Date;
    cancelledAt?: Date;
    checkInAt?: Date;            // Self check-in timestamp
    createdAt: Date;
    updatedAt: Date;
}

const classBookingSchema = new Schema<IClassBooking>(
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
            index: true,
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
        },
        status: {
            type: String,
            enum: ['booked', 'cancelled', 'attended', 'no_show', 'checked_in'],
            default: 'booked',
        },
        bookedAt: {
            type: Date,
            default: Date.now,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        checkInAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// One booking per member per session — prevents duplicate bookings
classBookingSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
classBookingSchema.index({ userId: 1, status: 1 });
classBookingSchema.index({ adminId: 1, sessionId: 1 });

export const ClassBooking = mongoose.model<IClassBooking>('ClassBooking', classBookingSchema);
export default ClassBooking;
