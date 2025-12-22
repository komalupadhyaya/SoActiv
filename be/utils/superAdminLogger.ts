import { SuperAdminLog, type SuperAdminAction, type TargetType } from "../models/superAdminLog.model.js";
import type { Types } from "mongoose";

/**
 * Utility function to log Super Admin actions
 */
export const logSuperAdminAction = async (params: {
    action: SuperAdminAction;
    targetType: TargetType;
    targetId?: any; // Changed to any for flexibility
    performedBy: any; // Changed to any for flexibility
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}) => {
    try {
        await SuperAdminLog.create({
            action: params.action,
            targetType: params.targetType,
            targetId: params.targetId,
            performedBy: params.performedBy,
            metadata: params.metadata || {},
            ipAddress: params.ipAddress || "unknown",
            userAgent: params.userAgent || "unknown",
            timestamp: new Date()
        });
    } catch (error) {
        console.error("Failed to log Super Admin action:", error);
        // Don't throw error - logging failure shouldn't break the request
    }
};

/**
 * Helper to extract Super Admin context from request
 */
export const getSuperAdminContext = (req: any) => {
    return {
        performedBy: req.superAdmin?.id || "unknown",
        ipAddress: req.superAdminContext?.ipAddress || "unknown",
        userAgent: req.superAdminContext?.userAgent || "unknown"
    };
};
