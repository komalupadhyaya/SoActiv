import { type Request, type Response, type NextFunction } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { Gym } from "../models/gym.model.js";
import { Plan } from "../models/plan.model.js";
import { Client } from "../models/client.model.js";
import { Staff } from "../models/staff.model.js";

/**
 * Middleware factory to check plan limits for a specific resource
 * 
 * Usage: checkPlanLimit('members') or checkPlanLimit('staff')
 */
export const checkPlanLimit = (resource: 'members' | 'staff') => {
    return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        // Super Admin bypasses all limits
        const userRole = (req as any).user?.role || (req as any).superAdmin?.role;
        if (userRole === "superadmin") {
            return next();
        }

        // Get gym ID
        const gymId = (req as any).user?.gym;

        if (!gymId) {
            throw new ApiError(HttpStatusCode.FORBIDDEN, "No gym associated with this account");
        }

        // Fetch gym to get plan
        const gym = await Gym.findById(gymId);

        if (!gym) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
        }

        // Fetch plan from database
        const planName = gym.plan || 'free';
        const plan = await Plan.findOne({ name: planName, isActive: true, deletedAt: null });

        // Check current count based on resource type
        let currentCount = 0;
        let limit = 0; // 0 means Unlimited in our system
        let resourceName = '';
        let displayName = '';

        if (resource === 'members') {
            // Count members for this gym (by gym owner)
            currentCount = await Client.countDocuments({ userId: gym.owner });
            limit = plan ? plan.maxMembers : 100; // safe default fallback if plan not in DB
            resourceName = 'members';
            displayName = plan ? plan.displayName : `${planName.toUpperCase()} Plan`;
        } else if (resource === 'staff') {
            // Count staff for this gym
            currentCount = await Staff.countDocuments({ createdBy: gym.owner });
            limit = plan ? plan.maxStaff : 10; // safe default fallback if plan not in DB
            resourceName = 'staff';
            displayName = plan ? plan.displayName : `${planName.toUpperCase()} Plan`;
        }

        // Check if limit exceeded (0 or Infinity means unlimited)
        if (limit !== 0 && limit !== Infinity && currentCount >= limit) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                `You have reached your plan limit of ${limit} ${resourceName}. Please upgrade your plan to add more.`
            );
        }

        // Attach current count and limit to request for potential use in controller
        (req as any).planLimit = {
            resource,
            current: currentCount,
            limit: limit === 0 ? Infinity : limit,
            remaining: limit === 0 ? Infinity : limit - currentCount,
            planName: displayName
        };

        next();
    });
};

/**
 * Get plan limits for a gym (utility function)
 */
export const getPlanLimits = async (planName: string) => {
    const plan = await Plan.findOne({ name: planName, isActive: true, deletedAt: null });

    if (!plan) {
        return null;
    }

    return {
        maxMembers: plan.maxMembers,
        maxStaff: plan.maxStaff,
        features: plan.features
    };
};
