import { Schema, model, Document, Types } from "mongoose";

// Action Types for Super Admin
export type SuperAdminAction =
    | "create_gym"
    | "update_gym"
    | "suspend_gym"
    | "activate_gym"
    | "delete_gym"
    | "extend_trial"
    | "change_plan"
    | "toggle_feature"
    | "create_admin"
    | "update_admin"
    | "reset_password"
    | "force_logout"
    | "login"
    | "logout";

// Target Types
export type TargetType = "gym" | "admin" | "plan" | "system";

export interface ISuperAdminLog extends Document {
    action: SuperAdminAction;
    targetType: TargetType;
    targetId?: Types.ObjectId;
    performedBy: Types.ObjectId; // Super Admin user ID
    metadata?: Record<string, any>; // Additional context (old values, new values, etc.)
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}

const superAdminLogSchema = new Schema<ISuperAdminLog>(
    {
        action: {
            type: String,
            enum: [
                "create_gym",
                "update_gym",
                "suspend_gym",
                "activate_gym",
                "delete_gym",
                "extend_trial",
                "change_plan",
                "toggle_feature",
                "create_admin",
                "update_admin",
                "reset_password",
                "force_logout",
                "login",
                "logout"
            ],
            required: true,
            index: true
        },
        targetType: {
            type: String,
            enum: ["gym", "admin", "plan", "system"],
            required: true,
            index: true
        },
        targetId: {
            type: Schema.Types.ObjectId,
            refPath: "targetType" // Dynamic reference based on targetType
        },
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },
        ipAddress: {
            type: String,
            trim: true
        },
        userAgent: {
            type: String,
            trim: true
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
            index: true
        }
    },
    { timestamps: true }
);

// Compound indexes for efficient queries
superAdminLogSchema.index({ targetType: 1, targetId: 1 });
superAdminLogSchema.index({ performedBy: 1, timestamp: -1 });
superAdminLogSchema.index({ action: 1, timestamp: -1 });

// TTL index to auto-delete logs older than 2 years (optional)
// superAdminLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

export const SuperAdminLog = model<ISuperAdminLog>("SuperAdminLog", superAdminLogSchema);
