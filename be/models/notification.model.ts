import mongoose, { Schema, model, Document, Types } from 'mongoose';

// ─── Notification Type Union ─────────────────────────────────────────────────
export type NotificationType =
  // Admin / Staff triggers
  | 'new_enquiry'         // new lead created
  | 'member_expiring'     // membership expiring soon
  | 'pt_expiring'         // PT plan expiring soon
  | 'follow_up_due'       // follow-up reminder
  | 'member_joined'       // new client registered
  | 'announcement'        // admin broadcast
  | 'staff_pending'       // staff creation/update/deletion pending approval
  | 'client'              // client action pending approval
  // Member triggers
  | 'membership_renewed'  // their membership was renewed
  | 'schedule_updated'    // class schedule changed
  | 'diet_plan_assigned'  // trainer assigned diet plan
  | 'pt_session_scheduled'// PT session booked
  // Super Admin triggers
  | 'new_gym_registered'  // new gym signed up
  | 'plan_expiring'       // gym's SoActiv plan expiring
  | 'support_ticket'      // contact form submitted
  // Class triggers
  | 'class_cancelled'     // a class session was cancelled
  | 'class_booking_confirmed' // member booked a class
  | 'class_reminder';     // upcoming class reminder

// ─── Interface ───────────────────────────────────────────────────────────────
export interface INotification extends Document {
  recipientId: Types.ObjectId;
  recipientRole: 'superadmin' | 'admin' | 'staff' | 'member';
  gymId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────
const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['superadmin', 'admin', 'staff', 'member'],
      required: true,
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: 'Gym',
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Compound index for fast per-user queries sorted by newest first
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
// Auto-delete notifications older than 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

export const Notification = model<INotification>('Notification', notificationSchema);
