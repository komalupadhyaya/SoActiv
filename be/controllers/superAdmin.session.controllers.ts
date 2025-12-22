import { type Request, type Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { User } from "../models/user.model.js";
import { logSuperAdminAction, getSuperAdminContext } from "../utils/superAdminLogger.js";

/**
 * Get current Super Admin session info
 * GET /api/v1/super-admin/me
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const superAdminId = (req as any).superAdmin?.id || (req as any).user?.id;

    if (!superAdminId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Super Admin session not found");
    }

    // Fetch Super Admin user
    const superAdmin = await User.findById(superAdminId).select("-password");

    if (!superAdmin || superAdmin.role !== "superadmin") {
        throw new ApiError(HttpStatusCode.FORBIDDEN, "Invalid Super Admin session");
    }

    // Get context for IP
    const context = getSuperAdminContext(req);

    // Log session view
    await logSuperAdminAction({
        action: "login", // Using login as closest match to view_self_session
        targetType: "system",
        performedBy: superAdmin._id,
        metadata: { action: "view_self_session" },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    // Return minimal safe data
    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            id: superAdmin._id,
            name: superAdmin.fullname,
            email: superAdmin.email,
            phone: superAdmin.phone || "",
            role: superAdmin.role,
            avatar: superAdmin.avatar,
            avatarSettings: superAdmin.avatarSettings,
            lastLoginAt: superAdmin.updatedAt,
            ip: context.ipAddress
        }
    });
});
