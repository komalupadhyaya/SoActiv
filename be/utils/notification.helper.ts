import { Types } from 'mongoose';
import { Notification } from '../models/notification.model';
import type { NotificationType } from '../models/notification.model';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CreateNotifOptions {
  recipientId: Types.ObjectId | string;
  recipientRole: 'superadmin' | 'admin' | 'staff' | 'member';
  gymId?: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

interface BulkNotifOptions {
  gymId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

// ─── Single Notification ─────────────────────────────────────────────────────
/**
 * Create a single notification for one recipient.
 * Safe to call from any controller — failures are caught internally so they
 * never break the primary request.
 */
export async function createNotification(opts: CreateNotifOptions): Promise<void> {
  try {
    await Notification.create({
      ...opts,
      recipientId: new Types.ObjectId(opts.recipientId.toString()),
      gymId: opts.gymId ? new Types.ObjectId(opts.gymId.toString()) : undefined,
    });
  } catch (err) {
    // Notification failures must NEVER break main business logic
    console.error('[NotifHelper] createNotification error:', err);
  }
}

// ─── Bulk: Notify All Active Staff of a Gym ──────────────────────────────────
/**
 * Fan-out a notification to every active staff member in a gym.
 * Useful for announcements, schedule changes, etc.
 */
export async function notifyGymStaff(opts: BulkNotifOptions): Promise<void> {
  try {
    const { User } = await import('../models/user.model');
    const staffList = await User.find({
      role: { $in: ['staff', 'trainer', 'admin'] },
      gym: new Types.ObjectId(opts.gymId.toString()),
    }).select('_id');

    if (!staffList.length) return;

    const docs = staffList.map((s) => ({
      recipientId: s._id,
      recipientRole: 'staff' as const,
      gymId: new Types.ObjectId(opts.gymId.toString()),
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      metadata: opts.metadata,
    }));

    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error('[NotifHelper] notifyGymStaff error:', err);
  }
}

// ─── Bulk: Notify All Active Members of a Gym ────────────────────────────────
/**
 * Fan-out a notification to every active member (client) in a gym.
 * Used for gym-wide announcements targeting members.
 */
export async function notifyGymMembers(opts: BulkNotifOptions): Promise<void> {
  try {
    const { User } = await import('../models/user.model');
    const members = await User.find({
      role: 'member',
      gym: new Types.ObjectId(opts.gymId.toString()),
    }).select('_id');

    if (!members.length) return;

    const docs = members.map((m) => ({
      recipientId: m._id,
      recipientRole: 'member' as const,
      gymId: new Types.ObjectId(opts.gymId.toString()),
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link,
      metadata: opts.metadata,
    }));

    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error('[NotifHelper] notifyGymMembers error:', err);
  }
}
