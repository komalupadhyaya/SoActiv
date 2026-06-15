import type { Request, Response, NextFunction } from 'express';
import { Announcement } from '../models/announcement.model';
import ApiError from '../lib/ApiError';
import { HttpStatusCode } from '../lib/const';
import { notifyGymStaff, notifyGymMembers } from '../utils/notification.helper';

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
        const isSuperAdmin = user.role === 'superadmin';
        const finalTargetAudience = isSuperAdmin ? 'admin' : targetAudience;

        const announcement = await Announcement.create({
            title,
            message,
            targetAudience: finalTargetAudience,
            visibleRoles: visibleRoles || [],
            priority: priority || 'normal',
            createdBy: user.id || user._id,
            adminId,
            expiresAt: new Date(expiresAt),
            isActive: true,
            isPlatformWide: isSuperAdmin
        });

        res.status(201).json({ success: true, data: announcement, message: 'Announcement created' });

        // ── Fan-out in-app notifications after response is sent ────────────────────────
        if (isSuperAdmin) {
            try {
                const { User } = await import('../models/user.model');
                const gymAdmins = await User.find({ role: 'admin' }).select('_id gym');
                const { createNotification } = await import('../utils/notification.helper');
                for (const admin of gymAdmins) {
                    await createNotification({
                        recipientId: admin._id.toString(),
                        recipientRole: 'admin',
                        gymId: admin.gym?.toString(),
                        type: 'announcement' as const,
                        title: `📢 ${title}`,
                        message,
                        link: '/admin/announcements',
                        metadata: { announcementId: (announcement as any)._id.toString(), priority },
                    });
                }
            } catch (err) {
                console.error('[AnnouncementController] Super Admin notification dispatch failed:', err);
            }
        } else {
            const gymId = (req as any).user?.gym;
            if (gymId) {
                const notifPayload = {
                    gymId,
                    type: 'announcement' as const,
                    title: `📢 ${title}`,
                    message,
                    link: '/staff/announcements',
                    metadata: { announcementId: (announcement as any)._id.toString(), priority },
                };

                if (finalTargetAudience === 'staff' || finalTargetAudience === 'all') {
                    await notifyGymStaff(notifPayload);
                }
                if (finalTargetAudience === 'members' || finalTargetAudience === 'all') {
                    await notifyGymMembers({ ...notifPayload, link: '/member/dashboard' });
                }
            }
        }
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
        const now = new Date();
        const role = user.role;
        const position = user.position;

        let adminId: string;

        if (role === 'member') {
            // ⚠️ Members don't have adminId in their JWT.
            // We look up their Client record to get the gym owner's userId (adminId).
            // Without this, the query filters by the member's own ID and returns nothing.
            const { Client } = await import('../models/client.model');
            const clientRecord = await Client.findOne({ email: user.email?.toLowerCase() }).select('userId');
            if (!clientRecord) {
                return res.status(200).json({ success: true, data: [] });
            }
            adminId = clientRecord.userId.toString();
        } else {
            adminId = user.adminId || user.id || user._id;
        }

        const query: any = {
            isActive: true,
            expiresAt: { $gt: now } // Only show non-expired
        };

        if (role === 'admin' || role === 'superadmin') {
            // Admin sees their own gym's announcements OR platform-wide announcements
            query.$or = [
                { adminId },
                { isPlatformWide: true }
            ];
        } else {
            // Non-admins only see their own gym's announcements
            query.adminId = adminId;
        }

        const role2 = role; // alias for filtering block below
        if (role2 === 'admin' || role2 === 'superadmin') {
            // Admin sees all they created
        } else if (role2 === 'staff') {
            if (position === 'manager') {
                query.targetAudience = { $in: ['staff', 'all', 'members', 'admin'] };
            } else {
                query.targetAudience = { $in: ['staff', 'all'] };
                query.$or = [
                    { visibleRoles: { $size: 0 } },
                    { visibleRoles: position }
                ];
            }
        } else if (role2 === 'member') {
            // Members see announcements targeted at 'members' or 'all'
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
        const user = (req as any).user;

        const announcement = await Announcement.findById(id);
        if (!announcement) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'Announcement not found');
        }

        if (announcement.isPlatformWide && user.role !== 'superadmin') {
            throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not have permission to edit platform-wide announcements');
        }

        // Prevent changing immutable fields
        delete updates.adminId;
        delete updates.createdBy;

        const updatedAnnouncement = await Announcement.findByIdAndUpdate(id, updates, { new: true });

        res.status(200).json({ success: true, data: updatedAnnouncement, message: 'Announcement updated' });
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
        const user = (req as any).user;
        const announcement = await Announcement.findById(id);

        if (!announcement) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, 'Announcement not found');
        }

        if (announcement.isPlatformWide && user.role !== 'superadmin') {
            throw new ApiError(HttpStatusCode.FORBIDDEN, 'You do not have permission to delete platform-wide announcements');
        }

        await Announcement.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
};
