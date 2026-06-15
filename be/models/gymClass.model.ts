import mongoose, { Schema, Document, Types } from 'mongoose';

export type RecurrenceType = 'none' | 'weekly';
export type ClassStatus = 'active' | 'inactive' | 'cancelled';

export interface IRecurrence {
    type: RecurrenceType;
    days: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export interface IGymClass extends Document {
    _id: Types.ObjectId;
    adminId: Types.ObjectId;
    gymId: Types.ObjectId;
    name: string;
    description?: string;
    notes?: string;
    trainerId?: Types.ObjectId;      // ref: Staff
    trainerUserId?: Types.ObjectId;  // ref: User (trainer's user account)
    capacity: number;
    durationMinutes: number;
    time: string;                    // HH:MM format
    color?: string;                  // for calendar display
    recurrence: IRecurrence;
    status: ClassStatus;
    createdAt: Date;
    updatedAt: Date;
}

const gymClassSchema = new Schema<IGymClass>(
    {
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
        name: {
            type: String,
            required: [true, 'Class name is required'],
            trim: true,
            maxlength: [100, 'Class name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [1000, 'Notes cannot exceed 1000 characters'],
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
        capacity: {
            type: Number,
            required: [true, 'Capacity is required'],
            min: [1, 'Capacity must be at least 1'],
            max: [500, 'Capacity cannot exceed 500'],
        },
        durationMinutes: {
            type: Number,
            required: [true, 'Duration is required'],
            min: [15, 'Duration must be at least 15 minutes'],
            max: [480, 'Duration cannot exceed 8 hours'],
        },
        time: {
            type: String,
            required: [true, 'Class time is required'],
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'],
        },
        color: {
            type: String,
            default: '#F97316', // SoActiv orange
            match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
        },
        recurrence: {
            type: {
                type: String,
                enum: ['none', 'weekly'],
                default: 'none',
            },
            days: {
                type: [Number],
                default: [],
                validate: {
                    validator: (days: number[]) => days.every(d => d >= 0 && d <= 6),
                    message: 'Recurrence days must be between 0 (Sunday) and 6 (Saturday)',
                },
            },
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled'],
            default: 'active',
        },
    },
    { timestamps: true }
);

gymClassSchema.index({ adminId: 1, status: 1 });
gymClassSchema.index({ gymId: 1, status: 1 });
gymClassSchema.index({ trainerId: 1, status: 1 });
gymClassSchema.index({ trainerUserId: 1, status: 1 });

export const GymClass = mongoose.model<IGymClass>('GymClass', gymClassSchema);
export default GymClass;
