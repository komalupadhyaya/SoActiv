// biometric/biometric.service.ts

import moment from 'moment-timezone';
import { Types } from 'mongoose';
import { BiometricDevice } from '../models/biometricDevice.model';
import type { IBiometricDevice } from '../models/biometricDevice.model';
import { BiometricUser } from '../models/biometricUser.model';
import type { IBiometricUser } from '../models/biometricUser.model';
import { BiometricEventLog } from '../models/biometricEventLog.model';
import { Client } from '../models/client.model';
import type { IClient } from '../models/client.model';
import { ClientAttendance } from '../models/clientAttendance.model';
import type {
  NormalizedBiometricEvent,
  BiometricProcessingResult,
  BiometricReasonCode,
  BiometricProcessingStatus,
} from './biometric.types';
import { BiometricValidator } from './biometric.validation';
import { BIOMETRIC_CONSTANTS } from './biometric.constants';

export class BiometricService {
  /**
   * Main pipeline: Ingests and processes a normalized biometric event from ANY adapter/device.
   */
  public static async processBiometricEvent(
    event: NormalizedBiometricEvent
  ): Promise<BiometricProcessingResult> {
    const eventTime = event.eventTime ? new Date(event.eventTime) : new Date();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Validate Event Payload
    // ─────────────────────────────────────────────────────────────────────────
    const validation = BiometricValidator.validateEvent(event);
    if (!validation.isValid) {
      await this.createAuditLog({
        deviceSerialNumber: event.deviceSerialNumber,
        biometricUserId: event.biometricUserId || 'UNKNOWN',
        transactionId: event.transactionId,
        eventType: event.eventType || 'UNKNOWN',
        verificationType: event.verificationType || 'UNKNOWN',
        eventTime,
        processingStatus: 'PROCESSING_FAILED',
        accessAllowed: false,
        failureReason: 'INVALID_EVENT',
        errorDetails: validation.errors.join(', '),
        rawData: event.rawData || {},
      });

      return {
        success: false,
        accessAllowed: false,
        reason: 'INVALID_EVENT',
        message: `Invalid event payload: ${validation.errors.join('; ')}`,
        eventTime,
        eventType: event.eventType || 'UNKNOWN',
        verificationType: event.verificationType || 'UNKNOWN',
        transactionId: event.transactionId,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Find & Validate Biometric Device
    // ─────────────────────────────────────────────────────────────────────────
    let device: IBiometricDevice | null = null;

    if (event.deviceId && Types.ObjectId.isValid(event.deviceId)) {
      device = await BiometricDevice.findById(event.deviceId);
    }

    if (!device && event.deviceSerialNumber) {
      device = await BiometricDevice.findOne({
        serialNumber: event.deviceSerialNumber.trim().toUpperCase(),
      });
    }

    if (!device && event.deviceId) {
      // Fallback: lookup by serial number if deviceId passed as alphanumeric serial
      device = await BiometricDevice.findOne({
        serialNumber: event.deviceId.trim().toUpperCase(),
      });
    }

    if (!device) {
      await this.createAuditLog({
        deviceSerialNumber: event.deviceSerialNumber || event.deviceId,
        biometricUserId: event.biometricUserId,
        transactionId: event.transactionId,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        eventTime,
        processingStatus: 'PROCESSING_FAILED',
        accessAllowed: false,
        failureReason: 'DEVICE_NOT_FOUND',
        errorDetails: 'No registered device matches the provided deviceId / serialNumber',
        rawData: event.rawData || {},
      });

      return {
        success: false,
        accessAllowed: false,
        reason: 'DEVICE_NOT_FOUND',
        message: 'Biometric device is not registered in the system',
        eventTime,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        transactionId: event.transactionId,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Verify Device Status & Active State
    // ─────────────────────────────────────────────────────────────────────────
    if (!device.isActive || device.status === 'DISABLED') {
      await this.createAuditLog({
        deviceId: device._id,
        deviceSerialNumber: device.serialNumber,
        gymId: device.gymId,
        adminId: device.adminId,
        biometricUserId: event.biometricUserId,
        transactionId: event.transactionId,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        eventTime,
        processingStatus: 'DEVICE_DISABLED',
        accessAllowed: false,
        failureReason: 'DEVICE_DISABLED',
        errorDetails: `Device ${device.name} (${device.serialNumber}) is disabled`,
        rawData: event.rawData || {},
      });

      return {
        success: false,
        accessAllowed: false,
        reason: 'DEVICE_DISABLED',
        message: `Device ${device.name} is disabled`,
        deviceId: device._id.toString(),
        eventTime,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        transactionId: event.transactionId,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Idempotency & Duplicate Punch Prevention
    // ─────────────────────────────────────────────────────────────────────────
    // 4A: Check by Transaction ID if provided
    if (event.transactionId) {
      const existingTransaction = await BiometricEventLog.findOne({
        deviceId: device._id,
        transactionId: event.transactionId,
        processingStatus: { $in: ['PROCESSED', 'DUPLICATE'] },
      });

      if (existingTransaction) {
        await this.createAuditLog({
          deviceId: device._id,
          deviceSerialNumber: device.serialNumber,
          gymId: device.gymId,
          adminId: device.adminId,
          memberId: existingTransaction.memberId,
          biometricUserId: event.biometricUserId,
          transactionId: event.transactionId,
          eventType: event.eventType,
          verificationType: event.verificationType || 'UNKNOWN',
          eventTime,
          processingStatus: 'DUPLICATE',
          accessAllowed: false,
          failureReason: 'DUPLICATE_EVENT',
          errorDetails: `Duplicate transaction ID: ${event.transactionId}`,
          rawData: event.rawData || {},
        });

        return {
          success: false,
          accessAllowed: false,
          reason: 'DUPLICATE_EVENT',
          message: `Transaction ${event.transactionId} has already been processed`,
          deviceId: device._id.toString(),
          memberId: existingTransaction.memberId?.toString(),
          eventTime,
          eventType: event.eventType,
          verificationType: event.verificationType || 'UNKNOWN',
          transactionId: event.transactionId,
        };
      }
    }

    // 4B: Debounce Window Fallback (prevents rapid multiple punches)
    const duplicateWindowSeconds =
      device.duplicateWindowSeconds || BIOMETRIC_CONSTANTS.DEFAULT_DUPLICATE_WINDOW_SECONDS;
    if (duplicateWindowSeconds > 0) {
      const windowStart = new Date(eventTime.getTime() - duplicateWindowSeconds * 1000);
      const windowEnd = new Date(eventTime.getTime() + duplicateWindowSeconds * 1000);

      const recentPunch = await BiometricEventLog.findOne({
        deviceId: device._id,
        biometricUserId: event.biometricUserId,
        eventTime: { $gte: windowStart, $lte: windowEnd },
        processingStatus: 'PROCESSED',
      });

      if (recentPunch) {
        await this.createAuditLog({
          deviceId: device._id,
          deviceSerialNumber: device.serialNumber,
          gymId: device.gymId,
          adminId: device.adminId,
          memberId: recentPunch.memberId,
          biometricUserId: event.biometricUserId,
          transactionId: event.transactionId,
          eventType: event.eventType,
          verificationType: event.verificationType || 'UNKNOWN',
          eventTime,
          processingStatus: 'DUPLICATE',
          accessAllowed: false,
          failureReason: 'DUPLICATE_EVENT',
          errorDetails: `Duplicate punch received within ${duplicateWindowSeconds}s window`,
          rawData: event.rawData || {},
        });

        return {
          success: false,
          accessAllowed: false,
          reason: 'DUPLICATE_EVENT',
          message: `Duplicate punch ignored within ${duplicateWindowSeconds}s debounce window`,
          deviceId: device._id.toString(),
          memberId: recentPunch.memberId?.toString(),
          eventTime,
          eventType: event.eventType,
          verificationType: event.verificationType || 'UNKNOWN',
          transactionId: event.transactionId,
        };
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Update Device Communication Health
    // ─────────────────────────────────────────────────────────────────────────
    device.lastCommunicationAt = new Date();
    device.status = 'ONLINE';
    await device.save();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Identify Biometric User (Device + biometricUserId)
    // ─────────────────────────────────────────────────────────────────────────
    const biometricUser = await BiometricUser.findOne({
      deviceId: device._id,
      biometricUserId: String(event.biometricUserId).trim(),
      status: 'active',
    });

    if (!biometricUser) {
      await this.createAuditLog({
        deviceId: device._id,
        deviceSerialNumber: device.serialNumber,
        gymId: device.gymId,
        adminId: device.adminId,
        biometricUserId: event.biometricUserId,
        transactionId: event.transactionId,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        eventTime,
        processingStatus: 'UNKNOWN_USER',
        accessAllowed: false,
        failureReason: 'BIOMETRIC_USER_NOT_REGISTERED',
        errorDetails: `No active member mapping for biometric user ID: ${event.biometricUserId} on device: ${device.name}`,
        rawData: event.rawData || {},
      });

      return {
        success: false,
        accessAllowed: false,
        reason: 'BIOMETRIC_USER_NOT_REGISTERED',
        message: `Biometric user ID ${event.biometricUserId} is not mapped to any member on this device`,
        deviceId: device._id.toString(),
        eventTime,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        transactionId: event.transactionId,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 7: Identify Associated Gym Member (Client)
    // ─────────────────────────────────────────────────────────────────────────
    const member = await Client.findById(biometricUser.memberId);

    if (!member) {
      await this.createAuditLog({
        deviceId: device._id,
        deviceSerialNumber: device.serialNumber,
        gymId: device.gymId,
        adminId: device.adminId,
        memberId: biometricUser.memberId,
        biometricUserId: event.biometricUserId,
        transactionId: event.transactionId,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        eventTime,
        processingStatus: 'MEMBERSHIP_DENIED',
        accessAllowed: false,
        failureReason: 'MEMBER_NOT_FOUND',
        errorDetails: `Mapped client record ${biometricUser.memberId} no longer exists`,
        rawData: event.rawData || {},
      });

      return {
        success: false,
        accessAllowed: false,
        reason: 'MEMBER_NOT_FOUND',
        message: 'Associated gym member profile was not found',
        deviceId: device._id.toString(),
        eventTime,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        transactionId: event.transactionId,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 8: Membership & Access Validation
    // ─────────────────────────────────────────────────────────────────────────
    const accessCheck = this.validateMemberAccess(member, eventTime);

    if (!accessCheck.allowed) {
      await this.createAuditLog({
        deviceId: device._id,
        deviceSerialNumber: device.serialNumber,
        gymId: device.gymId,
        adminId: device.adminId,
        memberId: new Types.ObjectId(member._id as string),
        biometricUserId: event.biometricUserId,
        transactionId: event.transactionId,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        eventTime,
        processingStatus: 'MEMBERSHIP_DENIED',
        accessAllowed: false,
        failureReason: accessCheck.reason,
        errorDetails: accessCheck.message,
        rawData: event.rawData || {},
      });

      return {
        success: false,
        accessAllowed: false,
        reason: accessCheck.reason,
        message: accessCheck.message,
        deviceId: device._id.toString(),
        memberId: member._id.toString(),
        memberName: member.fullName,
        eventTime,
        eventType: event.eventType,
        verificationType: event.verificationType || 'UNKNOWN',
        transactionId: event.transactionId,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 9: Create / Update Attendance Record in ClientAttendance
    // ─────────────────────────────────────────────────────────────────────────
    const attendanceRecord = await this.recordAttendance({
      clientId: new Types.ObjectId(member._id as string),
      adminId: member.userId
        ? (member.userId instanceof Types.ObjectId ? member.userId : new Types.ObjectId(member.userId as unknown as string))
        : device.adminId,
      eventTime,
      eventType: event.eventType,
      sourceDeviceName: device.name,
    });

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 10: Record Audit Event Log
    // ─────────────────────────────────────────────────────────────────────────
    await this.createAuditLog({
      deviceId: device._id,
      deviceSerialNumber: device.serialNumber,
      gymId: device.gymId,
      adminId: device.adminId,
      memberId: new Types.ObjectId(member._id as string),
      biometricUserId: event.biometricUserId,
      transactionId: event.transactionId,
      eventType: event.eventType,
      verificationType: event.verificationType || 'UNKNOWN',
      eventTime,
      processingStatus: 'PROCESSED',
      accessAllowed: true,
      failureReason: null,
      attendanceId: attendanceRecord?._id,
      rawData: event.rawData || {},
    });

    // Update BiometricUser sync timestamp
    biometricUser.lastSyncedAt = new Date();
    await biometricUser.save();

    return {
      success: true,
      accessAllowed: true,
      reason: 'ACCESS_ALLOWED',
      message: `Access granted for ${member.fullName}`,
      deviceId: device._id.toString(),
      memberId: member._id.toString(),
      memberName: member.fullName,
      attendanceId: attendanceRecord?._id ? attendanceRecord._id.toString() : undefined,
      eventTime,
      eventType: event.eventType,
      verificationType: event.verificationType || 'UNKNOWN',
      transactionId: event.transactionId,
    };
  }

  /**
   * Membership Access Rule Engine
   */
  public static validateMemberAccess(
    member: IClient,
    checkDate: Date = new Date()
  ): { allowed: boolean; reason: BiometricReasonCode; message: string } {
    if (member.status === 'inactive') {
      return {
        allowed: false,
        reason: 'MEMBERSHIP_INACTIVE',
        message: 'Member account is currently inactive',
      };
    }

    // Check if member has active freezes
    if (member.freezes && Array.isArray(member.freezes) && member.freezes.length > 0) {
      const isFrozen = member.freezes.some((f: any) => {
        if (!f || f.status === 'canceled') return false;
        const fStart = f.startDate ? new Date(f.startDate) : null;
        const fEnd = f.endDate ? new Date(f.endDate) : null;
        if (fStart && fEnd) {
          return checkDate >= fStart && checkDate <= fEnd;
        }
        return false;
      });

      if (isFrozen) {
        return {
          allowed: false,
          reason: 'MEMBERSHIP_FROZEN',
          message: 'Membership is currently frozen',
        };
      }
    }

    // Check Start Date
    if (member.startDate) {
      const start = new Date(member.startDate);
      start.setHours(0, 0, 0, 0);
      if (checkDate < start) {
        return {
          allowed: false,
          reason: 'MEMBERSHIP_NOT_STARTED',
          message: `Membership plan begins on ${moment(start).format('DD-MM-YYYY')}`,
        };
      }
    }

    // Check Expiry Date
    if (member.endDate) {
      const end = new Date(member.endDate);
      end.setHours(23, 59, 59, 999);
      if (checkDate > end || member.status === 'expired') {
        return {
          allowed: false,
          reason: 'MEMBERSHIP_EXPIRED',
          message: 'Membership plan has expired',
        };
      }
    }

    if (member.status !== 'active') {
      return {
        allowed: false,
        reason: 'NO_ACTIVE_MEMBERSHIP',
        message: `Membership status is ${member.status}`,
      };
    }

    return {
      allowed: true,
      reason: 'ACCESS_ALLOWED',
      message: 'Membership active and valid',
    };
  }

  /**
   * Seamlessly creates/updates records in the existing ClientAttendance collection
   */
  private static async recordAttendance(params: {
    clientId: Types.ObjectId;
    adminId: Types.ObjectId;
    eventTime: Date;
    eventType: string;
    sourceDeviceName: string;
  }) {
    const { clientId, adminId, eventTime, eventType, sourceDeviceName } = params;
    const todayNormalized = moment(eventTime).tz(BIOMETRIC_CONSTANTS.TIMEZONE).startOf('day').toDate();

    let record = await ClientAttendance.findOne({
      clientId,
      date: todayNormalized,
    });

    if (!record) {
      // First punch of the day: create attendance record
      record = await ClientAttendance.create({
        clientId,
        adminId,
        date: todayNormalized,
        checkInTime: eventTime,
        status: 'present',
        notes: `Biometric Entry (${sourceDeviceName})`,
      });
    } else {
      // Subsequent punch on same day: update check-out if appropriate
      if (eventType === 'CHECK_OUT' || (record.checkInTime && !record.checkOutTime)) {
        record.checkOutTime = eventTime;
        record.notes = (record.notes ? record.notes + ' | ' : '') + `Biometric Exit (${sourceDeviceName})`;
        await record.save();
      }
    }

    return record;
  }

  /**
   * Helper to write raw & processed audit event logs
   */
  public static async createAuditLog(params: {
    deviceId?: Types.ObjectId | null;
    deviceSerialNumber?: string;
    gymId?: Types.ObjectId | null;
    adminId?: Types.ObjectId | null;
    memberId?: Types.ObjectId | null;
    biometricUserId: string;
    transactionId?: string | null;
    eventType: string;
    verificationType?: string;
    eventTime: Date;
    processingStatus: BiometricProcessingStatus;
    accessAllowed: boolean;
    failureReason?: string | null;
    attendanceId?: Types.ObjectId | null;
    rawData?: Record<string, any>;
    errorDetails?: string | null;
  }) {
    try {
      return await BiometricEventLog.create({
        ...params,
        eventType: params.eventType || 'UNKNOWN',
        verificationType: params.verificationType || 'UNKNOWN',
        processedAt: new Date(),
      });
    } catch (err) {
      console.error('⚠️ Failed to write biometric audit log:', err);
      return null;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DEVICE MANAGEMENT METHODS
  // ───────────────────────────────────────────────────────────────────────────

  public static async registerDevice(data: {
    name: string;
    gymId: string;
    adminId: string;
    manufacturer?: string;
    model?: string;
    serialNumber: string;
    deviceType?: any;
    connectionType?: any;
    ipAddress?: string;
    port?: number;
    duplicateWindowSeconds?: number;
    metadata?: Record<string, any>;
  }) {
    const serial = data.serialNumber.trim().toUpperCase();
    const existing = await BiometricDevice.findOne({
      gymId: data.gymId,
      serialNumber: serial,
    });

    if (existing) {
      throw new Error(`Device with serial number ${serial} is already registered in this gym branch`);
    }

    return await BiometricDevice.create({
      ...data,
      serialNumber: serial,
      status: 'ONLINE',
      isActive: true,
    });
  }

  public static async updateDevice(id: string, data: Partial<IBiometricDevice>) {
    if (data.serialNumber) {
      data.serialNumber = String(data.serialNumber).trim().toUpperCase();
    }
    return await BiometricDevice.findByIdAndUpdate(id, data, { new: true });
  }

  public static async getDevices(filter: { gymId?: string; adminId?: string; isActive?: boolean }) {
    const query: any = {};
    if (filter.gymId) query.gymId = filter.gymId;
    if (filter.adminId) query.adminId = filter.adminId;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    return await BiometricDevice.find(query).sort({ createdAt: -1 });
  }

  public static async getDeviceById(id: string) {
    return await BiometricDevice.findById(id);
  }

  public static async deleteDevice(id: string) {
    // Also remove or suspend associated user mappings
    await BiometricUser.deleteMany({ deviceId: id });
    return await BiometricDevice.findByIdAndDelete(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BIOMETRIC USER MAPPING METHODS
  // ───────────────────────────────────────────────────────────────────────────

  public static async mapBiometricUser(data: {
    memberId: string;
    deviceId: string;
    gymId: string;
    adminId: string;
    biometricUserId: string;
    status?: 'active' | 'suspended';
    metadata?: Record<string, any>;
  }) {
    const bUid = String(data.biometricUserId).trim();

    // Verify Member exists
    const member = await Client.findById(data.memberId);
    if (!member) {
      throw new Error('Member (Client) profile does not exist');
    }

    // Verify Device exists
    const device = await BiometricDevice.findById(data.deviceId);
    if (!device) {
      throw new Error('Biometric device does not exist');
    }

    // Check existing mapping on this device
    const existing = await BiometricUser.findOne({
      deviceId: data.deviceId,
      biometricUserId: bUid,
    });

    if (existing) {
      if (existing.memberId.toString() === data.memberId) {
        existing.status = data.status || 'active';
        existing.metadata = data.metadata || existing.metadata;
        return await existing.save();
      } else {
        throw new Error(
          `Biometric user ID ${bUid} on device "${device.name}" is already mapped to another member`
        );
      }
    }

    return await BiometricUser.create({
      memberId: data.memberId,
      deviceId: data.deviceId,
      gymId: data.gymId || device.gymId,
      adminId: data.adminId || device.adminId,
      biometricUserId: bUid,
      status: data.status || 'active',
      enrolledAt: new Date(),
      metadata: data.metadata || {},
    });
  }

  public static async getBiometricUsers(filter: {
    deviceId?: string;
    memberId?: string;
    gymId?: string;
    adminId?: string;
  }) {
    const query: any = {};
    if (filter.deviceId) query.deviceId = filter.deviceId;
    if (filter.memberId) query.memberId = filter.memberId;
    if (filter.gymId) query.gymId = filter.gymId;
    if (filter.adminId) query.adminId = filter.adminId;

    return await BiometricUser.find(query)
      .populate('memberId', 'fullName email contactNumber status startDate endDate plan')
      .populate('deviceId', 'name serialNumber status deviceType')
      .sort({ createdAt: -1 });
  }

  public static async removeBiometricUser(id: string) {
    return await BiometricUser.findByIdAndDelete(id);
  }
}
