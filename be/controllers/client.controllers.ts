// controllers/client.controller.ts
import type { Request, Response } from 'express';
import { Client } from '../models/client.model';
import { Staff } from '../models/staff.model';
import { User } from '../models/user.model';
import { Gym } from '../models/gym.model';
import type { IClient } from '../models/client.model';
import type { FilterQuery, UpdateQuery } from 'mongoose';
import { Server as IOServer } from 'socket.io';
import { asyncHandler } from '../lib/AsyncHandler';
import { generateSecurePassword } from '../utils/password.util';
import { sendClientWelcomeEmail } from '../utils/emailSender';
import { createNotification } from '../utils/notification.helper';

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
 * Atomically creates a User account (role: member) + Client record.
 * Sends a welcome email with login credentials to the client.
 * Rolls back the User if Client creation fails.
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'staff' && user.position === 'cleaner') {
    return res.status(403).json({ success: false, message: 'Access denied. Cleaners cannot access member data.' });
  }
  let createdMemberUserId: string | null = null;

  try {
    // 1. Resolve true Owner ID
    const ownerId = await getOwnerId(req);

    // 2. Uniqueness Check for Client record (scoped to this gym owner)
    const clientEmail = req.body.email?.toLowerCase();
    const clientPhone = req.body.contactNumber;

    const existingClient = await Client.findOne({
      userId: ownerId,
      $or: [{ email: clientEmail }, { contactNumber: clientPhone }],
    });

    if (existingClient) {
      if (existingClient.email === clientEmail) {
        console.log('❌ [createClient] Duplicate client email:', clientEmail);
        return res.status(400).json({ success: false, message: 'Client with this email already exists' });
      }
      console.log('❌ [createClient] Duplicate client phone:', clientPhone);
      return res.status(400).json({ success: false, message: 'Client with this contact number already exists' });
    }

    // 3. Check global User email uniqueness (client needs a login account)
    const existingUser = await User.findOne({ email: clientEmail });
    if (existingUser) {
      console.log('❌ [createClient] Email already in User table:', clientEmail, '| role:', existingUser.get('role'));
      return res.status(400).json({
        success: false,
        message: `This email is already registered as a ${existingUser.get('role')} account. Use a different email.`,
      });
    }

    // 4. Fetch gym info (for email + gym linkage)
    const ownerUser = await User.findById(ownerId).select('gym');
    const gymId = ownerUser?.gym;
    let gymName = 'SoActiv Gym';
    if (gymId) {
      try {
        const gymDoc = await Gym.findById(gymId);
        if (gymDoc) gymName = gymDoc.name;
      } catch (gymErr) {
        console.error('⚠️ Could not fetch gym name for client email:', gymErr);
      }
    }

    // 5. Generate random password and create Member User account
    const generatedPassword = generateSecurePassword(12);

    const newMemberUser = new User({
      fullname: req.body.fullName,
      email: clientEmail,
      phone: clientPhone,
      password: generatedPassword, // Will be hashed by pre-save hook
      role: 'member',
      gym: gymId,
      avatar: req.body.fullName?.charAt(0)?.toUpperCase() || 'M',
    });

    const savedMemberUser = await newMemberUser.save();
    createdMemberUserId = savedMemberUser._id.toString();
    console.log('✅ Member User account created:', createdMemberUserId);

    // 6. Create Client record — userId = gym owner (tenant scope)
    try {
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

        salesRep: req.body.salesRep || undefined,
        memberManager: req.body.memberManager || undefined,
        trainer: req.body.trainer || undefined,

        attendanceId: req.body.attendanceId,
        clubId: req.body.clubId,
        gstNo: req.body.gstNo,

        startDate: req.body.startDate,
        endDate: req.body.endDate,

        packagePrice: req.body.packagePrice,
        hasPersonalTraining: req.body.hasPersonalTraining || false,
        personalTrainer: (req.body.hasPersonalTraining && req.body.personalTrainer) ? req.body.personalTrainer : undefined,
        personalTrainingDurationWeeks: req.body.hasPersonalTraining ? req.body.personalTrainingDurationWeeks : undefined,
        personalTrainingPrice: req.body.hasPersonalTraining ? req.body.personalTrainingPrice : undefined,

        plan: req.body.plan,
        timing: req.body.timing,
        notifications: req.body.notifications || { sms: true, email: true, push: true, whatsapp: true },
      };

      const newClient = new Client({ ...allowedFields, userId: ownerId, clientUserId: createdMemberUserId });
      const savedClient = await newClient.save();
      console.log('✅ Client record created:', savedClient._id);

      // 7. Send welcome email with login credentials (non-blocking — failure won't fail the request)
      const emailResult = await sendClientWelcomeEmail(
        clientEmail,
        req.body.fullName,
        generatedPassword,
        gymName,
        req.body.plan,
        req.body.endDate ? new Date(req.body.endDate) : undefined
      );

      if (!emailResult.success) {
        console.warn('⚠️ Client welcome email failed to send:', emailResult.error);
      } else {
        console.log('✅ Client welcome email sent:', emailResult.messageId);
      }

      // 8. Emit real-time event to Owner's room
      emitToUserRoom(req, ownerId, 'client:created', savedClient);

      // 9. Notify admin about new member
      await createNotification({
        recipientId: ownerId,
        recipientRole: 'admin',
        type: 'member_joined',
        title: '👋 New Member Joined',
        message: `${req.body.fullName} has been registered as a new member`,
        link: '/admin/clients',
        metadata: { clientId: savedClient._id.toString(), name: req.body.fullName },
      });

      // 9b. Notify assigned staff members
      try {
        const assignedStaffIds = [
          savedClient.salesRep,
          savedClient.memberManager,
          savedClient.trainer,
          savedClient.personalTrainer
        ].filter(Boolean);

        if (assignedStaffIds.length > 0) {
          const uniqueStaffIds = Array.from(new Set(assignedStaffIds.map(id => id!.toString())));
          const staffDocs = await Staff.find({ _id: { $in: uniqueStaffIds } }).select('userId fullName gym');

          for (const staffDoc of staffDocs) {
            if (staffDoc.userId) {
              await createNotification({
                recipientId: staffDoc.userId.toString(),
                recipientRole: 'staff',
                gymId: staffDoc.gym?.toString(),
                type: 'member_joined',
                title: '👤 New Client Assigned',
                message: `You have been assigned to new client: ${savedClient.fullName}`,
                link: '/staff/members',
                metadata: {
                  clientId: savedClient._id.toString(),
                  name: savedClient.fullName
                }
              });
              console.log(`[ClientNotif] Dispatched assignment notification to staff user ${staffDoc.userId} (${staffDoc.fullName})`);
            }
          }
        }
      } catch (staffNotifError) {
        console.error('Failed to notify assigned staff:', staffNotifError);
      }

      return res.status(201).json({
        success: true,
        message: 'Client account created successfully',
        data: {
          ...savedClient.toObject(),
          emailSent: emailResult.success,
        },
      });

    } catch (clientErr: any) {
      // ROLLBACK: Delete the Member User if Client creation failed
      console.error('❌ Client creation failed, rolling back Member User:', createdMemberUserId);
      if (createdMemberUserId) {
        await User.findByIdAndDelete(createdMemberUserId);
        console.log('✅ Member User rolled back:', createdMemberUserId);
      }
      return res.status(500).json({
        success: false,
        message: clientErr.message || 'Failed to create client record',
      });
    }

  } catch (err: any) {
    // Top-level rollback safety net
    if (createdMemberUserId) {
      await User.findByIdAndDelete(createdMemberUserId);
      console.log('✅ Member User rolled back (top-level):', createdMemberUserId);
    }
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
});

/**
 * GET ALL CLIENTS
 */
export const getAllClients = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role === 'staff' && user.position === 'cleaner') {
    return res.status(403).json({ success: false, message: 'Access denied. Cleaners cannot access member data.' });
  }

  // If the user is a member, they should only see their own client record (matched by email)
  if (user.role === 'member') {
    const clients = await Client.find({ email: user.email.toLowerCase() })
      .populate([
        { path: 'salesRep', select: 'fullName' },
        { path: 'memberManager', select: 'fullName' },
        { path: 'trainer', select: 'fullName' },
        { path: 'personalTrainer', select: 'fullName' },
      ]);
    return res.json({ success: true, count: clients.length, data: clients });
  }

  // 1. Resolve true Owner ID
  const ownerId = await getOwnerId(req);

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
  const user = (req as any).user;
  if (user && user.role === 'staff' && user.position === 'cleaner') {
    return res.status(403).json({ success: false, message: 'Access denied. Cleaners cannot access member data.' });
  }
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
  const user = (req as any).user;
  if (user && user.role === 'staff' && user.position === 'cleaner') {
    return res.status(403).json({ success: false, message: 'Access denied. Cleaners cannot access member data.' });
  }
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
    salesRep: req.body.salesRep === '' ? null : req.body.salesRep,
    memberManager: req.body.memberManager === '' ? null : req.body.memberManager,
    trainer: req.body.trainer === '' ? null : req.body.trainer,
    attendanceId: req.body.attendanceId,
    clubId: req.body.clubId,
    gstNo: req.body.gstNo,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    packagePrice: req.body.packagePrice,
    hasPersonalTraining: req.body.hasPersonalTraining,
    personalTrainer: req.body.hasPersonalTraining ? (req.body.personalTrainer === '' ? null : req.body.personalTrainer) : undefined,
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
  const user = (req as any).user;
  if (user && user.role === 'staff' && user.position === 'cleaner') {
    return res.status(403).json({ success: false, message: 'Access denied. Cleaners cannot access member data.' });
  }
  const ownerId = await getOwnerId(req);
  const { id } = req.params;

  // Check if requester is Manager
  if (user && user.role === 'staff' && user.position === 'manager') {
    const client = await Client.findOne({ _id: id, userId: ownerId });
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

    client.deleteRequested = true;
    client.deleteRequestedBy = user.staffId;
    client.deleteRequestedAt = new Date();
    await client.save();

    emitToUserRoom(req, ownerId, 'client:updated', client);

    // Notify Admin (ownerId is the admin's user ID)
    await createNotification({
      recipientId: ownerId,
      recipientRole: 'admin',
      gymId: client.clubId || user.gym,
      type: 'client',
      title: '🚨 Client Deletion Request',
      message: `Manager ${user.fullName || 'Staff'} has requested to delete member ${client.fullName}.`,
      link: '/admin/clients',
      metadata: {
        clientId: client._id.toString()
      }
    });

    return res.json({
      success: true,
      message: 'Client deletion request submitted to Admin for approval',
      data: client,
      requested: true
    });
  }

  // Check if user is other staff role trying to delete
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Access denied. You do not have permission to delete members.' });
  }

  const deletedClient = await Client.findOneAndDelete({ _id: id, userId: ownerId });
  if (!deletedClient) return res.status(404).json({ success: false, message: 'Client not found' });

  emitToUserRoom(req, ownerId, 'client:deleted', { id: deletedClient._id.toString() });

  res.json({ success: true, message: 'Client deleted successfully', data: deletedClient });
});

/**
 * REJECT DELETE CLIENT
 */
export const rejectDeleteClient = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Only administrators can reject deletion requests.' });
  }

  const { id } = req.params;
  const ownerId = await getOwnerId(req);

  const client = await Client.findOneAndUpdate(
    { _id: id, userId: ownerId },
    {
      deleteRequested: false,
      $unset: { deleteRequestedBy: 1, deleteRequestedAt: 1 }
    },
    { new: true }
  );

  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  emitToUserRoom(req, ownerId, 'client:updated', client);

  res.json({ success: true, message: 'Client deletion request rejected', data: client });
});

/**
 * Send renewal notification to member
 */
export const notifyRenewal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const client = await Client.findById(id);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  const memberUser = await User.findOne({ email: client.email.toLowerCase() });
  if (!memberUser) {
    return res.status(404).json({ success: false, message: 'No registered user account found for this member.' });
  }

  await createNotification({
    recipientId: memberUser._id,
    recipientRole: 'member',
    gymId: client.clubId || (req as any).user.gym,
    type: 'member_expiring',
    title: '⏰ Membership Renewal Reminder',
    message: `Dear ${client.fullName}, your membership is expiring on ${new Date(client.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Please renew today to keep your access active!`,
    link: '/member/dashboard',
  });

  res.json({ success: true, message: `Renewal notification sent successfully to ${client.fullName}.` });
});

/**
 * Forward renewal to sales staff by creating a follow-up task
 */
export const forwardRenewal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { salesStaffId, note } = req.body;

  if (!salesStaffId) {
    return res.status(400).json({ success: false, message: 'salesStaffId is required' });
  }

  const client = await Client.findById(id);
  if (!client) {
    return res.status(404).json({ success: false, message: 'Client not found' });
  }

  const staff = await Staff.findById(salesStaffId);
  if (!staff) {
    return res.status(404).json({ success: false, message: 'Sales staff member not found' });
  }

  const { FollowUp } = await import('../models/followUp.model');
  const { Types } = await import('mongoose');

  const today = new Date();
  const scheduledDate = new Date(today);
  scheduledDate.setDate(today.getDate() + 1); // Schedule for tomorrow
  const timeStr = "10:00";

  // Create follow-up task for the sales representative
  const followUp = await FollowUp.create({
    userId: client.userId, // Admin ID
    assignedTo: staff._id,
    type: 'client',
    relatedId: client._id,
    relatedName: client.fullName,
    scheduledDate,
    scheduledTime: timeStr,
    note: note || `Renewal follow-up for ${client.fullName}. Membership expires on ${new Date(client.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
    status: 'pending',
  });

  // Notify the sales representative in real-time
  if (staff.userId) {
    await createNotification({
      recipientId: staff.userId.toString(),
      recipientRole: 'staff',
      gymId: staff.gym?.toString(),
      type: 'follow_up_due',
      title: '📋 Renewal Follow-up Assigned',
      message: `You have been assigned to follow up on ${client.fullName}'s renewal (expires ${new Date(client.endDate).toLocaleDateString()}).`,
      link: '/staff/follow-ups',
      metadata: { followUpId: followUp._id.toString() },
    });
  }

  res.json({ success: true, message: `Successfully forwarded renewal follow-up for ${client.fullName} to sales representative ${staff.fullName}.` });
});

