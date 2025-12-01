// controllers/client.controller.ts
import type { Request, Response } from 'express';
import { Client } from '../models/client.model';
import type { IClient } from '../models/client.model';
import type { FilterQuery, UpdateQuery } from 'mongoose';
import { Server as IOServer } from 'socket.io';
import { asyncHandler } from '../lib/AsyncHandler';

/**
 * Helper to get logged-in user ID
 */
const getUserId = (req: Request): string => {
  const userId = (req as any).user?.id;
  if (!userId) throw new Error('Unauthorized: User not authenticated');
  return userId;
};

/**
 * Socket Emit Helper
 */
const emitToUserRoom = (req: Request, event: string, data: any) => {
  const io = (req as any).io as IOServer;
  const userId = (req as any).user?.id;
  if (io && userId) {
    io.to(userId).emit(event, data);
  }
};

/**
 * CREATE CLIENT
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);

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

  const newClient = new Client({ ...allowedFields, userId });
  const savedClient = await newClient.save();

  // Emit event scoped to user
  emitToUserRoom(req, 'client:created', savedClient);

  res.status(201).json({ success: true, data: savedClient });
});

/**
 * GET ALL CLIENTS
 */
export const getAllClients = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { search, status, plan, timing } = req.query;

  const query: FilterQuery<IClient> = { userId };

  if (search) {
    query.$or = [
      { fullName: { $regex: search as string, $options: 'i' } },
      { email: { $regex: search as string, $options: 'i' } },
      { contactNumber: { $regex: search as string, $options: 'i' } },
    ];
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
  const userId = getUserId(req);
  const { id } = req.params;

  const client = await Client.findOne({ _id: id, userId }).populate([
    { path: 'salesRep', select: 'fullName' },
    { path: 'memberManager', select: 'fullName' },
    { path: 'trainer', select: 'fullName' },
    { path: 'personalTrainer', select: 'fullName' },
  ]);

  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

  res.json({ success: true, data: client });
});

/**
 * UPDATE CLIENT
 */
export const updateClientById = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

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
    { _id: id, userId },
    allowedUpdates,
    { new: true, runValidators: true }
  ).populate([
    { path: 'salesRep', select: 'fullName' },
    { path: 'memberManager', select: 'fullName' },
    { path: 'trainer', select: 'fullName' },
    { path: 'personalTrainer', select: 'fullName' },
  ]);

  if (!updatedClient) return res.status(404).json({ success: false, message: 'Client not found' });

  emitToUserRoom(req, 'client:updated', updatedClient);

  res.json({ success: true, data: updatedClient });
});

/**
 * DELETE CLIENT
 */
export const deleteClientById = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const deletedClient = await Client.findOneAndDelete({ _id: id, userId });
  if (!deletedClient) return res.status(404).json({ success: false, message: 'Client not found' });

  emitToUserRoom(req, 'client:deleted', { id: deletedClient._id.toString() });

  res.json({ success: true, message: 'Client deleted successfully', data: deletedClient });
});
