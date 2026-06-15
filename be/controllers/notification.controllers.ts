import type { Request, Response } from 'express';
import { Notification } from '../models/notification.model';
import { Types } from 'mongoose';

const PAGE_SIZE = 15;

// ─── GET /api/v1/notifications ───────────────────────────────────────────────
/**
 * Fetch paginated notifications for the authenticated user.
 * Newest first. Returns unread count alongside the list.
 */
export const getNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const page = Math.max(0, parseInt((req.query.page as string) || '0', 10));
    const limit = Math.min(50, parseInt((req.query.limit as string) || String(PAGE_SIZE), 10));
    const onlyUnread = req.query.unread === 'true';

    const filter: any = { recipientId: new Types.ObjectId(userId) };
    if (onlyUnread) filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipientId: new Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: (page + 1) * limit < total,
          hasPrev: page > 0,
        },
      },
    });
  } catch (error: any) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Could not fetch notifications' });
  }
};

// ─── PATCH /api/v1/notifications/:id/read ────────────────────────────────────
/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!Types.ObjectId.isValid(id || '')) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(id as string), recipientId: new Types.ObjectId(userId as string) },
      { isRead: true },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, data: notif });
  } catch (error: any) {
    console.error('markNotificationRead error:', error);
    return res.status(500).json({ success: false, message: 'Could not update notification' });
  }
};

// ─── PATCH /api/v1/notifications/read-all ────────────────────────────────────
/**
 * Mark ALL unread notifications for the current user as read.
 */
export const markAllNotificationsRead = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await Notification.updateMany(
      { recipientId: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notification(s) as read`,
    });
  } catch (error: any) {
    console.error('markAllNotificationsRead error:', error);
    return res.status(500).json({ success: false, message: 'Could not update notifications' });
  }
};

// ─── DELETE /api/v1/notifications/:id ────────────────────────────────────────
/**
 * Delete a single notification belonging to the authenticated user.
 */
export const deleteNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!Types.ObjectId.isValid(id || '')) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: new Types.ObjectId(id as string),
      recipientId: new Types.ObjectId(userId as string),
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({ success: false, message: 'Could not delete notification' });
  }
};

// ─── DELETE /api/v1/notifications ────────────────────────────────────────────
/**
 * Clear ALL notifications for the authenticated user.
 */
export const clearAllNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const result = await Notification.deleteMany({
      recipientId: new Types.ObjectId(userId),
    });

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} notification(s)`,
    });
  } catch (error: any) {
    console.error('clearAllNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Could not clear notifications' });
  }
};
