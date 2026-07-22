import mongoose, { Schema, model, Document, Types } from 'mongoose';

export interface IPTPlan extends Document {
    name: string;
    description?: string;
    totalSessions: number;
    validityDays: number;
    price: number;
    adminId: Types.ObjectId;
    createdBy?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ptPlanSchema = new Schema<IPTPlan>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        totalSessions: { type: Number, required: true, min: 1, max: 500 },
        validityDays: { type: Number, required: true, min: 1, max: 365 }, // e.g. 30 days
        price: { type: Number, required: true, min: 1, max: 100000 },
        adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin or Manager
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

// Indexes
ptPlanSchema.index({ adminId: 1, isActive: 1 });

export const PTPlan = model<IPTPlan>('PTPlan', ptPlanSchema);
