// controllers/followUp.controllers.ts

import type { Request, Response } from 'express';
import { FollowUp } from '../models/followUp.model';
import type { IFollowUp } from '../models/followUp.model';
import Schedule from '../models/schedule.model';
import { Staff } from '../models/staff.model';

/**
 * Helper: Get Admin ID (owner of the gym account)
 */
const getAdminId = async (req: Request): Promise<string> => {
  const user = (req as any).user;
  if (!user) throw new Error('Unauthorized: User not authenticated');

  // If user is Admin or Superadmin, they ARE the admin owner
  if (user.role === 'admin' || user.role === 'superadmin') {
    return user.id;
  }

  // If user is Staff, find their Admin via createdBy
  if (user.role === 'staff') {
    const staffDoc = await Staff.findOne({ userId: user.id }).select('createdBy');
    if (!staffDoc) throw new Error('Staff record not found for this user');
    return staffDoc.createdBy.toString();
  }

  // Default fallback
  return user.id;
};

/**
 * @route   POST /api/v1/follow-up
 * @desc    Create a new follow-up
 * @access  Private (Admin, Manager)
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

    const adminId = await getAdminId(req);

    // Validation
    if (!assignedTo || !type || !relatedId || !relatedName || !scheduledDate || !scheduledTime || !note) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: assignedTo, type, relatedId, relatedName, scheduledDate, scheduledTime, note'
      });
    }

    // DUPLICATE PREVENTION CHECK
    // Check if a pending follow-up already exists for the same staff at the same date/time
    const existingFollowUp = await FollowUp.findOne({
      assignedTo,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status: 'pending'
    });

    if (existingFollowUp) {
      return res.status(409).json({
        success: false,
        message: 'A pending follow-up already exists for this staff member at the same date and time',
        data: {
          existingFollowUp: {
            id: existingFollowUp._id,
            relatedName: existingFollowUp.relatedName,
            type: existingFollowUp.type,
            note: existingFollowUp.note
          }
        }
      });
    }

    const followUp = await FollowUp.create({
      userId: (req as any).user.id, // Fixed: use .id instead of ._id
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

    // AUTO-CREATE SCHEDULE EVENT
    try {
      // Get staff position to determine roleScope
      const staff = await Staff.findById(assignedTo);
      const roleScope = staff?.position ? [staff.position as any] : ['sales', 'trainer'];

      await Schedule.create({
        title: `Follow-up: ${relatedName}`,
        description: note,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        startTime: scheduledTime, // Sync new field
        adminId: adminId,
        createdBy: (req as any).user.id,
        assignedTo: [assignedTo], // Pass as array
        type: 'followup',
        roleScope,
        isEditable: false, // Follow-up schedules are not directly editable
        relatedFollowUp: followUp._id,
        status: 'pending'
      });
    } catch (scheduleError) {
      console.error('Failed to create schedule event for follow-up:', scheduleError);
      // Don't fail the follow-up creation if schedule creation fails
    }

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

/**
 * ============================================================
 * STAFF-SPECIFIC ENDPOINTS
 * ============================================================
 */

/**
 * @route   GET /api/v1/follow-up/my-tasks
 * @desc    Get follow-ups assigned to the logged-in staff member
 * @access  Private (Staff only)
 */
export const getMyFollowUps = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, date } = req.query;

    // Build filter for staff's own follow-ups
    const filter: any = { assignedTo: user.staffId };

    if (status) filter.status = status;
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.scheduledDate = { $gte: targetDate, $lt: nextDay };
    }

    const followUps = await FollowUp.find(filter)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .populate('completedBy', 'fullName')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    return res.status(200).json({
      success: true,
      message: 'My follow-ups fetched successfully',
      data: followUps
    });
  } catch (error: any) {
    console.error('Get my follow-ups error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch my follow-ups',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/follow-up/:id/status
 * @desc    Update follow-up status (Staff can only update their own)
 * @access  Private (Staff)
 */
export const updateFollowUpStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;
    const user = (req as any).user;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed', 'rescheduled', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find follow-up and verify it's assigned to this staff member
    const followUp = await FollowUp.findOne({ _id: id, assignedTo: user.staffId });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or not assigned to you'
      });
    }

    // Update status and completion fields
    followUp.status = status;
    if (completionNotes) {
      followUp.completionNotes = completionNotes;
    }
    if (status === 'completed' || status === 'failed') {
      followUp.completedBy = user.staffId;
      followUp.completedAt = new Date();
    }

    await followUp.save();

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .populate('completedBy', 'fullName');

    return res.status(200).json({
      success: true,
      message: 'Follow-up status updated successfully',
      data: populatedFollowUp
    });
  } catch (error: any) {
    console.error('Update follow-up status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update follow-up status',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/follow-up/:id/complete
 * @desc    Mark follow-up as completed with notes
 * @access  Private (Staff)
 */
export const completeFollowUpWithNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completionNotes } = req.body;
    const user = (req as any).user;

    const followUp = await FollowUp.findOne({ _id: id, assignedTo: user.staffId });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or not assigned to you'
      });
    }

    followUp.status = 'completed';
    followUp.completedBy = user.staffId;
    followUp.completedAt = new Date();
    if (completionNotes) {
      followUp.completionNotes = completionNotes;
    }

    await followUp.save();

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .populate('completedBy', 'fullName');

    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as completed',
      data: populatedFollowUp
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
 * @route   PUT /api/v1/follow-up/:id/fail
 * @desc    Mark follow-up as failed with reason
 * @access  Private (Staff)
 */
export const failFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Failure reason is required'
      });
    }

    const followUp = await FollowUp.findOne({ _id: id, assignedTo: user.staffId });

    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or not assigned to you'
      });
    }

    followUp.status = 'failed';
    followUp.completedBy = user.staffId;
    followUp.completedAt = new Date();
    followUp.completionNotes = reason;

    await followUp.save();

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .populate('completedBy', 'fullName');

    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as failed',
      data: populatedFollowUp
    });
  } catch (error: any) {
    console.error('Fail follow-up error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark follow-up as failed',
      error: error.message
    });
  }
};
