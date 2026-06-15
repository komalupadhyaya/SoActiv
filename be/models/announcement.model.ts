import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    message: string;
    targetAudience: 'staff' | 'members' | 'admin' | 'all';
    visibleRoles: string[]; // e.g. ['trainer', 'manager'] - empty means all in targetAudience
    priority: 'normal' | 'urgent';
    createdBy: Types.ObjectId;
    adminId: Types.ObjectId;
    expiresAt: Date;
    isActive: boolean;
    isPlatformWide?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
    {
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true },
        targetAudience: {
            type: String,
            enum: ['staff', 'members', 'admin', 'all'],
            required: true,
            default: 'all'
        },
        visibleRoles: [{ type: String, trim: true }], // Optional filter
        priority: {
            type: String,
            enum: ['normal', 'urgent'],
            default: 'normal'
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        expiresAt: { type: Date, required: true, index: true }, // TTL index could suffice but manual filter is better for "show past"
        isActive: { type: Boolean, default: true },
        isPlatformWide: { type: Boolean, default: false }
    },
    { timestamps: true }
);

// Index for efficient filtering
announcementSchema.index({ adminId: 1, targetAudience: 1, isActive: 1 });
// Useful for cleanup or exclusion

export const Announcement = model<IAnnouncement>('Announcement', announcementSchema);
