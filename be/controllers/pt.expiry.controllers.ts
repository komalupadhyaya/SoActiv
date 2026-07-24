// controllers/pt.expiry.controllers.ts

import type { Request, Response } from 'express';
import { Client } from '../models/client.model';

/**
 * @route   GET /api/v1/client/pt-expiring
 * @desc    Get all clients with PT packages that are expiring soon or already expired
 * @access  Private (Admin, Trainer)
 */
export const getExpiringPTPackages = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query; // Default: show PT expiring within 7 days
    const daysThreshold = parseInt(days as string, 10);
    const ownerId = user.adminId || user.id || user._id;

    // Build filter for clients with PT
    const filter: any = {
      userId: ownerId,
      hasPersonalTraining: true,
    };

    // If user is a trainer, only show their clients
    if (user.role === 'trainer') {
      filter.trainer = user._id;
    }

    // Get all clients with PT
    const clientsWithPT = await Client.find(filter)
      .populate('trainer', 'fullName position email')
      .populate('personalTrainer', 'fullName position email')
      .sort({ endDate: 1 });

    // Calculate PT expiry status
    const today = new Date();
    const ptExpiryData = clientsWithPT.map((client) => {
      const endDate = new Date(client.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        ...client.toObject(),
        ptRemainingDays: daysDiff,
        ptIsExpired: daysDiff <= 0,
        ptExpiringSoon: daysDiff > 0 && daysDiff <= daysThreshold,
      };
    });

    // Filter for expiring soon or already expired
    const expiringPT = ptExpiryData.filter(
      (client) => client.ptRemainingDays <= daysThreshold
    );

    // Separate into categories
    const expired = expiringPT.filter((c) => c.ptIsExpired);
    const expiringSoon = expiringPT.filter((c) => c.ptExpiringSoon);

    return res.status(200).json({
      success: true,
      message: 'Expiring PT packages fetched successfully',
      data: {
        total: expiringPT.length,
        expired: expired.length,
        expiringSoon: expiringSoon.length,
        ptPackages: expiringPT,
        categories: {
          expired,
          expiringSoon,
        },
      }
    });
  } catch (error: any) {
    console.error('Get expiring PT packages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring PT packages',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/v1/client/pt-expiring/by-trainer
 * @desc    Get PT packages expiring grouped by trainer
 * @access  Private (Admin only)
 */
export const getExpiringPTByTrainer = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const daysThreshold = parseInt(days as string, 10);

    const user = (req as any).user;
    const ownerId = user.adminId || user.id || user._id;

    // Get all clients with PT for this gym
    const clientsWithPT = await Client.find({ userId: ownerId, hasPersonalTraining: true })
      .populate('trainer', 'fullName position email')
      .populate('personalTrainer', 'fullName position email')
      .sort({ endDate: 1 });

    // Calculate PT expiry status
    const today = new Date();
    const ptExpiryData = clientsWithPT.map((client) => {
      const endDate = new Date(client.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // Extract populated fields before toObject()
      const clientObj = client.toObject();

      return {
        ...clientObj,
        trainer: clientObj.trainer,
        personalTrainer: clientObj.personalTrainer,
        ptRemainingDays: daysDiff,
        ptIsExpired: daysDiff <= 0,
        ptExpiringSoon: daysDiff > 0 && daysDiff <= daysThreshold,
      };
    });

    // Filter for expiring soon or already expired
    const expiringPT = ptExpiryData.filter(
      (client) => client.ptRemainingDays <= daysThreshold
    );

    // Group by trainer
    const groupedByTrainer: any = {};
    expiringPT.forEach((client) => {
      const trainer = client.trainer as any;
      const personalTrainer = client.personalTrainer as any;
      const trainerId = trainer?._id?.toString() || personalTrainer?._id?.toString() || 'unassigned';
      const trainerName = trainer?.fullName || personalTrainer?.fullName || 'Unassigned';
      
      if (!groupedByTrainer[trainerId]) {
        groupedByTrainer[trainerId] = {
          trainerId,
          trainerName,
          clients: [],
          total: 0,
          expired: 0,
          expiringSoon: 0,
        };
      }
      
      groupedByTrainer[trainerId].clients.push(client);
      groupedByTrainer[trainerId].total++;
      if (client.ptIsExpired) {
        groupedByTrainer[trainerId].expired++;
      } else if (client.ptExpiringSoon) {
        groupedByTrainer[trainerId].expiringSoon++;
      }
    });

    return res.status(200).json({
      success: true,
      message: 'PT packages grouped by trainer fetched successfully',
      data: {
        total: expiringPT.length,
        trainers: Object.values(groupedByTrainer),
      }
    });
  } catch (error: any) {
    console.error('Get PT by trainer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch PT packages by trainer',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/v1/client/:id/pt-status
 * @desc    Get PT status for a specific client
 * @access  Private
 */
export const getClientPTStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id)
      .populate('trainer', 'fullName position email')
      .populate('personalTrainer', 'fullName position email');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    if (!client.hasPersonalTraining) {
      return res.status(200).json({
        success: true,
        message: 'Client does not have a PT package',
        data: { hasPT: false }
      });
    }

    // Calculate PT expiry status
    const today = new Date();
    const endDate = new Date(client.endDate);
    const timeDiff = endDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const ptStatus = {
      hasPT: true,
      ptRemainingDays: daysDiff,
      ptIsExpired: daysDiff <= 0,
      ptExpiringSoon: daysDiff > 0 && daysDiff <= 7,
      ptDurationWeeks: client.personalTrainingDurationWeeks,
      ptPrice: client.personalTrainingPrice,
      trainer: client.trainer || client.personalTrainer,
      startDate: client.startDate,
      endDate: client.endDate,
    };

    return res.status(200).json({
      success: true,
      message: 'PT status fetched successfully',
      data: ptStatus
    });
  } catch (error: any) {
    console.error('Get client PT status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch client PT status',
      error: error.message
    });
  }
};

