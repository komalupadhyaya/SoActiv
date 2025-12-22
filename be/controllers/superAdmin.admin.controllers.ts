import { type Request, type Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { User } from "../models/user.model.js";
import { Gym } from "../models/gym.model.js";
import { logSuperAdminAction, getSuperAdminContext } from "../utils/superAdminLogger.js";
import bcrypt from "bcryptjs";

/**
 * Create a new admin (gym owner)
 * POST /api/v1/super-admin/admins
 */
export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { fullname, email, password, phone, gymId } = req.body;

    // Validation
    if (!fullname || !email || !password || !gymId) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Name, email, password, and gym ID are required");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(HttpStatusCode.CONFLICT, "User with this email already exists");
    }

    // CRITICAL: Role is HARD-CODED to admin
    // Super Admin can ONLY create Gym Owners (admin role)
    // Staff creation is done by gym owners themselves
    const role = 'admin';

    // Verify gym exists
    const gym = await Gym.findById(gymId);
    if (!gym || gym.deletedAt) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    // Validate gym status - cannot create admin for suspended/expired/deleted gyms
    if (['suspended', 'expired', 'deleted'].includes(gym.status)) {
        throw new ApiError(
            HttpStatusCode.FORBIDDEN,
            `Cannot create admin for ${gym.status} gym. Please update gym status first.`
        );
    }

    // Validate plan requirement (except for trial gyms)
    // Trial gyms can have admins without plans for the trial period
    if (gym.status !== 'trial') {
        if (!gym.plan) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                "Gym must have an active plan before creating admin. Please assign a plan to this gym first."
            );
        }

        // Check if the assigned plan is active
        const { Plan } = await import('../models/plan.model.js');
        const plan = await Plan.findOne({ name: gym.plan, isActive: true, deletedAt: null });
        if (!plan) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                "Gym's plan is inactive or not found. Please assign an active plan."
            );
        }
    }

    // Create admin user
    const admin = await User.create({
        fullname,
        email,
        password,
        phone,
        role: "admin",
        gym: gymId,
        avatar: "default-avatar.png"
    });

    // Update gym owner if not set
    if (!gym.owner) {
        gym.owner = admin._id as any;
        await gym.save();
    }

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "create_admin",
        targetType: "admin",
        targetId: admin._id,
        performedBy: context.performedBy,
        metadata: {
            adminEmail: email,
            gymId,
            gymName: gym.name,
            gymStatus: gym.status,
            gymPlan: gym.plan || 'trial'
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Gym owner created successfully",
        data: {
            id: admin._id,
            name: admin.fullname,
            email: admin.email,
            phone: admin.phone,
            gym: gym.name
        }
    });
});

/**
 * Get all admins with pagination
 * GET /api/v1/super-admin/admins
 */
export const listAdmins = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, gymId, search } = req.query;

    const query: any = { role: "admin" };

    // Filters
    if (gymId) query.gym = gymId;
    if (search) {
        query.$or = [
            { fullname: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [admins, total] = await Promise.all([
        User.find(query)
            .select("-password")
            .populate("gym", "name status plan")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(query)
    ]);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            admins,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        }
    });
});

/**
 * Update admin details
 * PATCH /api/v1/super-admin/admins/:id
 */
export const updateAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { fullname, phone, email } = req.body;

    const admin = await User.findById(id);
    if (!admin || admin.role !== "admin") {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin not found");
    }

    const oldValues = { fullname: admin.fullname, phone: admin.phone, email: admin.email };

    // Update fields
    if (fullname) admin.fullname = fullname;
    if (phone !== undefined) admin.phone = phone;
    if (email) {
        // Check if new email already exists
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
            throw new ApiError(HttpStatusCode.CONFLICT, "Email already in use");
        }
        admin.email = email;
    }

    await admin.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "update_admin",
        targetType: "admin",
        targetId: admin._id,
        performedBy: context.performedBy,
        metadata: { oldValues, newValues: { fullname, phone, email } },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Admin updated successfully",
        data: {
            id: admin._id,
            name: admin.fullname,
            email: admin.email,
            phone: admin.phone
        }
    });
});

/**
 * Reset admin password
 * POST /api/v1/super-admin/admins/:id/reset-password
 */
export const resetAdminPassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Password must be at least 6 characters");
    }

    const admin = await User.findById(id);
    if (!admin || admin.role !== "admin") {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin not found");
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "reset_password",
        targetType: "admin",
        targetId: admin._id,
        performedBy: context.performedBy,
        metadata: { adminEmail: admin.email },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Password reset successfully"
    });
});

/**
 * Force logout admin (invalidate sessions)
 * POST /api/v1/super-admin/admins/:id/force-logout
 */
export const forceLogoutAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const admin = await User.findById(id);
    if (!admin || admin.role !== "admin") {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Admin not found");
    }

    // Note: IN A PRODUCTION SYSTEM, WE INVALIDATE TOKENS BY VERSIONING.
    // 1. Increment tokenVersion
    if (typeof admin.tokenVersion === 'number') {
        admin.tokenVersion += 1;
    } else {
        admin.tokenVersion = 1;
    }
    // Clear active status
    admin.lastActiveAt = undefined;

    await admin.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "force_logout",
        targetType: "admin",
        targetId: admin._id,
        performedBy: context.performedBy,
        metadata: { adminEmail: admin.email, newTokenVersion: admin.tokenVersion },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Admin has been forcefully logged out. All active sessions invalidated."
    });
});
