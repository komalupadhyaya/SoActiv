// controllers/followUp.controllers.ts

import type { Request, Response } from 'express';
import { FollowUp } from '../models/followUp.model';
import type { IFollowUp } from '../models/followUp.model';

/**
 * @route   POST /api/v1/follow-up
 * @desc    Create a new follow-up
 * @access  Private (Admin, Sales, Trainer)
 */
export const createFollowUp = async (req: Request, res: Response) => {
  try {
    const {
      assignedTo,
      type,
      relatedId,
      relatedName,
      scheduledDate,
      scheduledTime,
      note,
    } = req.body;

    // Validation
    if (!assignedTo || !type || !relatedId || !relatedName || !scheduledDate || !scheduledTime || !note) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: assignedTo, type, relatedId, relatedName, scheduledDate, scheduledTime, note'
      });
    }

    const followUp = await FollowUp.create({
      userId: (req as any).user._id,
      assignedTo,
      type,
      relatedId,
      relatedName,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      note,
      status: 'pending',
    });

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email');

    return res.status(201).json({
      success: true,
      message: 'Follow-up created successfully',
      data: populatedFollowUp
    });
  } catch (error: any) {
    console.error('Create follow-up error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create follow-up',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/v1/follow-up
 * @desc    Get all follow-ups (with filters)
 * @access  Private
 */
export const getAllFollowUps = async (req: Request, res: Response) => {
  try {
    const { status, type, assignedTo, date } = req.query;
    const user = (req as any).user;

    // Build filter
    const filter: any = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.scheduledDate = { $gte: targetDate, $lt: nextDay };
    }

    // Role-based filtering
    if (user.role === 'sales' || user.role === 'trainer') {
      // Sales and trainers can only see their own follow-ups
      filter.assignedTo = user._id;
    }

    const followUps = await FollowUp.find(filter)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    return res.status(200).json({
      success: true,
      message: 'Follow-ups fetched successfully',
      data: followUps
    });
  } catch (error: any) {
    console.error('Get follow-ups error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch follow-ups',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/v1/follow-up/upcoming
 * @desc    Get upcoming follow-ups (today and next 7 days)
 * @access  Private
 */
export const getUpcomingFollowUps = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Build filter
    const filter: any = {
      status: 'pending',
      scheduledDate: { $gte: today, $lte: nextWeek },
    };

    // Role-based filtering
    if (user.role === 'sales' || user.role === 'trainer') {
      filter.assignedTo = user._id;
    }

    const followUps = await FollowUp.find(filter)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    // Group by date
    const grouped: any = {};
    followUps.forEach((followUp) => {
      const dateKey = followUp.scheduledDate.toISOString().split('T')[0];
      if (dateKey) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(followUp);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Upcoming follow-ups fetched successfully',
      data: {
        total: followUps.length,
        followUps,
        groupedByDate: grouped,
      }
    });
  } catch (error: any) {
    console.error('Get upcoming follow-ups error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming follow-ups',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/follow-up/:id
 * @desc    Update a follow-up
 * @access  Private
 */
export const updateFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const followUp = await FollowUp.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email');

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully',
      data: followUp
    });
  } catch (error: any) {
    console.error('Update follow-up error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update follow-up',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/follow-up/:id/complete
 * @desc    Mark a follow-up as completed
 * @access  Private
 */
export const completeFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const followUp = await FollowUp.findByIdAndUpdate(
      id,
      { status: 'completed', completedAt: new Date() },
      { new: true }
    )
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email');

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as completed',
      data: followUp
    });
  } catch (error: any) {
    console.error('Complete follow-up error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete follow-up',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/v1/follow-up/:id
 * @desc    Delete a follow-up
 * @access  Private (Admin only)
 */
export const deleteFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const followUp = await FollowUp.findByIdAndDelete(id);

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Follow-up deleted successfully',
      data: null
    });
  } catch (error: any) {
    console.error('Delete follow-up error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete follow-up',
      error: error.message
    });
  }
};

