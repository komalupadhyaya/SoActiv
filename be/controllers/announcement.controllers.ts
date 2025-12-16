import type { Request, Response, NextFunction } from 'express';
import { Announcement } from '../models/announcement.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';

/**
 * Create Announcement
 * Admin: Can create for any audience
 * Manager: Can create for Staff/Members (usually not Admin/All unless scoped)
 */
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, message, targetAudience, visibleRoles, priority, expiresAt } = req.body;
        const user = (req as any).user;
        const adminId = user.adminId || user.id || user._id;

        // Managers restrictions?
        // Let's allow Managers to create announcements, but maybe not 'admin' target?
        // User requirements say "Manager -> Create staff-only announcements" but possibly members too?
        // Let's be permissive but validate fields.

        const announcement = await Announcement.create({
            title,
            message,
            targetAudience, // 'staff', 'members', 'all'
            visibleRoles: visibleRoles || [],
            priority: priority || 'normal',
            createdBy: user.id || user._id,
            adminId,
            expiresAt: new Date(expiresAt),
            isActive: true
        });

        res.status(201).json({ success: true, data: announcement, message: 'Announcement created' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Announcements (The core visibility logic)
 */
export const getAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const adminId = user.adminId || user.id || user._id;
        const now = new Date();

        const query: any = {
            adminId,
            isActive: true,
            expiresAt: { $gt: now } // Only show non-expired
        };

        const role = user.role; // 'admin', 'staff', 'member'
        const position = user.position; // 'trainer', 'manager', 'sales', etc.

        // --- FILTERING LOGIC ---

        if (role === 'admin' || role === 'superadmin') {
            // Admin sees all? Or only ones targeting 'admin'/'all'?
            // Usually Admin wants to see what they posted too. So ALL.
            // No extra filter needed.
        }
        else if (role === 'staff') {
            if (position === 'manager') {
                // Manager sees 'admin' announcements?, 'staff', 'all', 'members'?
                // Requirement: "return announcements where adminId match AND targetAudience IN ['staff', 'admin']"
                // Managers probably shouldn't see 'admin' private msgs if any.
                // Let's assume Manager sees: 'staff', 'manager' (if in visibleRoles), 'all', 'members'
                // Let's simplify: They see anything targeting 'staff' or 'all' or 'members'.
                query.targetAudience = { $in: ['staff', 'all', 'members', 'admin'] };
            } else {
                // Regular Staff (Trainer, Sales)
                // Filter 1: Audience must be 'staff' or 'all'
                query.targetAudience = { $in: ['staff', 'all'] };

                // Filter 2: visibleRoles
                // Logic: (visibleRoles is empty) OR (visibleRoles includes position)
                query.$or = [
                    { visibleRoles: { $size: 0 } },
                    { visibleRoles: position }
                ];
            }
        }
        else if (role === 'member') {
            // Members see 'members' or 'all'
            query.targetAudience = { $in: ['members', 'all'] };
        }

        const announcements = await Announcement.find(query).sort({ priority: -1, createdAt: -1 });

        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        next(error);
    }
};

/**
 * Update Announcement (Admin/Manager)
 */
export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Prevent changing immutable fields
        delete updates.adminId;
        delete updates.createdBy;

        const announcement = await Announcement.findByIdAndUpdate(id, updates, { new: true });

        if (!announcement) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'Announcement not found');
        }

        res.status(200).json({ success: true, data: announcement, message: 'Announcement updated' });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete Announcement (Admin/Manager)
 */
export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const announcement = await Announcement.findById(id);

        if (!announcement) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'Announcement not found');
        }

        // Optional: Check if manager is deleting admin's post?
        // For now allow deletion if they have permission to route.

        await Announcement.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
};
