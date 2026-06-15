// models/clientAttendance.model.ts

import mongoose, { Types } from 'mongoose';
import { Schema, model, Document } from 'mongoose';

/**
 * Interface for a ClientAttendance document
 */
export interface IClientAttendance extends Document {
  _id: Types.ObjectId;
  clientId: Types.ObjectId;   // ref: 'Client'
  adminId: Types.ObjectId;    // ref: 'User' (gym owner — SaaS tenant isolation)
  date: Date;                 // normalized to start-of-day (immutable)
  checkInTime?: Date;         // actual timestamp of gym entry
  checkOutTime?: Date;        // actual timestamp of gym exit
  duration?: number;          // computed: checkOut - checkIn in minutes
  status: 'present' | 'absent';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema
 */
const clientAttendanceSchema = new Schema<IClientAttendance>(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
      index: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin (gym owner) ID is required'],
      index: true,
    },

    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      immutable: true, // Prevent changing the date after creation
    },

    checkInTime: {
      type: Date,
      default: null,
    },

    checkOutTime: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      min: [0, 'Duration cannot be negative'],
      default: null,
      // Stored in minutes; computed when checkOutTime is recorded
    },

    status: {
      type: String,
      enum: {
        values: ['present', 'absent'],
        message: 'Status must be either: present or absent',
      },
      required: [true, 'Attendance status is required'],
      default: 'present',
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────

// One attendance record per member per day (prevents duplicate check-ins)
clientAttendanceSchema.index({ clientId: 1, date: 1 }, { unique: true });

// Query performance: admin fetching all member records for their gym
clientAttendanceSchema.index({ adminId: 1, date: -1 });

// Query performance: member fetching their own history sorted by date
clientAttendanceSchema.index({ clientId: 1, date: -1 });

// ── Pre-save Hook ──────────────────────────────────────────────────────────

// Automatically compute duration in minutes when checkOutTime is set
clientAttendanceSchema.pre('save', function (next) {
  if (this.checkInTime && this.checkOutTime) {
    const diffMs = this.checkOutTime.getTime() - this.checkInTime.getTime();
    this.duration = Math.round(diffMs / (1000 * 60)); // convert ms → minutes
  }
  next();
});

/**
 * Export the Mongoose Model
 */
export const ClientAttendance = model<IClientAttendance>(
  'ClientAttendance',
  clientAttendanceSchema
);
