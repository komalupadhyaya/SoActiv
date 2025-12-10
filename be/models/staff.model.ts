// models/Staff.model.ts

import mongoose, { Types } from 'mongoose';
import { Schema, model, Document } from 'mongoose';

/**
 * Interface for the Staff document (TypeScript type)
 */
export interface IStaff extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  createdBy: Types.ObjectId;
  gym: Types.ObjectId;
  fullName: string;
  position: string;
  email: string;
  contactNumber: string;
  joiningDate: Date;
  salary: number;
  status: 'active' | 'inactive';
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema Definition
 */
const staffSchema = new Schema<IStaff>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gym: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gym',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      enum: {
        values: ["manager", "receptionist", "cleaner", "sales", "maintenance"],
        message: 'Position must be either manager", "receptionist", "cleaner", "sales", "maintenance" ',
      },
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]{10,}$/, 'Please enter a valid phone number'],
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be either "active" or "inactive"',
      },
      default: 'active',
    },
    notifications: {
      sms: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    // Enable timestamps: createdAt & updatedAt
    timestamps: true,
  }
);

/**
 * Export the Mongoose Model
 */
export const Staff = model<IStaff>('Staff', staffSchema);