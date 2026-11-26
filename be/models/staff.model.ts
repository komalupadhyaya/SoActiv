// models/Staff.model.ts

import mongoose, { Types } from 'mongoose';
import { Schema, model, Document } from 'mongoose';

/**
 * Interface for the Staff document (TypeScript type)
 */
export interface IStaff extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId; // Made optional
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
  avatar?: string;
  countryCode?: string;
  gender?: string;
  vaccinated?: string;
  loginAccess?: boolean;
  resumeUrl?: string;
  employeeCategory?: string;
  payoutType?: string;
  grade?: string;
  dob?: Date;
  anniversary?: Date;
  jobDesignation?: string;
  adminRights?: string;
  attendanceId?: string;
  panCard?: string;
  gstNumber?: string;
  accountNo?: string;
  ifsc?: string;
  hrmsId?: string;
  permissions?: Record<string, boolean>;
  approvalStatus: 'approved' | 'pending_create' | 'pending_update' | 'pending_delete';
  pendingUpdates?: Record<string, any> | null;
  requestedBy?: Types.ObjectId | null;
  requestedAt?: Date | null;
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
      required: false, // Made optional for pending creations
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
    avatar: {
      type: String,
      default: '',
    },
    countryCode: {
      type: String,
      default: '+91',
    },
    gender: {
      type: String,
      default: '',
    },
    vaccinated: {
      type: String,
      default: '',
    },
    loginAccess: {
      type: Boolean,
      default: true,
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    employeeCategory: {
      type: String,
      default: '',
    },
    payoutType: {
      type: String,
      default: '',
    },
    grade: {
      type: String,
      default: '',
    },
    dob: {
      type: Date,
      default: null,
    },
    anniversary: {
      type: Date,
      default: null,
    },
    jobDesignation: {
      type: String,
      default: '',
    },
    adminRights: {
      type: String,
      default: '',
    },
    attendanceId: {
      type: String,
      default: '',
    },
    panCard: {
      type: String,
      default: '',
    },
    gstNumber: {
      type: String,
      default: '',
    },
    accountNo: {
      type: String,
      default: '',
    },
    ifsc: {
      type: String,
      default: '',
    },
    hrmsId: {
      type: String,
      default: '',
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
      trim: true,
      default: 'trainer',
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
      default: Date.now,
    },
    salary: {
      type: Number,
      default: 0,
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
    approvalStatus: {
      type: String,
      enum: ['approved', 'pending_create', 'pending_update', 'pending_delete'],
      default: 'approved',
    },
    pendingUpdates: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    requestedAt: {
      type: Date,
      default: null,
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
    permissions: {
      type: Schema.Types.Mixed,
      default: {},
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