// models/followUp.model.ts

import mongoose, { Schema, model, Document, Types, Model } from 'mongoose';

/**
 * Follow-Up Type
 */
export type FollowUpType = 'enquiry' | 'client' | 'pt';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

/**
 * Interface for the FollowUp document
 */
export interface IFollowUp extends Document {
  userId: Types.ObjectId; // Reference to User who created the follow-up
  assignedTo: Types.ObjectId; // Reference to Staff assigned to this follow-up
  type: FollowUpType; // Type of follow-up: enquiry, client, or PT
  relatedId: Types.ObjectId; // ID of the related enquiry, client, or PT package
  relatedName: string; // Name of the person/entity for quick reference
  scheduledDate: Date; // Date when follow-up is scheduled
  scheduledTime: string; // Time in HH:MM format
  note: string; // Follow-up notes (e.g., "Call back in 3 days")
  status: FollowUpStatus; // Status of the follow-up
  completedAt: Date | null; // When the follow-up was completed
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
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Assigned staff is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['enquiry', 'client', 'pt'],
        message: 'Type must be one of: enquiry, client, pt',
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
        values: ['pending', 'completed', 'cancelled'],
        message: 'Status must be one of: pending, completed, cancelled',
      },
      default: 'pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
FollowUpSchema.index({ assignedTo: 1, status: 1 });
FollowUpSchema.index({ scheduledDate: 1 });
FollowUpSchema.index({ type: 1, relatedId: 1 });
FollowUpSchema.index({ status: 1, scheduledDate: 1 });

// Pre-save hook: Set completedAt when status changes to completed
FollowUpSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Export the Mongoose Model
export const FollowUp = model<IFollowUp, IFollowUpModel>('FollowUp', FollowUpSchema);

