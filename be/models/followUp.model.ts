// models/followUp.model.ts

import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';

/**
 * Follow-Up Type
 */
export type FollowUpType = 'enquiry' | 'client' | 'pt' | 'call' | 'message' | 'visit' | 'other';
export type FollowUpStatus = 'pending' | 'completed' | 'failed' | 'rescheduled' | 'cancelled' | 'reschedule_pending';

/**
 * Interface for the FollowUp document
 */
export interface IFollowUp extends Document {
  userId: Types.ObjectId; // Reference to Admin/Owner who created the follow-up
  assignedTo: Types.ObjectId; // Reference to Staff assigned to this follow-up
  type: FollowUpType; // Type of follow-up
  relatedId: Types.ObjectId; // ID of the related enquiry, client, or PT package
  relatedName: string; // Name of the person/entity for quick reference
  scheduledDate: Date; // Date when follow-up is scheduled
  scheduledTime: string; // Time in HH:MM format
  note: string; // Follow-up notes (e.g., "Call back in 3 days")
  status: FollowUpStatus; // Status of the follow-up
  reminderSent: boolean; // Flag to indicate if reminder notification has been sent
  proposedDate?: Date | null; // New proposed date awaiting admin approval
  proposedTime?: string | null; // New proposed time awaiting admin approval
  rescheduleReason?: string | null; // Reason staff wants to reschedule
  completedAt: Date | null; // When the follow-up was completed
  completedBy: Types.ObjectId | null; // Staff who completed the follow-up
  completionNotes: string | null; // Notes added upon completion/failure
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for the FollowUp Model
 */
interface IFollowUpModel extends Model<IFollowUp> {
  // Add static methods here if needed
}

/**
 * Mongoose Schema Definition
 */
const FollowUpSchema = new Schema<IFollowUp, IFollowUpModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true, // For gym isolation queries
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Assigned staff is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['enquiry', 'client', 'pt', 'call', 'message', 'visit', 'other'],
        message: 'Type must be one of: enquiry, client, pt, call, message, visit, other',
      },
      required: [true, 'Follow-up type is required'],
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Related ID is required'],
    },
    relatedName: {
      type: String,
      required: [true, 'Related name is required'],
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      index: true,
    },
    scheduledTime: {
      type: String,
      required: [true, 'Scheduled time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'],
    },
    note: {
      type: String,
      required: [true, 'Follow-up note is required'],
      trim: true,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'completed', 'failed', 'rescheduled', 'cancelled', 'reschedule_pending'],
        message: 'Status must be one of: pending, completed, failed, rescheduled, cancelled, reschedule_pending',
      },
      default: 'pending',
      index: true,
    },
    reminderSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    proposedDate: {
      type: Date,
      default: null,
    },
    proposedTime: {
      type: String,
      default: null,
    },
    rescheduleReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reschedule reason cannot exceed 500 characters'],
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Completion notes cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
FollowUpSchema.index({ assignedTo: 1, status: 1 });
FollowUpSchema.index({ userId: 1, status: 1 }); // For admin filtering
FollowUpSchema.index({ scheduledDate: 1, status: 1 });
FollowUpSchema.index({ type: 1, relatedId: 1 });

// Compound index for duplicate prevention
// Prevents same staff + same date + same time + pending status
FollowUpSchema.index(
  { assignedTo: 1, scheduledDate: 1, scheduledTime: 1, status: 1 },
  {
    name: 'duplicate_prevention_index',
    partialFilterExpression: { status: 'pending' } // Only enforce for pending follow-ups
  }
);

// Pre-save hook: Set completedAt when status changes to completed/failed
FollowUpSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if ((this.status === 'completed' || this.status === 'failed') && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

// Pre-update hook: Set completedAt when status changes via findOneAndUpdate
FollowUpSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  if (update.status === 'completed' || update.status === 'failed') {
    if (!update.completedAt) {
      update.completedAt = new Date();
    }
  }
  next();
});

// Export the Mongoose Model
export const FollowUp = model<IFollowUp, IFollowUpModel>('FollowUp', FollowUpSchema);
