// models/Attendance.model.ts

import mongoose, { Types } from 'mongoose';
import { Schema, model, Document } from 'mongoose';
import { Staff } from './staff.model'; 

/**
 * Interface for the Attendance document
 */
export interface IAttendance extends Document {
    _id: Types.ObjectId;
  staffId: Types.ObjectId;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema Definition
 */
const attendanceSchema = new Schema<IAttendance>(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: { expireAfterSeconds: 7776000 },
      immutable: true, // Prevent changing the date after creation
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late', 'on-leave', 'half-day'],
        message: 'Status must be one of: present, absent, late, on-leave',
      },
      required: [true, 'Attendance status is required'],
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one attendance record per staff per day
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

/**
 * Export the Mongoose Model
 */
export const Attendance = model<IAttendance>('Attendance', attendanceSchema);