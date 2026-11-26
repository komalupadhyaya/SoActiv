// models/biometricDevice.model.ts

import mongoose, { Schema, model, Document, Types } from 'mongoose';
import type {
  BiometricDeviceType,
  BiometricConnectionType,
  BiometricDeviceStatus,
} from '../biometric/biometric.types';

// @ts-ignore – Mongoose Document._id is 'unknown' in strict mode; we override it to Types.ObjectId per project convention
export interface IBiometricDevice extends Document {
  _id: Types.ObjectId;
  name: string;
  gymId: Types.ObjectId;     // Reference to Gym (Branch)
  adminId: Types.ObjectId;   // Reference to User (Tenant Admin)
  manufacturer?: string;     // e.g. "Generic", "eSSL", "ZKTeco", "Hikvision"
  model?: string;            // e.g. "X990", "SilkBio-101TC", "Generic-Push"
  serialNumber: string;      // Hardware unique identifier (device serial)
  deviceType: BiometricDeviceType;
  connectionType: BiometricConnectionType;
  ipAddress?: string;
  port?: number;
  status: BiometricDeviceStatus;
  isActive: boolean;
  duplicateWindowSeconds: number; // Configurable debounce window
  lastPingAt?: Date | null;
  lastCommunicationAt?: Date | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const biometricDeviceSchema = new Schema<IBiometricDevice>(
  {
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      required: [true, 'Gym (branch) ID is required'],
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required'],
      index: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: 'Generic',
    },
    model: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      trim: true,
      uppercase: true,
    },
    deviceType: {
      type: String,
      enum: ['FINGERPRINT', 'FACE', 'RFID', 'CARD', 'MULTI_MODAL', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    connectionType: {
      type: String,
      enum: ['PUSH', 'TCP_IP', 'HTTP', 'HTTPS', 'SDK', 'POLLING', 'UNKNOWN'],
      default: 'PUSH',
    },
    ipAddress: {
      type: String,
      trim: true,
      default: null,
    },
    port: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'DISABLED', 'UNKNOWN'],
      default: 'ONLINE',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    duplicateWindowSeconds: {
      type: Number,
      default: 30,
      min: [0, 'Duplicate window cannot be negative'],
    },
    lastPingAt: {
      type: Date,
      default: null,
    },
    lastCommunicationAt: {
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

// Indexes
biometricDeviceSchema.index({ gymId: 1, serialNumber: 1 }, { unique: true });
biometricDeviceSchema.index({ adminId: 1, isActive: 1 });
biometricDeviceSchema.index({ serialNumber: 1 });

export const BiometricDevice = model<IBiometricDevice>('BiometricDevice', biometricDeviceSchema);
