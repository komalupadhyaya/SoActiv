import type { Request, Response } from 'express';
import { Contact } from '../models/contact.model';
import { Types } from 'mongoose';
import { asyncHandler } from '../lib/AsyncHandler';
import ApiError from '../lib/ApiError';

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
    const source = user && (user.role === 'admin' || user.role === 'staff' || user.role === 'trainer') ? 'admin' : 'public';

    // If admin, use their gym ID if not explicitly provided or to override
    const finalGymId = (source === 'admin' && user?.gym) ? user.gym : gymId;

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
});

/**
 * @desc    Get all contact messages (SuperAdmin only)
 * @route   GET /api/v1/contact/superadmin/list
 * @access  Private (SuperAdmin)
 */
export const getContacts = asyncHandler(async (req: Request, res: Response) => {
    const { status, category, page = 1, limit = 20 } = req.query;

    const filter: any = {};
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
    const unreadCount = await Contact.countDocuments({ status: 'new' });

    res.status(200).json({
        success: true,
        data: {
            unreadCount
        }
    });
});
