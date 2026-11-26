import type { Request, Response } from 'express';
import Enquiry, { type IEnquiry } from '../models/enquiry.model';
import { Staff } from '../models/staff.model';
import { Types } from 'mongoose';
import { createNotification } from '../utils/notification.helper';
import { createOrUpdateEnquiryFollowUp } from './followUp.controllers';


/**
 * Helper: Resolve Gym Admin Owner ID for any user (admin or staff)
 */
export const getGymOwnerAdminId = async (reqUser: any): Promise<string> => {
  if (!reqUser) throw new Error('Unauthorized');
  if (reqUser.role === 'admin' || reqUser.role === 'superadmin') {
    return (reqUser.adminId || reqUser.id || reqUser._id).toString();
  }
  if (reqUser.role === 'staff' || reqUser.role === 'trainer') {
    if (reqUser.adminId) return reqUser.adminId.toString();
    const staffDoc = await Staff.findOne({ userId: reqUser.id || reqUser._id }).select('createdBy');
    if (staffDoc && staffDoc.createdBy) return staffDoc.createdBy.toString();
  }
  return (reqUser.id || reqUser._id).toString();
};

/**
 * Helper: Build tenant query clause for enquiries matching a gym owner adminId
 */
export const getEnquiryTenantFilter = async (reqUser: any): Promise<any> => {
  const adminIdStr = await getGymOwnerAdminId(reqUser);
  const adminObjectId = new Types.ObjectId(adminIdStr);

  // Find all staff belonging to this gym
  const gymStaff = await Staff.find({ createdBy: adminObjectId }).select('_id userId');
  const gymStaffIds = gymStaff.map(s => s._id);
  const gymStaffUserIds = gymStaff.map(s => s.userId).filter(Boolean);

  return {
    $or: [
      { adminId: adminObjectId },
      { userId: adminObjectId },
      { userId: { $in: gymStaffUserIds } },
      { assignedStaff: { $in: gymStaffIds } }
    ]
  };
};

// POST: Create a new enquiry (user-based)
export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      name,
      phone,
      email,
      gender,
      enquiryDate,
      serviceName,
      enquiryType,
      trialType,
      trialDateTime,
      trialService,
      trialStaff,
      trialClassDate,
      trialClass,
      trialSessionDate,
      trialSession,
      source,
      status,
      assignedStaff,
      followUpDate,
      followUpDateTime,
      followUpStaff,
      callTag,
      followUpMessage,
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

    const adminOwnerId = await getGymOwnerAdminId(req.user);

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required.',
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required.',
      });
    }

    if (email && typeof email === 'string' && email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const cleanAssignedStaff = (assignedStaff || followUpStaff) && typeof (assignedStaff || followUpStaff) === 'string' && Types.ObjectId.isValid(assignedStaff || followUpStaff)
      ? new Types.ObjectId(assignedStaff || followUpStaff)
      : null;

    const cleanTrialStaff = trialStaff && typeof trialStaff === 'string' && Types.ObjectId.isValid(trialStaff)
      ? new Types.ObjectId(trialStaff)
      : null;

    const parseDate = (d: any) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Build the enquiry object
    const enquiryData: Partial<IEnquiry> = {
      userId: new Types.ObjectId(userId),
      adminId: new Types.ObjectId(adminOwnerId),
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      gender: gender || undefined,
      enquiryDate: parseDate(enquiryDate) || new Date(),
      serviceName: serviceName || '',
      enquiryType: enquiryType || '',
      trialType: trialType || 'no-trial',
      trialDateTime: parseDate(trialDateTime),
      trialService: trialService || '',
      trialStaff: cleanTrialStaff,
      trialClassDate: parseDate(trialClassDate),
      trialClass: trialClass || '',
      trialSessionDate: parseDate(trialSessionDate),
      trialSession: trialSession || '',
      source: source || 'walk-in',
      status: status || 'new', // default to 'new' if not provided
      assignedStaff: cleanAssignedStaff,
      followUpDate: parseDate(followUpDateTime) || parseDate(followUpDate),
      followUpDateTime: parseDate(followUpDateTime),
      callTag: callTag || '',
      followUpMessage: followUpMessage || '',
      comments: comments || '',
      interests: interests || '',
      budget: budget ? String(budget) : '',
    };

    // Create new enquiry
    const enquiry = new Enquiry(enquiryData);
    const savedEnquiry = await enquiry.save();

    // Auto-create or schedule follow-up if assignedStaff and followUpDate are set
    const effectiveStaff = assignedStaff || followUpStaff;
    const effectiveFollowUpDate = followUpDateTime || followUpDate;
    if (effectiveStaff && effectiveFollowUpDate) {
      let adminId = adminOwnerId;
      await createOrUpdateEnquiryFollowUp(
        (savedEnquiry._id as any).toString(),
        name,
        effectiveStaff,
        effectiveFollowUpDate,
        userId,
        adminId,
        followUpMessage || comments || 'Follow-up scheduled'
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
    const { page, limit, status, source } = req.query;
    const hasPagination = page !== undefined || limit !== undefined;
    const pageNum = page ? Math.max(1, parseInt(page as string, 10)) : 1;
    const limitNum = limit ? Math.max(1, parseInt(limit as string, 10)) : 0;
    const currentUser = req.user;

    if (!currentUser || !currentUser.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    const tenantFilter = await getEnquiryTenantFilter(currentUser);
    const filter: any = { ...tenantFilter };

    // 🔒 Access Control Logic
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      // Admins see all enquiries in their gym (tenantFilter applied)
    } else if (currentUser.role === 'staff' || currentUser.role === 'trainer') {
      // Staff see only assigned enquiries unless manager or receptionist
      const staff = await Staff.findOne({ userId: currentUser.id });
      if (!staff) {
        return res.status(403).json({ success: false, message: 'Staff profile not found' });
      }

      if (staff.position === 'manager' || staff.position === 'receptionist') {
        // Managers and Receptionists see all enquiries in their gym
      } else {
        filter.assignedStaff = staff._id;
      }
    } else {
      // Other roles (like members) only see their own
      filter.userId = new Types.ObjectId(currentUser.id);
    }

    // Optional filters
    if (status) filter.status = status;
    if (source) filter.source = source;

    let enquiryQuery = Enquiry.find(filter)
      .populate('userId', 'fullname email')
      .populate('assignedStaff', 'fullName email position')
      .sort({ createdAt: -1 });

    if (hasPagination && limitNum > 0) {
      enquiryQuery = enquiryQuery.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const [enquiries, total] = await Promise.all([
      enquiryQuery,
      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Enquiries retrieved successfully',
      data: enquiries,
      pagination: {
        currentPage: pageNum,
        totalPages: hasPagination && limitNum > 0 ? Math.ceil(total / limitNum) : 1,
        totalItems: total,
        hasNext: hasPagination && limitNum > 0 ? pageNum * limitNum < total : false,
        hasPrev: hasPagination && limitNum > 0 ? pageNum > 1 : false,
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

    const tenantFilter = await getEnquiryTenantFilter(req.user);
    const enquiry = await Enquiry.findOne({ _id: id, ...tenantFilter })
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
      gender,
      enquiryDate,
      serviceName,
      enquiryType,
      trialType,
      trialDateTime,
      trialService,
      trialStaff,
      trialClassDate,
      trialClass,
      trialSessionDate,
      trialSession,
      source,
      status,
      assignedStaff,
      followUpDate,
      followUpDateTime,
      followUpStaff,
      callTag,
      followUpMessage,
      comments,
      interests,
      budget,
      dateOfBirth,
      countryCode,
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

    if (name !== undefined && name !== null && typeof name === 'string' && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty.',
      });
    }

    if (phone !== undefined && phone !== null && typeof phone === 'string' && !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Phone number cannot be empty.',
      });
    }

    if (email && typeof email === 'string' && email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
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
      // Receptionist: can only edit walk-in leads — fetch current enquiry to check source or enquiryType
      const existingEnquiry = await Enquiry.findById(id).select('source enquiryType');
      if (!existingEnquiry) {
        return res.status(404).json({ success: false, message: 'Enquiry not found.' });
      }
      const isWalkIn = 
        existingEnquiry.source?.toLowerCase() === 'walk-in' || 
        existingEnquiry.enquiryType?.toLowerCase() === 'walk-in';

      if (!isWalkIn) {
        return res.status(403).json({
          success: false,
          message: 'Receptionist can only edit walk-in leads.',
        });
      }
      // Walk-in lead edits: basic details only, NOT status or comments
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (gender !== undefined) updateData.gender = gender;
      if (enquiryDate !== undefined) updateData.enquiryDate = new Date(enquiryDate);
      if (serviceName !== undefined) updateData.serviceName = serviceName;
      if (enquiryType !== undefined) updateData.enquiryType = enquiryType;
      if (trialType !== undefined) updateData.trialType = trialType;
      if (trialDateTime !== undefined) updateData.trialDateTime = trialDateTime ? new Date(trialDateTime) : null;
      if (trialService !== undefined) updateData.trialService = trialService;
      if (trialStaff !== undefined) {
        updateData.trialStaff = trialStaff && Types.ObjectId.isValid(trialStaff) ? new Types.ObjectId(trialStaff) : null;
      }
      if (trialClassDate !== undefined) updateData.trialClassDate = trialClassDate ? new Date(trialClassDate) : null;
      if (trialClass !== undefined) updateData.trialClass = trialClass;
      if (trialSessionDate !== undefined) updateData.trialSessionDate = trialSessionDate ? new Date(trialSessionDate) : null;
      if (trialSession !== undefined) updateData.trialSession = trialSession;
      if (source) updateData.source = source;
      if (interests) updateData.interests = interests;
      if (budget) updateData.budget = budget;
      // status and comments are intentionally excluded for receptionists
    } else {
      // Manager or Admin: full access
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (gender !== undefined) updateData.gender = gender;
      if (enquiryDate !== undefined) updateData.enquiryDate = new Date(enquiryDate);
      if (serviceName !== undefined) updateData.serviceName = serviceName;
      if (enquiryType !== undefined) updateData.enquiryType = enquiryType;
      if (trialType !== undefined) updateData.trialType = trialType;
      if (trialDateTime !== undefined) updateData.trialDateTime = trialDateTime ? new Date(trialDateTime) : null;
      if (trialService !== undefined) updateData.trialService = trialService;
      if (trialStaff !== undefined) {
        updateData.trialStaff = trialStaff && Types.ObjectId.isValid(trialStaff) ? new Types.ObjectId(trialStaff) : null;
      }
      if (trialClassDate !== undefined) updateData.trialClassDate = trialClassDate ? new Date(trialClassDate) : null;
      if (trialClass !== undefined) updateData.trialClass = trialClass;
      if (trialSessionDate !== undefined) updateData.trialSessionDate = trialSessionDate ? new Date(trialSessionDate) : null;
      if (trialSession !== undefined) updateData.trialSession = trialSession;
      if (followUpDateTime !== undefined) updateData.followUpDateTime = followUpDateTime ? new Date(followUpDateTime) : null;
      if (callTag !== undefined) updateData.callTag = callTag;
      if (followUpMessage !== undefined) updateData.followUpMessage = followUpMessage;
      if (source) updateData.source = source;
      if (status) updateData.status = status;
      if (comments) updateData.comments = comments;
      if (interests) updateData.interests = interests;
      if (budget) updateData.budget = budget;
      if (dateOfBirth !== undefined) (updateData as any).dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      if (countryCode !== undefined) (updateData as any).countryCode = countryCode;
    }


    const staffToAssign = assignedStaff !== undefined ? assignedStaff : followUpStaff;
    if (staffToAssign !== undefined) {
      if (!staffToAssign) {
        updateData.assignedStaff = null;
      } else if (Types.ObjectId.isValid(staffToAssign)) {
        updateData.assignedStaff = new Types.ObjectId(staffToAssign);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid staff ID format.',
        });
      }
    }

    const effectiveDate = followUpDateTime || followUpDate;
    if (effectiveDate) {
      const date = new Date(effectiveDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid follow-up date.',
        });
      }
      updateData.followUpDate = date;
    }

    const tenantFilter = await getEnquiryTenantFilter(req.user);
    const updatedEnquiry = await Enquiry.findOneAndUpdate(
      { _id: id, ...tenantFilter },
      updateData,
      { new: true, runValidators: true }
    )
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

    const tenantFilter = await getEnquiryTenantFilter(req.user);
    const deletedEnquiry = await Enquiry.findOneAndDelete({ _id: id, ...tenantFilter });

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

    const tenantFilter = await getEnquiryTenantFilter(req.user);
    const enquiries = await Enquiry.find({ userId: new Types.ObjectId(userId), ...tenantFilter })
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

    const tenantFilter = await getEnquiryTenantFilter(req.user);
    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, ...tenantFilter },
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