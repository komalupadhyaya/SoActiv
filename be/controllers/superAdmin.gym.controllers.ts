import { type Request, type Response } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { Gym } from "../models/gym.model.js";
import { User } from "../models/user.model.js";
import { Client } from "../models/client.model.js";
import { Staff } from "../models/staff.model.js";
import { Subscription } from "../models/subscription.model.js";
import { logSuperAdminAction, getSuperAdminContext } from "../utils/superAdminLogger.js";

/**
 * Create a new gym
 * POST /api/v1/super-admin/gyms
 */
export const createGym = asyncHandler(async (req: Request, res: Response) => {
    const { name, address, phone, ownerEmail, ownerName, ownerPassword, plan, status } = req.body;

    // Validation
    if (!name || !ownerEmail || !ownerName || !ownerPassword) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Name, owner email, owner name, and password are required");
    }

    // Check if owner email already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
        throw new ApiError(HttpStatusCode.CONFLICT, "User with this email already exists");
    }

    // 1. Pre-generate IDs to resolve circular dependency
    const gymId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId();

    try {
        // 2. Create gym owner (admin) user with pre-generated gymId
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);
        const gymOwner = await User.create({
            _id: ownerId,
            fullname: ownerName,
            email: ownerEmail,
            password: hashedPassword,
            role: "admin",
            avatar: "default-avatar.png",
            gym: gymId
        });

        // 3. Create gym with pre-generated gymId and ownerId
        const gym = await Gym.create({
            _id: gymId,
            name,
            address,
            phone,
            owner: ownerId,
            plan: plan || "pro",
            status: status || "trial",
            trialEndsAt: status === "trial" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined,
            features: {
                payments: true,
                attendance: true,
                pt: true,
                classes: true,
                memberPortal: true
            }
        });

        // 4. Create subscription
        // Calculate nextBillingDate if active
        // Default to monthly for new gyms
        const subscriptionStatus = status === "trial" ? "trialing" : "active";
        let nextBillingDate: Date | undefined;

        if (subscriptionStatus === "active") {
            const billingCycle = "monthly"; // Default
            const daysToAdd = billingCycle === "monthly" ? 30 : 365;
            nextBillingDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);
        }

        await Subscription.create({
            gymId: gym._id,
            plan: gym.plan,
            status: subscriptionStatus,
            billingCycle: "monthly",
            amount: 0,
            currency: "INR",
            nextBillingDate
        });

        // Log action
        const context = getSuperAdminContext(req);
        await logSuperAdminAction({
            action: "create_gym",
            targetType: "gym",
            targetId: gym._id,
            performedBy: context.performedBy,
            metadata: { gymName: name, ownerEmail, plan: gym.plan },
            ipAddress: context.ipAddress,
            userAgent: context.userAgent
        });

        res.status(HttpStatusCode.CREATED).json({
            success: true,
            message: "Gym created successfully",
            data: {
                gym,
                owner: {
                    id: gymOwner._id,
                    name: gymOwner.fullname,
                    email: gymOwner.email
                }
            }
        });
    } catch (error) {
        // Rollback: Delete any created documents if an error occurs
        // This ensures atomicity (User + Gym + Subscription or Nothing)
        await User.findByIdAndDelete(ownerId);
        await Gym.findByIdAndDelete(gymId);
        await Subscription.deleteOne({ gymId });
        throw error;
    }
});

/**
 * Get all gyms with pagination and filters
 * GET /api/v1/super-admin/gyms
 */
export const listGyms = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, status, plan, search } = req.query;

    const query: any = { deletedAt: null };

    // Filters
    if (status) query.status = status;
    if (plan) query.plan = plan;
    if (search) {
        query.name = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [gyms, total] = await Promise.all([
        Gym.find(query)
            .populate("owner", "fullname email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Gym.countDocuments(query)
    ]);

    // Get member counts for each gym
    const gymsWithStats = await Promise.all(
        gyms.map(async (gym) => {
            const memberCount = await Client.countDocuments({ userId: gym.owner });
            const staffCount = await Staff.countDocuments({ createdBy: gym.owner });

            return {
                ...gym.toObject(),
                stats: {
                    members: memberCount,
                    staff: staffCount
                }
            };
        })
    );

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            gyms: gymsWithStats,
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
 * Get gym details
 * GET /api/v1/super-admin/gyms/:id
 */
export const getGymDetails = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const gym = await Gym.findById(id).populate("owner", "fullname email phone");
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    // Get stats
    const [memberCount, staffCount, activeMembers, subscription] = await Promise.all([
        Client.countDocuments({ userId: gym.owner }),
        Staff.countDocuments({ createdBy: gym.owner }),
        Client.countDocuments({ userId: gym.owner, status: "active" }),
        Subscription.findOne({ gymId: gym._id })
    ]);

    res.status(HttpStatusCode.OK).json({
        success: true,
        data: {
            gym,
            subscription,
            stats: {
                totalMembers: memberCount,
                activeMembers,
                staff: staffCount
            }
        }
    });
});

/**
 * Update gym details
 * PATCH /api/v1/super-admin/gyms/:id
 */
export const updateGym = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, address, phone, plan } = req.body;

    const gym = await Gym.findById(id);
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    const oldValues = { name: gym.name, address: gym.address, phone: gym.phone, plan: gym.plan };

    // Update fields
    if (name) gym.name = name;
    if (address !== undefined) gym.address = address;
    if (phone !== undefined) gym.phone = phone;
    if (plan) gym.plan = plan;

    await gym.save();

    // Update subscription if plan changed
    if (plan && plan !== oldValues.plan) {
        await Subscription.findOneAndUpdate(
            { gymId: gym._id },
            { plan }
        );
    }

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "update_gym",
        targetType: "gym",
        targetId: gym._id,
        performedBy: context.performedBy,
        metadata: { oldValues, newValues: { name, address, phone, plan } },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Gym updated successfully",
        data: gym
    });
});

/**
 * Update gym status (suspend/activate)
 * PATCH /api/v1/super-admin/gyms/:id/status
 */
export const updateGymStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["trial", "active", "suspended", "expired"].includes(status)) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid status");
    }

    const gym = await Gym.findById(id);
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    const oldStatus = gym.status;
    gym.status = status;
    await gym.save();

    // Log action
    const context = getSuperAdminContext(req);
    const action = status === "suspended" ? "suspend_gym" : "activate_gym";
    await logSuperAdminAction({
        action,
        targetType: "gym",
        targetId: gym._id,
        performedBy: context.performedBy,
        metadata: { oldStatus, newStatus: status },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: `Gym ${status === "suspended" ? "suspended" : "activated"} successfully`,
        data: gym
    });
});

/**
 * Toggle gym feature
 * PATCH /api/v1/super-admin/gyms/:id/features/:featureName
 */
export const toggleFeature = asyncHandler(async (req: Request, res: Response) => {
    const { id, featureName } = req.params;
    const { enabled } = req.body;

    const validFeatures = ["payments", "attendance", "pt", "classes", "memberPortal"];
    if (!featureName || !validFeatures.includes(featureName)) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid feature name");
    }

    const gym = await Gym.findById(id);
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    const oldValue = gym.features[featureName as keyof typeof gym.features];
    gym.features[featureName as keyof typeof gym.features] = enabled;
    await gym.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "toggle_feature",
        targetType: "gym",
        targetId: gym._id,
        performedBy: context.performedBy,
        metadata: { feature: featureName, oldValue, newValue: enabled },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: `Feature ${featureName} ${enabled ? "enabled" : "disabled"} successfully`,
        data: gym
    });
});

/**
 * Soft delete gym
 * DELETE /api/v1/super-admin/gyms/:id
 */
export const deleteGym = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const gym = await Gym.findById(id);
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    gym.deletedAt = new Date();
    await gym.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "delete_gym",
        targetType: "gym",
        targetId: gym._id,
        performedBy: context.performedBy,
        metadata: { gymName: gym.name },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Gym deleted successfully"
    });
});

/**
 * Extend trial period
 * PATCH /api/v1/super-admin/gyms/:id/extend-trial
 */
export const extendTrial = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { days } = req.body;

    if (!days || days < 1) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid number of days");
    }

    const gym = await Gym.findById(id);
    if (!gym) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
    }

    const oldTrialEnd = gym.trialEndsAt;
    const currentEnd = gym.trialEndsAt || new Date();
    gym.trialEndsAt = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
    gym.status = "trial";
    await gym.save();

    // Log action
    const context = getSuperAdminContext(req);
    await logSuperAdminAction({
        action: "extend_trial",
        targetType: "gym",
        targetId: gym._id,
        performedBy: context.performedBy,
        metadata: { oldTrialEnd, newTrialEnd: gym.trialEndsAt, daysAdded: days },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: `Trial extended by ${days} days`,
        data: gym
    });
});
