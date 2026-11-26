// models/biometricEventLog.model.ts

import mongoose, { Schema, model, Document, Types } from 'mongoose';
import type {
  BiometricEventType,
  BiometricVerificationType,
  BiometricProcessingStatus,
  BiometricReasonCode,
} from '../biometric/biometric.types';

export interface IBiometricEventLog extends Document {
  _id: Types.ObjectId;
  deviceId?: Types.ObjectId | null;
  deviceSerialNumber?: string;
  gymId?: Types.ObjectId | null;
  adminId?: Types.ObjectId | null;
  memberId?: Types.ObjectId | null;
  biometricUserId: string;
  transactionId?: string | null;
  eventType: BiometricEventType;
  verificationType: BiometricVerificationType;
  eventTime: Date;
  processingStatus: BiometricProcessingStatus;
  accessAllowed: boolean;
  failureReason?: BiometricReasonCode | string | null;
  attendanceId?: Types.ObjectId | null;
  rawData?: Record<string, any>;
  processedAt: Date;
  errorDetails?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const biometricEventLogSchema = new Schema<IBiometricEventLog>(
  {
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'BiometricDevice',
      default: null,
      index: true,
    },
    deviceSerialNumber: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
      default: null,
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    biometricUserId: {
      type: String,
      required: [true, 'Biometric user ID is required'],
      trim: true,
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['CHECK_IN', 'CHECK_OUT', 'ACCESS', 'UNKNOWN'],
      default: 'CHECK_IN',
    },
    verificationType: {
      type: String,
      enum: ['FINGERPRINT', 'FACE', 'RFID', 'CARD', 'PIN', 'UNKNOWN'],
      default: 'UNKNOWN',
    },
    eventTime: {
      type: Date,
      required: true,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: [
        'RECEIVED',
        'PROCESSED',
        'DUPLICATE',
        'UNKNOWN_USER',
        'DEVICE_DISABLED',
        'MEMBERSHIP_DENIED',
        'PROCESSING_FAILED',
      ],
      default: 'RECEIVED',
      index: true,
    },
    accessAllowed: {
      type: Boolean,
      default: false,
    },
    failureReason: {
      type: String,
      default: null,
    },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'ClientAttendance',
      default: null,
    },
    rawData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    errorDetails: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound indexes for fast idempotency & duplicate checks
biometricEventLogSchema.index({ deviceId: 1, transactionId: 1 });
biometricEventLogSchema.index({ deviceId: 1, biometricUserId: 1, eventTime: -1 });
biometricEventLogSchema.index({ gymId: 1, processedAt: -1 });

export const BiometricEventLog = model<IBiometricEventLog>(
  'BiometricEventLog',
  biometricEventLogSchema
);
