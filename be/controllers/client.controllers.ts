// controllers/client.controller.ts
import type { Request, Response } from 'express';
import { Client } from '../models/client.model';
import { Staff } from '../models/staff.model';
import type { IClient } from '../models/client.model';
import type { FilterQuery, UpdateQuery } from 'mongoose';
import { Server as IOServer } from 'socket.io';
import { asyncHandler } from '../lib/AsyncHandler';

/**
 * Helper to get the Organization Owner ID (Admin ID)
 * - If user is Admin/Superadmin: returns their own ID.
 * - If user is Staff: returns the 'createdBy' ID (which is the Admin).
 */
export const getOwnerId = async (req: Request): Promise<string> => {
  const user = (req as any).user;
  if (!user) throw new Error('Unauthorized: User not authenticated');

  // If user is Admin or Superadmin, they ARE the owner
  if (user.role === 'admin' || user.role === 'superadmin') {
    return user.id;
  }

  // If user is Staff, find their Staff record to get the Owner (createdBy)
  if (user.role === 'staff' || user.role === 'trainer') {
    // Check if staffId is already in user object (from auth middleware)
    // If not, fetch it.
    const staffId = user.staffId;
    if (staffId) {
      const staff = await Staff.findById(staffId).select('createdBy');
      if (staff && staff.createdBy) return staff.createdBy.toString();
    }

    // Fallback if staffId missing or lookup failed (shouldn't happen with correct middleware)
    const staffDoc = await Staff.findOne({ userId: user.id }).select('createdBy');
    if (!staffDoc) throw new Error('Staff record not found for this user');
    return staffDoc.createdBy.toString();
  }

  // Default fallback (should be unreachable given auth middleware)
  return user.id;
};

/**
 * Socket Emit Helper
 */
const emitToUserRoom = (req: Request, ownerId: string, event: string, data: any) => {
  const io = (req as any).io as IOServer;
  if (io && ownerId) {
    // Emit to the Owner's room so Admin sees updates immediately
    io.to(ownerId).emit(event, data);
  }
};

/**
 * CREATE CLIENT
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  // 1. Resolve true Owner ID
  const ownerId = await getOwnerId(req);

  // 2. Uniqueness Check (Explicit)
  const existingClient = await Client.findOne({
    userId: ownerId,
    $or: [{ email: req.body.email }, { contactNumber: req.body.contactNumber }],
  });

  if (existingClient) {
    if (existingClient.email === req.body.email) {
      return res.status(400).json({ success: false, message: 'Client with this email already exists' });
    }
    return res.status(400).json({ success: false, message: 'Client with this contact number already exists' });
  }

  const allowedFields: Partial<IClient> = {
    fullName: req.body.fullName,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    email: req.body.email,
    contactNumber: req.body.contactNumber,
    address: req.body.address,

    emergencyContactName: req.body.emergencyContactName,
    emergencyContactNumber: req.body.emergencyContactNumber,
    emergencyContactRelation: req.body.emergencyContactRelation,

    salesRep: req.body.salesRep,
    memberManager: req.body.memberManager,
    trainer: req.body.trainer,

    attendanceId: req.body.attendanceId,
    clubId: req.body.clubId,
    gstNo: req.body.gstNo,

    startDate: req.body.startDate,
    endDate: req.body.endDate,

    packagePrice: req.body.packagePrice,
    hasPersonalTraining: req.body.hasPersonalTraining || false,
    personalTrainer: req.body.hasPersonalTraining ? req.body.personalTrainer : undefined,
    personalTrainingDurationWeeks: req.body.hasPersonalTraining ? req.body.personalTrainingDurationWeeks : undefined,
    personalTrainingPrice: req.body.hasPersonalTraining ? req.body.personalTrainingPrice : undefined,

    plan: req.body.plan,
    timing: req.body.timing,
    notifications: req.body.notifications || { sms: true, email: true, push: true, whatsapp: true },
  };

  // 3. Create client attached to Owner ID
  const newClient = new Client({ ...allowedFields, userId: ownerId });
  const savedClient = await newClient.save();

  // 4. Emit event to Owner's room
  emitToUserRoom(req, ownerId, 'client:created', savedClient);

  res.status(201).json({ success: true, data: savedClient });
});

/**
 * GET ALL CLIENTS
 */
export const getAllClients = asyncHandler(async (req: Request, res: Response) => {
  // 1. Resolve true Owner ID
  const ownerId = await getOwnerId(req);
  const user = (req as any).user;

  // 2. Determine Scope based on Role/Position
  let extraFilter: any = {};

  if (user.role === 'staff' || user.role === 'trainer') {
    const staffId = user.staffId;

    // Strict isolation for Trainer and Sales
    if (user.position === 'trainer') {
      extraFilter = {
        $or: [
          { trainer: staffId },
          { personalTrainer: staffId }
        ]
      };
    } else if (user.position === 'sales') {
      extraFilter = { salesRep: staffId };
    }
    // Managers/Receptionists see all clients of the Owner
  }

  // 3. Build Query
  const { search, status, plan, timing } = req.query;
  const baseQuery: FilterQuery<IClient> = { userId: ownerId, ...extraFilter };
  const query: FilterQuery<IClient> = { ...baseQuery };

  if (search) {
    query.$and = [
      baseQuery, // Ensure scope is always applied
      {
        $or: [
          { fullName: { $regex: search as string, $options: 'i' } },
          { email: { $regex: search as string, $options: 'i' } },
          { contactNumber: { $regex: search as string, $options: 'i' } },
        ]
      }
    ];
  } else {
    // Direct merge if no simple search, to prevent empty $and
    Object.assign(query, baseQuery);
  }

  if (['active', 'expired', 'pending'].includes(status as string)) query.status = status as any;
  if (['basic', 'premium'].includes(plan as string)) query.plan = plan as any;
  if (timing) query.timing = { $regex: timing as string, $options: 'i' };

  const clients = await Client.find(query)
    .sort({ createdAt: -1 })
    .populate([
      { path: 'salesRep', select: 'fullName' },
      { path: 'memberManager', select: 'fullName' },
      { path: 'trainer', select: 'fullName' },
      { path: 'personalTrainer', select: 'fullName' },
    ]);

  res.json({ success: true, count: clients.length, data: clients });
});

/**
 * GET CLIENT BY ID
 */
export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = await getOwnerId(req);
  const { id } = req.params;

  // IMPORTANT: Ensure we only fetch if userId matches Owner ID
  const client = await Client.findOne({ _id: id, userId: ownerId }).populate([
    { path: 'salesRep', select: 'fullName' },
    { path: 'memberManager', select: 'fullName' },
    { path: 'trainer', select: 'fullName' },
    { path: 'personalTrainer', select: 'fullName' },
  ]);

  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

  // TODO: Add strict read permission check for Trainer/Sales if necessary here too,
  // currently assuming if they have ID they can view details (common pattern)

  res.json({ success: true, data: client });
});

/**
 * UPDATE CLIENT
 */
export const updateClientById = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = await getOwnerId(req);
  const { id } = req.params;

  // Uniqueness Check on Update (if email/phone changed)
  if (req.body.email || req.body.contactNumber) {
    const existingClient = await Client.findOne({
      userId: ownerId,
      _id: { $ne: id }, // Exclude current client
      $or: [
        ...(req.body.email ? [{ email: req.body.email }] : []),
        ...(req.body.contactNumber ? [{ contactNumber: req.body.contactNumber }] : [])
      ],
    });

    if (existingClient) {
      if (req.body.email && existingClient.email === req.body.email) {
        return res.status(400).json({ success: false, message: 'Client with this email already exists' });
      }
      return res.status(400).json({ success: false, message: 'Client with this contact number already exists' });
    }
  }

  const allowedUpdates: UpdateQuery<IClient> = {
    fullName: req.body.fullName,
    gender: req.body.gender,
    dateOfBirth: req.body.dateOfBirth,
    email: req.body.email,
    contactNumber: req.body.contactNumber,
    address: req.body.address,
    emergencyContactName: req.body.emergencyContactName,
    emergencyContactNumber: req.body.emergencyContactNumber,
    emergencyContactRelation: req.body.emergencyContactRelation,
    salesRep: req.body.salesRep,
    memberManager: req.body.memberManager,
    trainer: req.body.trainer,
    attendanceId: req.body.attendanceId,
    clubId: req.body.clubId,
    gstNo: req.body.gstNo,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    packagePrice: req.body.packagePrice,
    hasPersonalTraining: req.body.hasPersonalTraining,
    personalTrainer: req.body.hasPersonalTraining ? req.body.personalTrainer : undefined,
    personalTrainingDurationWeeks: req.body.hasPersonalTraining ? req.body.personalTrainingDurationWeeks : undefined,
    personalTrainingPrice: req.body.hasPersonalTraining ? req.body.personalTrainingPrice : undefined,
    plan: req.body.plan,
    timing: req.body.timing,
    notifications: req.body.notifications,
  };

  // Remove undefined fields
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key as keyof typeof allowedUpdates] === undefined && delete allowedUpdates[key as keyof typeof allowedUpdates]
  );

  const updatedClient = await Client.findOneAndUpdate(
    { _id: id, userId: ownerId },
    allowedUpdates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'salesRep', select: 'fullName' },
    { path: 'memberManager', select: 'fullName' },
    { path: 'trainer', select: 'fullName' },
    { path: 'personalTrainer', select: 'fullName' },
  ]);

  if (!updatedClient) return res.status(404).json({ success: false, message: 'Client not found' });

  emitToUserRoom(req, ownerId, 'client:updated', updatedClient);

  res.json({ success: true, data: updatedClient });
});

/**
 * DELETE CLIENT
 */
export const deleteClientById = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = await getOwnerId(req);
  const { id } = req.params;

  const deletedClient = await Client.findOneAndDelete({ _id: id, userId: ownerId });
  if (!deletedClient) return res.status(404).json({ success: false, message: 'Client not found' });

  emitToUserRoom(req, ownerId, 'client:deleted', { id: deletedClient._id.toString() });

  res.json({ success: true, message: 'Client deleted successfully', data: deletedClient });
});
