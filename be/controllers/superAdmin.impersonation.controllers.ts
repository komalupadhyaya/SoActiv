import { type Request, type Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { User } from "../models/user.model.js";
import { Gym } from "../models/gym.model.js";
import jwt from "jsonwebtoken";
import { logSuperAdminAction, getSuperAdminContext } from "../utils/superAdminLogger.js";

/**
 * Impersonate an admin for support/debugging (READ-ONLY)
 * POST /api/v1/super-admin/impersonate/:adminId
 */
export const impersonateAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { adminId } = req.params;
    const context = getSuperAdminContext(req);

    // Find the admin to impersonate
    const admin = await User.findById(adminId).populate("gym");

    if (!admin || admin.role !== "admin") {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin not found");
    }

    // Get gym details
    const gym = await Gym.findById(admin.gym);
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found for this admin");
    }

    // Generate temporary impersonation token (15 minutes)
    const impersonationToken = jwt.sign(
        {
            _id: admin._id,
            role: admin.role,
            gym: admin.gym,
            impersonatedBy: context.performedBy,
            isImpersonation: true,
            readOnly: true
        },
        process.env.ACCESS_TOKEN_SECRET!,
        { expiresIn: "15m" }
    );

    // Log impersonation
    await logSuperAdminAction({
        action: "login", // Using closest match
        targetType: "admin",
        targetId: admin._id,
        performedBy: context.performedBy,
        metadata: {
            action: "impersonate_admin",
            adminEmail: admin.email,
            gymName: gym.name,
            gymId: gym._id
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Impersonation mode activated (READ-ONLY, 15 minutes)",
        data: {
            token: impersonationToken,
            admin: {
                id: admin._id,
                name: admin.fullname,
                email: admin.email
            },
            gym: {
                id: gym._id,
                name: gym.name,
                status: gym.status,
                plan: gym.plan
            },
            expiresIn: "15m",
            readOnly: true,
            banner: `You are impersonating ${gym.name}`
        }
    });
});

/**
 * Middleware to block write operations during impersonation
 */
export const blockImpersonationWrites = asyncHandler(
    async (req: Request, res: Response, next) => {
        const user = (req as any).user;

        // Check if this is an impersonation session
        if (user?.isImpersonation && user?.readOnly) {
            // Block all non-GET requests
            if (req.method !== "GET") {
                throw new ApiError(
                    HttpStatusCode.FORBIDDEN,
                    "Write operations are not allowed in impersonation mode (READ-ONLY)"
                );
            }
        }

        next();
    }
);
