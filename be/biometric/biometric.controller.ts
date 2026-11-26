// biometric/biometric.controller.ts

import type { Request, Response } from 'express';
import { BiometricService } from './biometric.service';
import { genericBiometricAdapter } from './adapters/generic.adapter';
import { BiometricDevice } from '../models/biometricDevice.model';
import { BiometricUser } from '../models/biometricUser.model';
import { BiometricEventLog } from '../models/biometricEventLog.model';
import { ClientAttendance } from '../models/clientAttendance.model';
import ApiResponse from '../lib/ApiResponse';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';
import { asyncHandler } from '../lib/AsyncHandler';

export class BiometricController {
  /**
   * POST /api/v1/biometric/events
   * Ingest biometric event from device adapter / connector
   */
  public static handleBiometricEvent = asyncHandler(async (req: Request, res: Response) => {
    // 1. Adapter normalizes raw incoming payload
    const normalizedEvent = genericBiometricAdapter.normalizeEvent(req.body);

    // 2. Process via generic business service
    const result = await BiometricService.processBiometricEvent(normalizedEvent);

    const statusCode = result.success ? HttpStatusCode.OK : HttpStatusCode.OK;
    return res
      .status(statusCode)
      .json(new ApiResponse(statusCode, result, result.message));
  });

  /**
   * POST /api/v1/biometric/test-event
   * Mock test endpoint - runs through the EXACT SAME business service pipeline
   */
  public static handleTestEvent = asyncHandler(async (req: Request, res: Response) => {
    const normalizedEvent = genericBiometricAdapter.normalizeEvent(req.body);
    const result = await BiometricService.processBiometricEvent(normalizedEvent);

    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, result, result.message));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // DEVICE MANAGEMENT CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────

  public static createDevice = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { name, serialNumber, gymId, manufacturer, model, deviceType, connectionType, ipAddress, port, duplicateWindowSeconds, metadata } = req.body;

    if (!name || !serialNumber) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Device name and serial number are required');
    }

    const device = await BiometricService.registerDevice({
      name,
      serialNumber,
      gymId: gymId || user.gym,
      adminId: user.id || user._id,
      manufacturer,
      model,
      deviceType,
      connectionType,
      ipAddress,
      port,
      duplicateWindowSeconds,
      metadata,
    });

    return res
      .status(HttpStatusCode.CREATED)
      .json(new ApiResponse(HttpStatusCode.CREATED, device, 'Biometric device registered successfully'));
  });

  public static getDevices = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { gymId, isActive } = req.query;

    const filter: any = {};
    if (user.role !== 'superadmin') {
      filter.adminId = user.id || user._id;
      if (user.gym) filter.gymId = user.gym;
    }
    if (gymId) filter.gymId = gymId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const devices = await BiometricService.getDevices(filter);
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, devices, 'Devices fetched successfully'));
  });

  public static getDeviceById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    const device = await BiometricService.getDeviceById(id);
    if (!device) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, 'Device not found');
    }
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, device, 'Device details fetched successfully'));
  });

  public static updateDevice = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    const updated = await BiometricService.updateDevice(id, req.body);
    if (!updated) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, 'Device not found');
    }
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, updated, 'Device updated successfully'));
  });

  public static deleteDevice = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    const deleted = await BiometricService.deleteDevice(id);
    if (!deleted) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, 'Device not found');
    }
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, null, 'Device deleted successfully'));
  });

  public static getDeviceStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const device = await BiometricDevice.findById(id).select(
      'name serialNumber status isActive lastPingAt lastCommunicationAt'
    );
    if (!device) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, 'Device not found');
    }
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, device, 'Device status fetched successfully'));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // BIOMETRIC USER MAPPING CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────

  public static createBiometricUser = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { memberId, deviceId, biometricUserId, gymId, status, metadata } = req.body;

    if (!memberId || !deviceId || !biometricUserId) {
      throw new ApiError(HttpStatusCode.BAD_REQUEST, 'memberId, deviceId, and biometricUserId are required');
    }

    const mapping = await BiometricService.mapBiometricUser({
      memberId,
      deviceId,
      gymId: gymId || user.gym,
      adminId: user.id || user._id,
      biometricUserId,
      status,
      metadata,
    });

    return res
      .status(HttpStatusCode.CREATED)
      .json(new ApiResponse(HttpStatusCode.CREATED, mapping, 'Biometric user mapped successfully'));
  });

  public static getBiometricUsers = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { deviceId, memberId, gymId } = req.query;

    const filter: any = {};
    if (user.role !== 'superadmin') {
      filter.adminId = user.id || user._id;
      if (user.gym) filter.gymId = user.gym;
    }
    if (deviceId) filter.deviceId = deviceId as string;
    if (memberId) filter.memberId = memberId as string;
    if (gymId) filter.gymId = gymId as string;

    const users = await BiometricService.getBiometricUsers(filter);
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, users, 'Biometric user mappings fetched successfully'));
  });

  public static updateBiometricUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await BiometricUser.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, 'Biometric user mapping not found');
    }
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, updated, 'Mapping updated successfully'));
  });

  public static deleteBiometricUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    const deleted = await BiometricService.removeBiometricUser(id);
    if (!deleted) {
      throw new ApiError(HttpStatusCode.NOT_FOUND, 'Biometric user mapping not found');
    }
    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, null, 'Mapping removed successfully'));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIT LOGS & ATTENDANCE QUERY CONTROLLERS
  // ─────────────────────────────────────────────────────────────────────────

  public static getEventLogs = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { deviceId, memberId, processingStatus, accessAllowed, limit = '50', page = '1' } = req.query;

    const query: any = {};
    if (user.role !== 'superadmin') {
      query.adminId = user.id || user._id;
      if (user.gym) query.gymId = user.gym;
    }
    if (deviceId) query.deviceId = deviceId;
    if (memberId) query.memberId = memberId;
    if (processingStatus) query.processingStatus = processingStatus;
    if (accessAllowed !== undefined) query.accessAllowed = accessAllowed === 'true';

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      BiometricEventLog.find(query)
        .populate('deviceId', 'name serialNumber')
        .populate('memberId', 'fullName email contactNumber')
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      BiometricEventLog.countDocuments(query),
    ]);

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          logs,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        },
        'Biometric audit event logs fetched successfully'
      )
    );
  });

  public static getBiometricAttendance = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { startDate, endDate, clientId } = req.query;

    const query: any = {};
    if (user.role !== 'superadmin') {
      query.adminId = user.id || user._id;
    }
    if (clientId) query.clientId = clientId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const records = await ClientAttendance.find(query)
      .populate('clientId', 'fullName email contactNumber plan status')
      .sort({ date: -1, checkInTime: -1 })
      .limit(100);

    return res
      .status(HttpStatusCode.OK)
      .json(new ApiResponse(HttpStatusCode.OK, records, 'Biometric attendance fetched successfully'));
  });
}
