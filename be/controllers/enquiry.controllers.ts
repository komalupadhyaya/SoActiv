import type { Request, Response } from 'express';
import Enquiry, { type IEnquiry } from '../models/enquiry.model';
import { Staff } from '../models/staff.model';
import { Types } from 'mongoose';
import { createNotification } from '../utils/notification.helper';
import { createOrUpdateEnquiryFollowUp } from './followUp.controllers';


// POST: Create a new enquiry (user-based)
export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      name,
      phone,
      email,
      source,
      status,
      assignedStaff,
      followUpDate,
      comments,
      interests,
      budget,
    } = req.body;

    // Get userId from authenticated user (set by auth middleware)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    // Validate required fields (additional runtime check beyond Mongoose)
    if (!name || !phone || !source || !email || !assignedStaff || !followUpDate || !interests || !budget) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, phone, source, email, assignedStaff, followUpDate, interests, and budget.',
      });
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name must contain only alphabetical characters and spaces.',
      });
    }

    if (interests && !/^[a-zA-Z\s.,\-()]*$/.test(interests)) {
      return res.status(400).json({
        success: false,
        message: 'Areas of Interest can only contain letters, spaces, and basic punctuation.',
      });
    }

    const budgetNum = Number(budget);
    if (isNaN(budgetNum) || budgetNum < 100 || budgetNum > 100000) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a valid number between 100 and 100,000.',
      });
    }

    // Optional: Validate ObjectId format for assignedStaff if provided
    if (assignedStaff && !Types.ObjectId.isValid(assignedStaff)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID format.',
      });
    }

    if (comments) {
      const commentWords = comments.trim().split(/\s+/).filter(Boolean).length;
      if (commentWords > 50) {
        return res.status(400).json({
          success: false,
          message: 'Comments cannot exceed 50 words.',
        });
      }
      if (!/^[a-zA-Z\s.,\-()]*$/.test(comments)) {
        return res.status(400).json({
          success: false,
          message: 'Comments can only contain alphabetical characters, spaces, and basic punctuation.',
        });
      }
    }

    // Build the enquiry object
    const enquiryData: Partial<IEnquiry> = {
      userId,
      name,
      phone,
      email,
      source,
      status: status || 'new', // default to 'new' if not provided
      assignedStaff: assignedStaff ? new Types.ObjectId(assignedStaff) : null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      comments: comments || '',
      interests: interests || '',
      budget: budget || '',
    };

    // Create new enquiry
    const enquiry = new Enquiry(enquiryData);
    const savedEnquiry = await enquiry.save();

    // Auto-create or schedule follow-up if assignedStaff and followUpDate are set
    if (assignedStaff && followUpDate) {
      let adminId = userId; // Default fallback
      if (req.user?.role === 'staff') {
        const creatorDoc = await Staff.findOne({ userId }).select('createdBy');
        if (creatorDoc) {
          adminId = creatorDoc.createdBy.toString();
        }
      }
      await createOrUpdateEnquiryFollowUp(
        (savedEnquiry._id as any).toString(),
        name,
        assignedStaff,
        followUpDate,
        userId,
        adminId,
        comments || 'Follow-up scheduled'
      );
    }

    // ── Notify admin ──────────────────────────────────────────────────────
    if (userId) {
      await createNotification({
        recipientId: userId,
        recipientRole: 'admin',
        type: 'new_enquiry',
        title: '📋 New Enquiry',
        message: `New enquiry from ${name} (${phone})`,
        link: '/admin/enquiries',
        metadata: { enquiryId: (savedEnquiry._id as any).toString(), name, phone },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: savedEnquiry,
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    // Handle duplicate key or cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field: ${error.path}`,
      });
    }

    console.error('Error creating enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not create enquiry.',
    });
  }
};

// POST: Create a new enquiry from public website
export const createPublicEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, phone, email, interests, comments } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields.',
      });
    }

    const enquiryData: Partial<IEnquiry> = {
      name,
      phone,
      email: email || '',
      source: 'website',
      status: 'new',
      interests: interests || '',
      comments: comments || '',
      assignedStaff: null,
      userId: undefined, // Explicitly no user ID for public
    };

    const enquiry = new Enquiry(enquiryData);
    const savedEnquiry = await enquiry.save();

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully. We will contact you shortly.',
      data: savedEnquiry,
    });
  } catch (error: any) {
    console.error('Error creating public enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not submit enquiry.',
    });
  }
};

// GET: Fetch all enquiries (admin or filtered)
// GET: Fetch enquiries — but only the current user's own enquiries
// Even admins can only see their own
export const getEnquiries = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10, status, source } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10)); // Cap limit at 100
    const currentUser = req.user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    const filter: any = {};

    // 🔒 Access Control Logic
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      // Admins see everything
    } else if (currentUser.role === 'staff' || currentUser.role === 'trainer') {
      // Staff see only assigned enquiries
      const staff = await Staff.findOne({ userId: currentUser.id });
      if (!staff) {
        return res.status(403).json({ success: false, message: 'Staff profile not found' });
      }

      // If manager or receptionist, they might see all
      if (staff.position === 'manager' || staff.position === 'receptionist') {
        // Managers and Receptionists see everything
      } else {
        filter.assignedStaff = staff._id;
      }
    } else {
      // Other roles (like members) only see their own (if any)
      filter.userId = new Types.ObjectId(currentUser.id);
    }

    // Optional filters
    if (status) filter.status = status;
    if (source) filter.source = source;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter)
        .populate('userId', 'fullname email')
        .populate('assignedStaff', 'fullName email position')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),

      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Enquiries retrieved successfully',
      data: enquiries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching enquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve enquiries.',
    });
  }
};

// GET: Fetch a single enquiry by ID
export const getEnquiryById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry ID is required.',
      });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID format.',
      });
    }

    const enquiry = await Enquiry.findById(id)
      .populate('userId', 'name email')
      .populate('assignedStaff', 'name email role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry retrieved successfully',
      data: enquiry,
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    console.error('Error retrieving enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve enquiry.',
    });
  }
};

// PUT: Update an enquiry
export const updateEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      source,
      status,
      assignedStaff,
      followUpDate,
      comments,
      interests,
      budget,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry ID is required.',
      });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    if (name !== undefined && name !== null) {
      if (!/^[a-zA-Z\s]+$/.test(name)) {
        return res.status(400).json({
          success: false,
          message: 'Name must contain only alphabetical characters and spaces.',
        });
      }
    }

    if (interests !== undefined && interests !== null) {
      if (!/^[a-zA-Z\s.,\-()]*$/.test(interests)) {
        return res.status(400).json({
          success: false,
          message: 'Areas of Interest can only contain letters, spaces, and basic punctuation.',
        });
      }
    }

    if (budget !== undefined && budget !== null) {
      const budgetNum = Number(budget);
      if (isNaN(budgetNum) || budgetNum < 100 || budgetNum > 100000) {
        return res.status(400).json({
          success: false,
          message: 'Budget must be a valid number between 100 and 100,000.',
        });
      }
    }

    if (comments !== undefined && comments !== null) {
      const commentWords = comments.trim().split(/\s+/).filter(Boolean).length;
      if (commentWords > 50) {
        return res.status(400).json({
          success: false,
          message: 'Comments cannot exceed 50 words.',
        });
      }
      if (!/^[a-zA-Z\s.,\-()]*$/.test(comments)) {
        return res.status(400).json({
          success: false,
          message: 'Comments can only contain alphabetical characters, spaces, and basic punctuation.',
        });
      }
    }

    if (
      name === '' ||
      phone === '' ||
      source === '' ||
      email === '' ||
      assignedStaff === '' ||
      followUpDate === '' ||
      interests === '' ||
      budget === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required fields cannot be empty.',
      });
    }

    const updateData: Partial<IEnquiry> = {};

    const currentUser = req.user;
    const isStaff = currentUser?.role === 'staff' || currentUser?.role === 'trainer';
    const staffProfile = isStaff ? await Staff.findOne({ userId: currentUser?.id }) : null;

    // Role-based field access:
    //  - Sales/Trainer staff: can ONLY update status + comments
    //  - Receptionist: can edit walk-in lead details ONLY (NOT status or comments)
    //  - Manager/Admin: can update everything
    const position = staffProfile?.position;
    if (isStaff && position !== 'manager' && position !== 'receptionist') {
      // Sales / Trainer staff
      if (status) updateData.status = status;
      if (comments) updateData.comments = comments;
    } else if (isStaff && position === 'receptionist') {
      // Receptionist: can only edit walk-in leads — fetch current enquiry to check source
      const existingEnquiry = await Enquiry.findById(id).select('source');
      if (!existingEnquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      if (existingEnquiry.source !== 'walk-in') {
        return res.status(403).json({
          success: false,
          message: 'Receptionist can only edit walk-in leads.',
        });
      }
      // Walk-in lead edits: basic details only, NOT status or comments
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (source) updateData.source = source;
      if (interests) updateData.interests = interests;
      if (budget) updateData.budget = budget;
      // status and comments are intentionally excluded for receptionists
    } else {
      // Manager or Admin: full access
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (source) updateData.source = source;
      if (status) updateData.status = status;
      if (comments) updateData.comments = comments;
      if (interests) updateData.interests = interests;
      if (budget) updateData.budget = budget;
    }


    if (assignedStaff !== undefined) {
      if (!assignedStaff) {
        updateData.assignedStaff = null;
      } else if (Types.ObjectId.isValid(assignedStaff)) {
        updateData.assignedStaff = new Types.ObjectId(assignedStaff);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid staff ID format.',
        });
      }
    }

    if (followUpDate) {
      const date = new Date(followUpDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up date.',
        });
      }
      updateData.followUpDate = date;
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('userId', 'name email')
      .populate('assignedStaff', 'name email role');

    if (!updatedEnquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    // Sync follow-up task
    let adminId = currentUser?.id || '';
    if (currentUser?.role === 'staff') {
      const creatorDoc = await Staff.findOne({ userId: currentUser.id }).select('createdBy');
      if (creatorDoc) {
        adminId = creatorDoc.createdBy.toString();
      }
    }

    // Format a rich note that includes the lead status so it's visible on follow-up views
    const leadStatus = updatedEnquiry.status;
    const leadComments = updatedEnquiry.comments || '';
    const followUpNoteText = leadComments
      ? `[Lead Status: ${leadStatus.toUpperCase()}] ${leadComments}`
      : `[Lead Status: ${leadStatus.toUpperCase()}]`;

    await createOrUpdateEnquiryFollowUp(
      (updatedEnquiry._id as any).toString(),
      updatedEnquiry.name,
      updatedEnquiry.assignedStaff ? updatedEnquiry.assignedStaff.toString() : null,
      updatedEnquiry.followUpDate,
      currentUser?.id || '',
      adminId,
      followUpNoteText,
      leadStatus
    );

    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      data: updatedEnquiry,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid value for field: ${error.path}`,
      });
    }

    console.error('Error updating enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not update enquiry.',
    });
  }
};

// DELETE: Delete an enquiry (hard delete)
export const deleteEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry ID is required.',
      });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not delete enquiry.',
    });
  }
};

// GET: Get all enquiries created by the authenticated user
export const getEnquiriesByUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    const enquiries = await Enquiry.find({ userId: new Types.ObjectId(userId) })
      .populate('assignedStaff', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Your enquiries retrieved successfully',
      data: enquiries,
    });
  } catch (error: any) {
    console.error('Error fetching user enquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not retrieve your enquiries.',
    });
  }
};

// PATCH: Assign staff to an enquiry
export const assignStaffToEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry ID is required.',
      });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enquiry ID.',
      });
    }

    if (!staffId || !Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid staff ID is required.',
      });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { assignedStaff: new Types.ObjectId(staffId) },
      { new: true, runValidators: true }
    ).populate('assignedStaff', 'name email role');

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: 'Enquiry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Staff assigned successfully',
      data: enquiry,
    });
  } catch (error: any) {
    console.error('Error assigning staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Could not assign staff.',
    });
  }
};