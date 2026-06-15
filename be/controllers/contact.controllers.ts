import type { Request, Response } from 'express';
import { Contact, type ContactStatus } from '../models/contact.model';
import { Types } from 'mongoose';
import { asyncHandler } from '../lib/AsyncHandler';
import ApiError from '../lib/ApiError';
import { createNotification } from '../utils/notification.helper';

/**
 * @desc    Create a new support contact message
 * @route   POST /api/v1/contact
 * @access  Public / Admin
 */
export const createContact = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, category, message, gymId } = req.body;

    if (!name || !email || !category || !message) {
        throw new ApiError(400, 'Please provide name, email, category, and message');
    }

    // Determine source and gymId based on auth
    const user = req.user;
    let source = req.body.source || 'public';
    if (user && !req.body.source) {
        if (user.role === 'member') {
            source = 'member';
        } else if (['admin', 'staff', 'trainer'].includes(user.role)) {
            source = 'admin';
        }
    }

    // If admin or member, use their gym ID if not explicitly provided or to override
    const finalGymId = ((source === 'admin' || source === 'member') && user?.gym) ? user.gym : gymId;

    const contact = await Contact.create({
        name,
        email,
        phone,
        category,
        message,
        source,
        gymId: finalGymId && Types.ObjectId.isValid(finalGymId) ? new Types.ObjectId(finalGymId) : null,
        status: 'new'
    });

    res.status(201).json({
        success: true,
        message: 'Support message sent successfully',
        data: contact
    });

    // ── Notify recipients about the new support ticket ───────────────────────
    try {
        const { User } = await import('../models/user.model');
        if (source === 'member' && finalGymId) {
            // Member sent a ticket → Notify all admins in the member's gym
            const gymAdmins = await User.find({ role: 'admin', gym: finalGymId }).select('_id');
            for (const admin of gymAdmins) {
                await createNotification({
                    recipientId: admin._id,
                    recipientRole: 'admin',
                    type: 'support_ticket',
                    title: '🎟️ New Member Support Request',
                    message: `${name} submitted a support request: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
                    link: '/admin/contact-support',
                    metadata: { contactId: (contact as any)._id.toString(), category, name, email },
                });
            }
        } else {
            // Public/Admin ticket → Notify superadmins
            const superAdmins = await User.find({ role: 'superadmin' }).select('_id');
            for (const sa of superAdmins) {
                await createNotification({
                    recipientId: sa._id,
                    recipientRole: 'superadmin',
                    type: 'support_ticket',
                    title: '🎟️ New Support Ticket',
                    message: `${name} submitted a support message: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
                    link: '/super-admin/contacts',
                    metadata: { contactId: (contact as any)._id.toString(), category, name, email },
                });
            }
        }
    } catch (err) {
        console.error('[Contact] Failed to notify admins:', err);
    }
});

/**
 * @desc    Get all contact messages (SuperAdmin only)
 * @route   GET /api/v1/contact/superadmin/list
 * @access  Private (SuperAdmin)
 */
export const getContacts = asyncHandler(async (req: Request, res: Response) => {
    const { status, category, page = 1, limit = 20 } = req.query;

    const filter: any = {
        source: { $ne: 'member' }
    };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
        Contact.find(filter)
            .populate('gymId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Contact.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: contacts,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        }
    });
});

/**
 * @desc    Update contact status (SuperAdmin only)
 * @route   PATCH /api/v1/contact/superadmin/:id/status
 * @access  Private (SuperAdmin)
 */
export const updateContactStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'closed'].includes(status)) {
        throw new ApiError(400, 'Invalid status');
    }

    const contact = await Contact.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!contact) {
        throw new ApiError(404, 'Contact message not found');
    }

    res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: contact
    });
});

/**
 * @desc    Get contact statistics for dashboard (SuperAdmin only)
 * @route   GET /api/v1/contact/superadmin/stats
 * @access  Private (SuperAdmin)
 */
export const getContactStats = asyncHandler(async (req: Request, res: Response) => {
    const unreadCount = await Contact.countDocuments({ status: 'new', source: { $ne: 'member' } });

    res.status(200).json({
        success: true,
        data: {
            unreadCount
        }
    });
});

/**
 * @desc    Get all contact messages for the Gym Admin/Staff's gym
 * @route   GET /api/v1/contact/gym/list
 * @access  Private (Gym Admin / Manager)
 */
export const getGymContacts = asyncHandler(async (req: Request, res: Response) => {
    const gymId = req.user?.gym;
    if (!gymId) {
        throw new ApiError(400, 'No gym associated with this user');
    }

    const { status, category, page = 1, limit = 20 } = req.query;

    const filter: any = {
        gymId: new Types.ObjectId(gymId),
        source: 'member' // only show messages from members
    };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const userRole = req.user?.role;
    if (userRole === 'admin') {
        filter.isEscalated = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
        Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Contact.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        data: contacts,
        pagination: {
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit))
        }
    });
});

/**
 * @desc    Update gym contact message status
 * @route   PATCH /api/v1/contact/gym/:id/status
 * @access  Private (Gym Admin / Manager)
 */
export const updateGymContactStatus = asyncHandler(async (req: Request, res: Response) => {
    const gymId = req.user?.gym;
    if (!gymId) {
        throw new ApiError(400, 'No gym associated with this user');
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'read', 'escalated', 'closed'].includes(status)) {
        throw new ApiError(400, 'Invalid status');
    }

    const contact = await Contact.findOne({
        _id: new Types.ObjectId(id),
        gymId: new Types.ObjectId(gymId)
    });

    if (!contact) {
        throw new ApiError(404, 'Contact message not found in your gym');
    }

    // Role-based status transition checks
    const userRole = req.user?.role;
    const userPosition = req.user?.position;
    const isManager = userRole === 'staff' && userPosition === 'manager';

    if (isManager && (contact.status === 'escalated' || contact.isEscalated)) {
        throw new ApiError(403, 'Cannot modify a ticket that has been escalated to Admin');
    }

    if (status === 'escalated') {
        contact.isEscalated = true;
    }

    contact.status = status as ContactStatus;
    await contact.save();

    res.status(200).json({
        success: true,
        message: `Status updated to ${status}`,
        data: contact
    });
});

/**
 * @desc    Get support messages sent by the logged-in member
 * @route   GET /api/v1/contact/my
 * @access  Private (Member only)
 */
export const getMyContacts = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiError(401, 'Unauthorized');
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
        throw new ApiError(400, 'User email not found');
    }

    const contacts = await Contact.find({
        email: userEmail,
        source: 'member'
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        data: contacts
    });
});

