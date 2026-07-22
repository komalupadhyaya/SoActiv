// controllers/followUp.controllers.ts

import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { FollowUp } from '../models/followUp.model';
import type { IFollowUp } from '../models/followUp.model';
import Schedule from '../models/schedule.model';
import { Staff } from '../models/staff.model';
import { createNotification } from '../utils/notification.helper';

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
 * Helper: Create or Update an Enquiry Follow-Up task
 */
export const createOrUpdateEnquiryFollowUp = async (
  enquiryId: string,
  name: string,
  assignedStaff: string | null | undefined,
  followUpDate: Date | string | null | undefined,
  userId: string,
  adminId: string,
  noteText: string = 'Follow-up on lead',
  leadStatus?: string
) => {
  // ── Auto-resolve follow-up when the lead is closed ──────────────────────
  if (leadStatus === 'converted' || leadStatus === 'lost') {
    const closedFollowUp = await FollowUp.findOne({
      relatedId: new Types.ObjectId(enquiryId),
      type: 'enquiry',
      status: 'pending'
    });

    if (closedFollowUp) {
      const newFollowUpStatus = leadStatus === 'converted' ? 'completed' : 'cancelled';
      closedFollowUp.status = newFollowUpStatus as any;
      closedFollowUp.note = noteText; // Keep the note updated with the final status
      closedFollowUp.completedAt = new Date();
      await closedFollowUp.save();

      // Also sync the calendar schedule event
      await Schedule.findOneAndUpdate(
        { relatedFollowUp: closedFollowUp._id },
        {
          status: newFollowUpStatus,
          description: noteText,
        }
      );
    }
    return;
  }

  if (!assignedStaff || !followUpDate) {
    // If cleared, cancel/delete pending follow-ups for this enquiry
    await FollowUp.deleteMany({
      relatedId: new Types.ObjectId(enquiryId),
      type: 'enquiry',
      status: 'pending'
    });
    return;
  }

  const scheduledDate = new Date(followUpDate);
  if (isNaN(scheduledDate.getTime())) {
    console.error(`Invalid follow-up date received: ${followUpDate}`);
    return;
  }

  const scheduledTime = '10:00'; // Default time

  // Check if a pending follow-up already exists for this enquiry
  const existingFollowUp = await FollowUp.findOne({
    relatedId: new Types.ObjectId(enquiryId),
    type: 'enquiry',
    status: 'pending'
  });

  if (existingFollowUp) {
    // Update existing follow-up
    existingFollowUp.assignedTo = new Types.ObjectId(assignedStaff);
    existingFollowUp.scheduledDate = scheduledDate;
    existingFollowUp.scheduledTime = scheduledTime;
    existingFollowUp.note = noteText;
    await existingFollowUp.save();

    // Update corresponding schedule event if any
    await Schedule.findOneAndUpdate(
      { relatedFollowUp: existingFollowUp._id },
      {
        title: `Follow-up: ${name}`,
        description: noteText,
        scheduledDate,
        scheduledTime,
        startTime: scheduledTime,
        assignedTo: [new Types.ObjectId(assignedStaff)],
      }
    );

    // Send notification
    try {
      const staffDoc = await Staff.findById(assignedStaff);
      if (staffDoc && staffDoc.userId) {
        const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        await createNotification({
          recipientId: staffDoc.userId.toString(),
          recipientRole: 'staff',
          gymId: staffDoc.gym?.toString(),
          type: 'follow_up_due',
          title: '📋 Follow-up Updated',
          message: `A follow-up task for ${name} has been updated/re-assigned to you, scheduled on ${formattedDate} at ${scheduledTime}.`,
          link: '/staff/follow-ups',
          metadata: {
            followUpId: (existingFollowUp._id as any).toString(),
            relatedId: enquiryId,
            relatedName: name
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify staff about updated follow-up:', err);
    }
  } else {
    // Create new follow-up
    const followUp = await FollowUp.create({
      userId: new Types.ObjectId(userId),
      assignedTo: new Types.ObjectId(assignedStaff),
      type: 'enquiry',
      relatedId: new Types.ObjectId(enquiryId),
      relatedName: name,
      scheduledDate,
      scheduledTime,
      note: noteText,
      status: 'pending'
    });

    // Create schedule event
    try {
      const staff = await Staff.findById(assignedStaff);
      const roleScope = staff?.position ? [staff.position as any] : ['sales', 'trainer'];

      await Schedule.create({
        title: `Follow-up: ${name}`,
        description: noteText,
        scheduledDate,
        scheduledTime,
        startTime: scheduledTime,
        adminId: new Types.ObjectId(adminId),
        createdBy: new Types.ObjectId(userId),
        assignedTo: [new Types.ObjectId(assignedStaff)],
        type: 'followup',
        roleScope,
        isEditable: false,
        relatedFollowUp: followUp._id,
        status: 'pending'
      });
    } catch (err) {
      console.error('Failed to create schedule event for follow-up:', err);
    }

    // Notify staff
    try {
      const staffDoc = await Staff.findById(assignedStaff);
      if (staffDoc && staffDoc.userId) {
        const formattedDate = scheduledDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        await createNotification({
          recipientId: staffDoc.userId.toString(),
          recipientRole: 'staff',
          gymId: staffDoc.gym?.toString(),
          type: 'follow_up_due',
          title: '📋 New Follow-up Assigned',
          message: `You have been assigned a new follow-up for ${name} scheduled on ${formattedDate} at ${scheduledTime}.`,
          link: '/staff/follow-ups',
          metadata: {
            followUpId: (followUp._id as any).toString(),
            relatedId: enquiryId,
            relatedName: name
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify staff about new follow-up:', err);
    }
  }
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

    const targetDate = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date cannot be in the past'
      });
    }

    const noteWordCount = note.trim().split(/\s+/).filter(Boolean).length;
    if (noteWordCount > 50) {
      return res.status(400).json({
        success: false,
        message: 'Note cannot exceed 50 words'
      });
    }

    if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(note)) {
      return res.status(400).json({
        success: false,
        message: 'Note can only contain letters, numbers, spaces, and basic punctuation'
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

    // SEND INITIAL ASSIGNMENT NOTIFICATION
    try {
      const staffDoc = await Staff.findById(assignedTo);
      if (staffDoc && staffDoc.userId) {
        const formattedDate = new Date(scheduledDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        await createNotification({
          recipientId: staffDoc.userId.toString(),
          recipientRole: 'staff',
          gymId: staffDoc.gym?.toString(),
          type: 'follow_up_due',
          title: '📋 New Follow-up Assigned',
          message: `You have been assigned a new follow-up for ${relatedName} scheduled on ${formattedDate} at ${scheduledTime}.`,
          link: '/staff/follow-ups',
          metadata: {
            followUpId: (followUp as any)._id.toString(),
            relatedId: relatedId.toString(),
            relatedName
          }
        });
        console.log(`[FollowUpNotif] Dispatched assignment notification to staff user ${staffDoc.userId}`);
      }
    } catch (notifError) {
      console.error('Failed to send notification for follow-up assignment:', notifError);
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
    if (user.role === 'staff') {
      if (user.position === 'cleaner') {
        filter.assignedTo = user.staffId;
        filter.type = 'other';
      } else if (user.position === 'sales' || user.position === 'trainer') {
        filter.assignedTo = user.staffId;
      }
    } else if (user.role === 'sales' || user.role === 'trainer') {
      // Sales and trainers can only see their own follow-ups
      filter.assignedTo = user.staffId || user.id || user._id;
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
    if (user.role === 'staff') {
      if (user.position === 'cleaner') {
        filter.assignedTo = user.staffId;
        filter.type = 'other';
      } else if (user.position === 'sales' || user.position === 'trainer') {
        filter.assignedTo = user.staffId;
      }
    } else if (user.role === 'sales' || user.role === 'trainer') {
      filter.assignedTo = user.staffId || user.id || user._id;
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
    const user = (req as any).user;

    // Restrict edit to Admin/Superadmin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only admins can edit follow-ups.'
      });
    }

    if (updates.note !== undefined && updates.note !== null) {
      const noteWordCount = updates.note.trim().split(/\s+/).filter(Boolean).length;
      if (noteWordCount > 50) {
        return res.status(400).json({
          success: false,
          message: 'Note cannot exceed 50 words'
        });
      }
      if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(updates.note)) {
        return res.status(400).json({
          success: false,
          message: 'Note can only contain letters, numbers, spaces, and basic punctuation'
        });
      }
    }

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
    const user = (req as any).user;

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    // Verify caller is the assigned staff
    const staffDoc = await Staff.findOne({ userId: user.id });
    if (!staffDoc || followUp.assignedTo.toString() !== staffDoc._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only the assigned staff member can mark this follow-up as completed.'
      });
    }

    followUp.status = 'completed';
    followUp.completedAt = new Date();
    followUp.completedBy = staffDoc._id;
    await followUp.save();

    // Sync schedule event status
    await Schedule.findOneAndUpdate(
      { relatedFollowUp: followUp._id },
      {
        status: 'completed',
        completedAt: new Date(),
        completedBy: staffDoc._id,
        completionNotes: 'Completed from Follow-up'
      }
    );

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

    // If user is a cleaner, only allow general / cleaning tasks ('other')
    if (user.position === 'cleaner') {
      filter.type = 'other';
    }

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

    // Sync schedule event status
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      await Schedule.findOneAndUpdate(
        { relatedFollowUp: followUp._id },
        {
          status: status === 'failed' ? 'cancelled' : (status === 'completed' ? 'completed' : 'cancelled'),
          completedAt: (status === 'completed' || status === 'failed') ? new Date() : undefined,
          completedBy: (status === 'completed' || status === 'failed') ? user.staffId : undefined,
          completionNotes: completionNotes || `Follow-up updated to ${status}`
        }
      );
    }

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

    // Sync schedule event status
    await Schedule.findOneAndUpdate(
      { relatedFollowUp: followUp._id },
      {
        status: 'completed',
        completedAt: new Date(),
        completedBy: user.staffId,
        completionNotes: completionNotes || 'Completed from Follow-up'
      }
    );

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

    // Sync schedule event status
    await Schedule.findOneAndUpdate(
      { relatedFollowUp: followUp._id },
      {
        status: 'cancelled',
        completedAt: new Date(),
        completedBy: user.staffId,
        completionNotes: reason || 'Failed'
      }
    );

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

/**
 * @route   PUT /api/v1/follow-up/:id/reschedule
 * @desc    Request a reschedule for a follow-up (sets status to reschedule_pending awaiting admin approval)
 * @access  Private (Staff)
 */
export const rescheduleFollowUp = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newScheduledDate, newScheduledTime, rescheduleNotes } = req.body;
    const user = (req as any).user;

    if (!newScheduledDate || !newScheduledTime || !rescheduleNotes) {
      return res.status(400).json({
        success: false,
        message: 'newScheduledDate, newScheduledTime, and rescheduleNotes are required'
      });
    }

    const targetDate = new Date(newScheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'New scheduled date cannot be in the past'
      });
    }

    // Find original pending follow-up and verify ownership/assignment to logged-in staff
    const originalFollowUp = await FollowUp.findOne({ _id: id, assignedTo: user.staffId });
    if (!originalFollowUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found or not assigned to you'
      });
    }

    if (originalFollowUp.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending follow-ups can be rescheduled'
      });
    }

    const adminId = await getAdminId(req);

    // 1. Mark original follow-up as reschedule_pending and store details
    originalFollowUp.status = 'reschedule_pending';
    originalFollowUp.proposedDate = new Date(newScheduledDate);
    originalFollowUp.proposedTime = newScheduledTime;
    originalFollowUp.rescheduleReason = rescheduleNotes;
    await originalFollowUp.save();

    // 2. Dispatch alert notification to Admin
    try {
      await createNotification({
        recipientId: adminId,
        recipientRole: 'admin',
        gymId: originalFollowUp.userId.toString(),
        type: 'follow_up_due',
        title: '📅 Reschedule Request',
        message: `Staff member requested to reschedule the follow-up for ${originalFollowUp.relatedName} to ${newScheduledDate} at ${newScheduledTime}.`,
        link: '/admin/follow-ups',
        metadata: {
          followUpId: (originalFollowUp as any)._id.toString()
        }
      });
    } catch (notifError) {
      console.error('Failed to dispatch reschedule request notification to admin:', notifError);
    }

    const populatedOriginal = await FollowUp.findById(originalFollowUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email');

    return res.status(200).json({
      success: true,
      message: 'Reschedule request submitted successfully to Admin for approval',
      data: populatedOriginal
    });
  } catch (error: any) {
    console.error('Reschedule follow-up error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit reschedule request',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/follow-up/:id/approve-reschedule
 * @desc    Approve a follow-up reschedule request (Admin only)
 * @access  Private (Admin)
 */
export const approveReschedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Restrict to Admin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admins can approve reschedules'
      });
    }

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    if (followUp.status !== 'reschedule_pending') {
      return res.status(400).json({
        success: false,
        message: 'This follow-up is not awaiting reschedule approval'
      });
    }

    const { proposedDate, proposedTime, rescheduleReason } = followUp;
    if (!proposedDate || !proposedTime) {
      return res.status(400).json({
        success: false,
        message: 'No proposed reschedule date or time found'
      });
    }

    // 1. Mark original follow-up as rescheduled
    followUp.status = 'rescheduled';
    followUp.completedBy = user.id; // Admin ID
    followUp.completedAt = new Date();
    followUp.completionNotes = `Approved reschedule to ${proposedDate.toLocaleDateString()} at ${proposedTime}. Reason: ${rescheduleReason}`;
    await followUp.save();

    // 2. Create the NEW pending follow-up with the new date/time
    const newFollowUp = await FollowUp.create({
      userId: followUp.userId,
      assignedTo: followUp.assignedTo,
      type: followUp.type,
      relatedId: followUp.relatedId,
      relatedName: followUp.relatedName,
      scheduledDate: proposedDate,
      scheduledTime: proposedTime,
      note: `[Rescheduled] ${rescheduleReason || ''} (Prev notes: ${followUp.note})`,
      status: 'pending',
      reminderSent: false
    });

    const adminId = await getAdminId(req);

    // 3. Create schedule event for the new follow-up
    try {
      const staff = await Staff.findById(followUp.assignedTo);
      const roleScope = staff?.position ? [staff.position as any] : ['sales', 'trainer'];

      await Schedule.create({
        title: `Follow-up: ${followUp.relatedName}`,
        description: `[Rescheduled] ${rescheduleReason || ''}`,
        scheduledDate: proposedDate,
        scheduledTime: proposedTime,
        startTime: proposedTime,
        adminId: adminId,
        createdBy: user.id,
        assignedTo: [followUp.assignedTo],
        type: 'followup',
        roleScope,
        isEditable: false,
        relatedFollowUp: newFollowUp._id,
        status: 'pending'
      });
    } catch (scheduleError) {
      console.error('Failed to create calendar schedule on reschedule approval:', scheduleError);
    }

    // 4. Notify staff member
    try {
      const staffDoc = await Staff.findById(followUp.assignedTo);
      if (staffDoc && staffDoc.userId) {
        const formattedDate = proposedDate.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        await createNotification({
          recipientId: staffDoc.userId.toString(),
          recipientRole: 'staff',
          gymId: staffDoc.gym?.toString(),
          type: 'follow_up_due',
          title: '✅ Reschedule Request Approved',
          message: `Admin approved your reschedule request for ${followUp.relatedName} to ${formattedDate} at ${proposedTime}.`,
          link: '/staff/follow-ups',
          metadata: {
            followUpId: (newFollowUp as any)._id.toString()
          }
        });
      }
    } catch (notifError) {
      console.error('Failed to dispatch approval notification to staff:', notifError);
    }

    const populatedOriginal = await FollowUp.findById(followUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email')
      .populate('completedBy', 'fullName');

    return res.status(200).json({
      success: true,
      message: 'Reschedule request approved successfully',
      data: {
        originalFollowUp: populatedOriginal,
        newFollowUp
      }
    });
  } catch (error: any) {
    console.error('Approve reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve reschedule request',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/v1/follow-up/:id/reject-reschedule
 * @desc    Reject a follow-up reschedule request (Admin only)
 * @access  Private (Admin)
 */
export const rejectReschedule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const user = (req as any).user;

    // Restrict to Admin
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only admins can reject reschedules'
      });
    }

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    if (followUp.status !== 'reschedule_pending') {
      return res.status(400).json({
        success: false,
        message: 'This follow-up is not awaiting reschedule approval'
      });
    }

    // 1. Reset original follow-up to pending status
    followUp.status = 'pending';
    followUp.proposedDate = null;
    followUp.proposedTime = null;
    followUp.rescheduleReason = null;
    await followUp.save();

    // 2. Notify staff member of rejection with comments
    try {
      const staffDoc = await Staff.findById(followUp.assignedTo);
      if (staffDoc && staffDoc.userId) {
        await createNotification({
          recipientId: staffDoc.userId.toString(),
          recipientRole: 'staff',
          gymId: staffDoc.gym?.toString(),
          type: 'follow_up_due',
          title: '❌ Reschedule Request Rejected',
          message: `Admin rejected your reschedule request for ${followUp.relatedName}. Notes: ${comments || 'No explanation provided.'}`,
          link: '/staff/follow-ups',
          metadata: {
            followUpId: (followUp as any)._id.toString()
          }
        });
      }
    } catch (notifError) {
      console.error('Failed to dispatch rejection notification to staff:', notifError);
    }

    const populatedFollowUp = await FollowUp.findById(followUp._id)
      .populate('assignedTo', 'fullName position email')
      .populate('userId', 'fullname email');

    return res.status(200).json({
      success: true,
      message: 'Reschedule request rejected successfully',
      data: populatedFollowUp
    });
  } catch (error: any) {
    console.error('Reject reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject reschedule request',
      error: error.message
    });
  }
};
