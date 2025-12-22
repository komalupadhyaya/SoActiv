import { Model, Schema, model, Document } from "mongoose";

export interface IPlanFeatures {
    payments: boolean;
    attendance: boolean;
    pt: boolean;
    classes: boolean;
    memberPortal: boolean;
}

export interface IPlan {
    _id: string;
    name: string;
    displayName: string;
    price: number;
    currency: string;
    billingCycle: "monthly" | "yearly";
    maxMembers: number;
    maxStaff: number;
    features: IPlanFeatures;
    isActive: boolean;
    description?: string;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

interface IPlanDocument extends Omit<IPlan, '_id'>, Document { }

const planSchema = new Schema<IPlanDocument>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        displayName: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: "INR",
            uppercase: true
        },
        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly"
        },
        maxMembers: {
            type: Number,
            required: true,
            min: 0
        },
        maxStaff: {
            type: Number,
            required: true,
            min: 0
        },
        features: {
            payments: { type: Boolean, default: true },
            attendance: { type: Boolean, default: true },
            pt: { type: Boolean, default: true },
            classes: { type: Boolean, default: true },
            memberPortal: { type: Boolean, default: true }
        },
        isActive: {
            type: Boolean,
            default: true
        },
        description: {
            type: String,
            trim: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
planSchema.index({ isActive: 1 });
planSchema.index({ deletedAt: 1 });

export const Plan = model<IPlanDocument>("Plan", planSchema);
