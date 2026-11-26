// models/biometricUser.model.ts

import mongoose, { Schema, model, Document, Types } from 'mongoose';
import type { BiometricUserStatus } from '../biometric/biometric.types';

export interface IBiometricUser extends Document {
  _id: Types.ObjectId;
  memberId: Types.ObjectId;     // Reference to Client (Gym Member)
  deviceId: Types.ObjectId;     // Reference to BiometricDevice
  gymId: Types.ObjectId;        // Reference to Gym (Branch)
  adminId: Types.ObjectId;      // Reference to User (Tenant Admin)
  biometricUserId: string;      // User ID on physical machine (e.g., "2936")
  status: BiometricUserStatus;  // 'active' | 'suspended' | 'deleted'
  enrolledAt?: Date | null;
  lastSyncedAt?: Date | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const biometricUserSchema = new Schema<IBiometricUser>(
  {
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Member (Client) ID is required'],
      index: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'BiometricDevice',
      required: [true, 'Device ID is required'],
      index: true,
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Gym ID is required'],
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    biometricUserId: {
      type: String,
      required: [true, 'Biometric user ID is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound unique index: deviceId + biometricUserId (One mapping per device per ID)
biometricUserSchema.index({ deviceId: 1, biometricUserId: 1 }, { unique: true });

// Performance index for finding all devices where a member is enrolled
biometricUserSchema.index({ memberId: 1, status: 1 });
biometricUserSchema.index({ gymId: 1, status: 1 });

export const BiometricUser = model<IBiometricUser>('BiometricUser', biometricUserSchema);
