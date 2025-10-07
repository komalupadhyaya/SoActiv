// controllers/client.controller.ts
import type { Request, Response } from 'express';
import { Client } from '../models/client.model';
import type { IClient } from '../models/client.model';
import type { FilterQuery } from 'mongoose';
import { Server as IOServer } from 'socket.io';

/**
 * Create a new client
 */
export const createClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
      return;
    }

    const allowedFields = {
      // Personal Info
      fullName: req.body.fullName,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      address: req.body.address,

      // Emergency Contact
      emergencyContactName: req.body.emergencyContactName,
      emergencyContactNumber: req.body.emergencyContactNumber,
      emergencyContactRelation: req.body.emergencyContactRelation,

      // Staff Assignment
      salesRep: req.body.salesRep,
      memberManager: req.body.memberManager,
      trainer: req.body.trainer,

      // Club & Membership
      attendanceId: req.body.attendanceId,
      clubId: req.body.clubId,
      gstNo: req.body.gstNo,

      // Membership Dates
      startDate: req.body.startDate,
      endDate: req.body.endDate,

      // Package & Add-ons
      packagePrice: req.body.packagePrice,
      hasPersonalTraining: req.body.hasPersonalTraining,
      personalTrainer: req.body.hasPersonalTraining ? req.body.personalTrainer : undefined,
      personalTrainingDurationWeeks: req.body.hasPersonalTraining ? req.body.personalTrainingDurationWeeks : undefined,
      personalTrainingPrice: req.body.hasPersonalTraining ? req.body.personalTrainingPrice : undefined,

      // Plan & Timing
      plan: req.body.plan,
      timing: req.body.timing,

      // Notifications
      notifications: req.body.notifications,
    };

    const newClient = new Client({
      ...allowedFields,
      userId,
    });

    const savedClient = await newClient.save();

    // ✅ Emit globally — no .to(userId)
  const clientData = {
  _id: savedClient._id.toString(), // ← Critical: ObjectId → string
  fullName: savedClient.fullName,
  email: savedClient.email,
  createdAt: savedClient.createdAt,
};

const io = (req as any).io as IOServer;
if (io) {
  console.log("🚀 EMITTING TO ALL CLIENTS:", "client:created", clientData);
  io.emit("client:created", clientData);
} else {
  console.error("❌ req.io is undefined! Socket not attached.");
}

    res.status(201).json({
      success: true,
      data: savedClient,
    });
  } catch (error: any) {
    console.error("🚨 FULL ERROR in createClient:", error);

    if (error.code === 11000) {
      const keys = Object.keys(error.keyValue || {});
      const field = keys.length > 0 ? keys[0] : 'field';

      const labelMap = {
        email: 'email address',
        contactNumber: 'phone number',
        attendanceId: 'attendance ID',
      };

      const label = labelMap[field as keyof typeof labelMap] || field;

      res.status(400).json({
        success: false,
        message: `A client with this ${label} already exists.`,
      });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Invalid data',
      error: error.message,
    });
  }
};

/**
 * Get all clients
 */
export const getAllClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { search, status, plan, timing } = req.query;
    const query: FilterQuery<IClient> = { userId };

    if (search) {
      query.$or = [
        { fullName: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { contactNumber: { $regex: search as string, $options: 'i' } },
      ];
    }

    if (['active', 'expired', 'pending'].includes(status as string)) {
      query.status = status;
    }

    if (['basic', 'premium'].includes(plan as string)) {
      query.plan = plan;
    }

    if (timing) {
      query.timing = { $regex: timing as string, $options: 'i' };
    }

    const clients = await Client.find(query)
      .sort({ createdAt: -1 })
      .populate([
        { path: 'salesRep', select: 'fullName' },
        { path: 'memberManager', select: 'fullName' },
        { path: 'trainer', select: 'fullName' },
        { path: 'personalTrainer', select: 'fullName' },
      ]);

    res.json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error: any) {
    console.error('🚨 Error in getAllClients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clients',
      error: error.message,
    });
  }
};

/**
 * Get client by ID
 */
export const getClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const client = await Client.findOne({ _id: id, userId }).populate([
      { path: 'salesRep', select: 'fullName' },
      { path: 'memberManager', select: 'fullName' },
      { path: 'trainer', select: 'fullName' },
      { path: 'personalTrainer', select: 'fullName' },
    ]);

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found or access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Update client
 */
export const updateClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const allowedUpdates = {
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

    Object.keys(allowedUpdates).forEach(
      (key) => (allowedUpdates[key as keyof typeof allowedUpdates] === undefined) && delete allowedUpdates[key as keyof typeof allowedUpdates]
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

    if (!updatedClient) {
      res.status(404).json({
        success: false,
        message: 'Client not found or access denied',
      });
      return;
    }

    // ✅ Emit globally
    const io = (req as any).io as IOServer;
    io.emit("client:updated", updatedClient);

    res.json({
      success: true,
      data: updatedClient,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Update results in duplicate email or phone number.',
      });
      return;
    }
    if (error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error during update',
      error: error.message,
    });
  }
};

/**
 * Delete client
 */
export const deleteClientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const deletedClient = await Client.findOneAndDelete({ _id: id, userId });

    if (!deletedClient) {
      res.status(404).json({
        success: false,
        message: 'Client not found or access denied',
      });
      return;
    }

    // ✅ Now safe to call .toString() after fixing IClient interface
    const io = (req as any).io as IOServer;
    io.emit("client:deleted", { id: deletedClient._id.toString() });

    res.json({
      success: true,
      message: 'Client deleted successfully',
      data: deletedClient,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Server error during deletion',
      error: error.message,
    });
  }
};