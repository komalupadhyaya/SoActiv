import type { Request, Response } from 'express';
import Enquiry, { type IEnquiry } from '../models/enquiry.model';
import { Staff } from '../models/staff.model';
import { Gym } from '../models/gym.model';
import { User } from '../models/user.model';
import { Types } from 'mongoose';
import { createNotification } from '../utils/notification.helper';
import { createOrUpdateEnquiryFollowUp } from './followUp.controllers';

export interface EnquiryTenantContext {
  gymObjectId: Types.ObjectId | null;
  gymIdStr: string | null;
  adminObjectId: Types.ObjectId | null;
  adminIdStr: string | null;
  gymStaffIds: Types.ObjectId[];
  gymUserIds: Types.ObjectId[];
}

/**
 * Helper: Resolve full tenant context (gymId + owner adminId + members/staff of that gym)
 * so one gym's enquiries can never match another gym's queries.
 */
export const resolveEnquiryTenantContext = async (reqUser: any): Promise<EnquiryTenantContext> => {
  if (!reqUser) throw new Error('Unauthorized');

  const rawUserId = reqUser.id || reqUser._id;
  const userObjectId =
    rawUserId && Types.ObjectId.isValid(rawUserId.toString())
      ? new Types.ObjectId(rawUserId.toString())
      : null;

  let gymObjectId: Types.ObjectId | null =
    reqUser.gym && Types.ObjectId.isValid(reqUser.gym.toString())
      ? new Types.ObjectId(reqUser.gym.toString())
      : null;

  let adminObjectId: Types.ObjectId | null =
    reqUser.adminId && Types.ObjectId.isValid(reqUser.adminId.toString())
      ? new Types.ObjectId(reqUser.adminId.toString())
      : null;

  if (reqUser.role === 'staff' || reqUser.role === 'trainer') {
    const staffQuery = reqUser.staffId && Types.ObjectId.isValid(reqUser.staffId.toString())
      ? { _id: new Types.ObjectId(reqUser.staffId.toString()) }
      : userObjectId
        ? { userId: userObjectId, ...(gymObjectId ? { gym: gymObjectId } : {}) }
        : null;

    if (staffQuery && (!gymObjectId || !adminObjectId)) {
      const staffDoc = await Staff.findOne(staffQuery).select('createdBy gym');
      if (staffDoc) {
        if (!gymObjectId && staffDoc.gym) gymObjectId = staffDoc.gym as Types.ObjectId;
        if (!adminObjectId && staffDoc.createdBy) adminObjectId = staffDoc.createdBy as Types.ObjectId;
      }
    }
  } else if (reqUser.role === 'admin') {
    if (!adminObjectId && userObjectId) {
      adminObjectId = userObjectId;
    }
    if (!gymObjectId && userObjectId) {
      const ownedGym = await Gym.findOne({ owner: userObjectId, deletedAt: null }).select('_id');
      if (ownedGym) gymObjectId = ownedGym._id as Types.ObjectId;
    }
  } else if (reqUser.role === 'superadmin') {
    if (!adminObjectId && userObjectId) {
      adminObjectId = userObjectId;
    }
  } else if (!adminObjectId && userObjectId) {
    adminObjectId = userObjectId;
  }

  let gymStaffIds: Types.ObjectId[] = [];
  let gymUserIds: Types.ObjectId[] = [];

  if (gymObjectId) {
    const [gymDoc, gymStaff, gymUsers] = await Promise.all([
      Gym.findById(gymObjectId).select('owner'),
      Staff.find({ gym: gymObjectId }).select('_id userId'),
      User.find({ gym: gymObjectId }).select('_id'),
    ]);

    if (gymDoc?.owner && !adminObjectId) {
      adminObjectId = gymDoc.owner as Types.ObjectId;
    }

    gymStaffIds = gymStaff.map((s) => s._id as Types.ObjectId);

    const userIdSet = new Map<string, Types.ObjectId>();
    const addUserId = (id?: Types.ObjectId | null) => {
      if (id) userIdSet.set(id.toString(), id);
    };
    addUserId(gymDoc?.owner as Types.ObjectId | undefined);
    addUserId(adminObjectId);
    gymUsers.forEach((u) => addUserId(u._id as Types.ObjectId));
    gymStaff.forEach((s) => addUserId(s.userId as Types.ObjectId | undefined));
    gymUserIds = Array.from(userIdSet.values());
  } else if (adminObjectId) {
    const gymStaff = await Staff.find({ createdBy: adminObjectId }).select('_id userId');
    gymStaffIds = gymStaff.map((s) => s._id as Types.ObjectId);
    const userIdSet = new Map<string, Types.ObjectId>();
    userIdSet.set(adminObjectId.toString(), adminObjectId);
    gymStaff.forEach((s) => {
      if (s.userId) userIdSet.set(s.userId.toString(), s.userId as Types.ObjectId);
    });
    gymUserIds = Array.from(userIdSet.values());
  }

  return {
    gymObjectId,
    gymIdStr: gymObjectId ? gymObjectId.toString() : null,
    adminObjectId,
    adminIdStr: adminObjectId ? adminObjectId.toString() : null,
    gymStaffIds,
    gymUserIds,
  };
};

/**
 * Helper: Resolve Gym Admin Owner ID for any user (admin or staff)
 */
export const getGymOwnerAdminId = async (reqUser: any): Promise<string> => {
  const tenant = await resolveEnquiryTenantContext(reqUser);
  if (tenant.adminIdStr) return tenant.adminIdStr;
  return (reqUser.id || reqUser._id).toString();
};

/**
 * Helper: Build strict tenant query clause for enquiries belonging strictly to the user's gym.
 */
export const getEnquiryTenantFilter = async (
  reqUser: any,
  precomputedTenant?: EnquiryTenantContext
): Promise<any> => {
  const tenant = precomputedTenant || (await resolveEnquiryTenantContext(reqUser));

  if (tenant.gymObjectId) {
    const legacyMatchClauses: any[] = [];
    if (tenant.gymUserIds.length > 0) {
      legacyMatchClauses.push({ adminId: { $in: tenant.gymUserIds } });
    }

    const legacyCreatorOrAssigneeClauses: any[] = [];
    if (tenant.gymUserIds.length > 0) {
      legacyCreatorOrAssigneeClauses.push({ userId: { $in: tenant.gymUserIds } });
    }
    if (tenant.gymStaffIds.length > 0) {
      legacyCreatorOrAssigneeClauses.push({ assignedStaff: { $in: tenant.gymStaffIds } });
    }

    if (legacyCreatorOrAssigneeClauses.length > 0) {
      // Only match legacy userId/assignedStaff if adminId is ALSO missing or belongs to this gym
      legacyMatchClauses.push({
        $and: [
          {
            $or: [
              { adminId: { $exists: false } },
              { adminId: null },
              ...(tenant.gymUserIds.length > 0 ? [{ adminId: { $in: tenant.gymUserIds } }] : []),
            ],
          },
          { $or: legacyCreatorOrAssigneeClauses },
        ],
      });
    }

    const orClauses: any[] = [{ gymId: tenant.gymObjectId }];
    if (legacyMatchClauses.length > 0) {
      orClauses.push({
        $and: [
          { $or: [{ gymId: { $exists: false } }, { gymId: null }] },
          { $or: legacyMatchClauses },
        ],
      });
    }

    return { $or: orClauses };
  }

  // Fallback when user has no gymId (e.g. non-impersonating superadmin or unlinked account)
  const fallbackClauses: any[] = [];
  if (tenant.adminObjectId) {
    fallbackClauses.push({ adminId: tenant.adminObjectId }, { userId: tenant.adminObjectId });
  }
  if (reqUser.role !== 'superadmin') {
    if (tenant.gymUserIds.length > 0) {
      fallbackClauses.push({ userId: { $in: tenant.gymUserIds } });
    }
    if (tenant.gymStaffIds.length > 0) {
      fallbackClauses.push({ assignedStaff: { $in: tenant.gymStaffIds } });
    }
  }

  if (fallbackClauses.length === 0) {
    return { _id: null };
  }

  return {
    $and: [
      { $or: [{ gymId: { $exists: false } }, { gymId: null }] },
      { $or: fallbackClauses },
    ],
  };
};

/**
 * Helper: Verify that a referenced Staff document belongs to the caller's gym.
 */
const ensureStaffInTenantGym = async (
  staffIdValue: any,
  tenant: EnquiryTenantContext
): Promise<{ valid: boolean; objectId: Types.ObjectId | null; message?: string }> => {
  if (!staffIdValue) {
    return { valid: true, objectId: null };
  }
  if (typeof staffIdValue !== 'string' || !Types.ObjectId.isValid(staffIdValue)) {
    return { valid: false, objectId: null, message: 'Invalid staff ID format.' };
  }

  const staffObjectId = new Types.ObjectId(staffIdValue);
  const staffFilter: any = { _id: staffObjectId };
  if (tenant.gymObjectId) {
    staffFilter.gym = tenant.gymObjectId;
  } else if (tenant.adminObjectId) {
    staffFilter.createdBy = tenant.adminObjectId;
  }

  const staffDoc = await Staff.findOne(staffFilter).select('_id');
  if (!staffDoc) {
    return {
      valid: false,
      objectId: null,
      message: 'Selected staff member does not belong to your gym.',
    };
  }

  return { valid: true, objectId: staffObjectId };
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

    const tenant = await resolveEnquiryTenantContext(req.user);

    if (!tenant.gymObjectId && req.user?.role !== 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'No gym associated with this account.',
      });
    }

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

    const assignedStaffCheck = await ensureStaffInTenantGym(assignedStaff || followUpStaff, tenant);
    if (!assignedStaffCheck.valid) {
      return res.status(400).json({
        success: false,
        message: assignedStaffCheck.message,
      });
    }
    const cleanAssignedStaff = assignedStaffCheck.objectId;

    const trialStaffCheck = await ensureStaffInTenantGym(trialStaff, tenant);
    if (!trialStaffCheck.valid) {
      return res.status(400).json({
        success: false,
        message: trialStaffCheck.message,
      });
    }
    const cleanTrialStaff = trialStaffCheck.objectId;

    const parseDate = (d: any) => {
      if (!d) return null;
      const parsed = new Date(d);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    // Build the enquiry object
    const enquiryData: Partial<IEnquiry> = {
      userId: new Types.ObjectId(userId),
      adminId: tenant.adminObjectId || new Types.ObjectId(userId),
      ...(tenant.gymObjectId ? { gymId: tenant.gymObjectId } : {}),
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
    const effectiveStaff = cleanAssignedStaff ? cleanAssignedStaff.toString() : null;
    const effectiveFollowUpDate = followUpDateTime || followUpDate;
    if (effectiveStaff && effectiveFollowUpDate) {
      const adminId = tenant.adminIdStr || userId;
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
        ...(tenant.gymIdStr ? { gymId: tenant.gymIdStr } : {}),
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
    const { name, phone, email, interests, comments, gymId } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields.',
      });
    }

    let resolvedGymId: Types.ObjectId | null = null;
    let resolvedAdminId: Types.ObjectId | undefined = undefined;

    if (gymId) {
      if (typeof gymId !== 'string' || !Types.ObjectId.isValid(gymId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid gym ID.',
        });
      }
      const gymDoc = await Gym.findOne({ _id: gymId, deletedAt: null }).select('_id owner');
      if (!gymDoc) {
        return res.status(404).json({
          success: false,
          message: 'Gym not found.',
        });
      }
      resolvedGymId = gymDoc._id as Types.ObjectId;
      if (gymDoc.owner) {
        resolvedAdminId = gymDoc.owner as Types.ObjectId;
      }
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
      gymId: resolvedGymId,
      adminId: resolvedAdminId,
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

    const tenant = await resolveEnquiryTenantContext(currentUser);
    const tenantFilter = await getEnquiryTenantFilter(currentUser, tenant);
    const filter: any = { ...tenantFilter };

    // 🔒 Access Control Logic
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      // Admins see all enquiries in their gym (tenantFilter applied)
    } else if (currentUser.role === 'staff' || currentUser.role === 'trainer') {
      // Staff see only assigned enquiries unless manager or receptionist
      const staff = await Staff.findOne({
        ...(currentUser.staffId ? { _id: currentUser.staffId } : { userId: currentUser.id }),
        ...(tenant.gymObjectId ? { gym: tenant.gymObjectId } : {}),
      });
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
    const tenant = await resolveEnquiryTenantContext(currentUser);
    const tenantFilter = await getEnquiryTenantFilter(currentUser, tenant);

    const isStaff = currentUser?.role === 'staff' || currentUser?.role === 'trainer';
    const staffProfile = isStaff
      ? await Staff.findOne({
          ...(currentUser?.staffId ? { _id: currentUser.staffId } : { userId: currentUser?.id }),
          ...(tenant.gymObjectId ? { gym: tenant.gymObjectId } : {}),
        })
      : null;

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
      // Receptionist: can only edit walk-in leads — fetch current enquiry within caller's gym tenant
      const existingEnquiry = await Enquiry.findOne({ _id: id, ...tenantFilter }).select('source enquiryType');
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
        const trialStaffCheck = await ensureStaffInTenantGym(trialStaff, tenant);
        if (!trialStaffCheck.valid) {
          return res.status(400).json({ success: false, message: trialStaffCheck.message });
        }
        updateData.trialStaff = trialStaffCheck.objectId;
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
        const trialStaffCheck = await ensureStaffInTenantGym(trialStaff, tenant);
        if (!trialStaffCheck.valid) {
          return res.status(400).json({ success: false, message: trialStaffCheck.message });
        }
        updateData.trialStaff = trialStaffCheck.objectId;
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
      const assignedCheck = await ensureStaffInTenantGym(staffToAssign, tenant);
      if (!assignedCheck.valid) {
        return res.status(400).json({
          success: false,
          message: assignedCheck.message,
        });
      }
      updateData.assignedStaff = assignedCheck.objectId;
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

    if (tenant.gymObjectId) {
      updateData.gymId = tenant.gymObjectId;
    }

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
    const adminId = tenant.adminIdStr || currentUser?.id || '';

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
    const enquiries = await Enquiry.find({ $and: [tenantFilter, { userId: new Types.ObjectId(userId) }] })
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

    const tenant = await resolveEnquiryTenantContext(req.user);
    const staffCheck = await ensureStaffInTenantGym(staffId, tenant);
    if (!staffCheck.valid || !staffCheck.objectId) {
      return res.status(400).json({
        success: false,
        message: staffCheck.message || 'Selected staff member does not belong to your gym.',
      });
    }

    const tenantFilter = await getEnquiryTenantFilter(req.user, tenant);
    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, ...tenantFilter },
      {
        assignedStaff: staffCheck.objectId,
        ...(tenant.gymObjectId ? { gymId: tenant.gymObjectId } : {}),
      },
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

/**
 * Idempotent startup helper: Backfill missing gymId on legacy Enquiry documents
 * based on their adminId, creator userId, or assignedStaff so strict gymId isolation applies to older records too.
 */
export const backfillEnquiryGymIds = async (): Promise<void> => {
  try {
    const legacyEnquiries = await Enquiry.find({
      $and: [
        { $or: [{ gymId: { $exists: false } }, { gymId: null }] },
        {
          $or: [
            { adminId: { $exists: true, $ne: null } },
            { userId: { $exists: true, $ne: null } },
            { assignedStaff: { $exists: true, $ne: null } },
          ],
        },
      ],
    }).select('_id adminId userId assignedStaff');

    if (legacyEnquiries.length === 0) return;

    let updated = 0;
    for (const enq of legacyEnquiries) {
      let resolvedGymId: Types.ObjectId | null = null;
      let resolvedAdminId: Types.ObjectId | null = (enq.adminId as Types.ObjectId | undefined) || null;

      if (enq.adminId) {
        const adminUser = await User.findById(enq.adminId).select('gym');
        if (adminUser?.gym) {
          resolvedGymId = adminUser.gym as Types.ObjectId;
        } else {
          const gymDoc = await Gym.findOne({ owner: enq.adminId }).select('_id');
          if (gymDoc) resolvedGymId = gymDoc._id as Types.ObjectId;
        }
      }

      if (!resolvedGymId && enq.userId) {
        const creator = await User.findById(enq.userId).select('gym role');
        if (creator?.gym) {
          resolvedGymId = creator.gym as Types.ObjectId;
        }
      }

      if (!resolvedGymId && enq.assignedStaff) {
        const staffDoc = await Staff.findById(enq.assignedStaff).select('gym createdBy');
        if (staffDoc?.gym) {
          resolvedGymId = staffDoc.gym as Types.ObjectId;
        }
        if (!resolvedAdminId && staffDoc?.createdBy) {
          resolvedAdminId = staffDoc.createdBy as Types.ObjectId;
        }
      }

      if (resolvedGymId) {
        const updateSet: any = { gymId: resolvedGymId };
        if (!enq.adminId && resolvedAdminId) {
          updateSet.adminId = resolvedAdminId;
        }
        await Enquiry.updateOne(
          { _id: enq._id, $or: [{ gymId: { $exists: false } }, { gymId: null }] },
          { $set: updateSet }
        );
        updated++;
      }
    }

    if (updated > 0) {
      console.log(`✅ Backfilled gymId on ${updated} legacy enquiry record(s)`);
    }
  } catch (err) {
    console.error('⚠️ Error backfilling enquiry gymIds:', err);
  }
};