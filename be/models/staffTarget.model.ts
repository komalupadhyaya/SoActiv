// models/staffTarget.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMonthlyTargets {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export interface IStaffTarget extends Document {
  _id: Types.ObjectId;
  gym: Types.ObjectId;
  createdBy: Types.ObjectId;
  staffId: Types.ObjectId;
  staffName: string;
  targetType: string; // e.g. 'Sales', 'Personal Training', etc.
  salesType: string;  // e.g. 'Revenue Target', 'Call Target', etc.
  year: number;       // e.g. 2025, 2026
  monthlyTargets: IMonthlyTargets;
  createdAt: Date;
  updatedAt: Date;
}

const staffTargetSchema = new Schema<IStaffTarget>(
  {
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Gym ID is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Staff ID is required'],
      index: true,
    },
    staffName: {
      type: String,
      required: [true, 'Staff Name is required'],
      trim: true,
    },
    targetType: {
      type: String,
      required: [true, 'Target Type is required'],
      trim: true,
      default: 'Sales',
    },
    salesType: {
      type: String,
      required: [true, 'Sales Type is required'],
      trim: true,
      default: 'Revenue Target',
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      index: true,
      default: () => new Date().getFullYear(),
    },
    monthlyTargets: {
      jan: { type: Number, default: 0 },
      feb: { type: Number, default: 0 },
      mar: { type: Number, default: 0 },
      apr: { type: Number, default: 0 },
      may: { type: Number, default: 0 },
      jun: { type: Number, default: 0 },
      jul: { type: Number, default: 0 },
      aug: { type: Number, default: 0 },
      sep: { type: Number, default: 0 },
      oct: { type: Number, default: 0 },
      nov: { type: Number, default: 0 },
      dec: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help query targets by gym, staff, and year
staffTargetSchema.index({ gym: 1, staffId: 1, year: 1 });

export const StaffTarget = mongoose.model<IStaffTarget>('StaffTarget', staffTargetSchema);
