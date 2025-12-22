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

        if (!plan) {
            // Fallback to default limits if plan not found
            throw new ApiError(
                HttpStatusCode.INTERNAL_SERVER_ERROR,
                "Plan configuration not found. Please contact support."
            );
        }

        // Check current count based on resource type
        let currentCount = 0;
        let limit = 0;
        let resourceName = '';

        if (resource === 'members') {
            // Count members for this gym (by gym owner)
            currentCount = await Client.countDocuments({ userId: gym.owner });
            limit = plan.maxMembers;
            resourceName = 'members';
        } else if (resource === 'staff') {
            // Count staff for this gym
            currentCount = await Staff.countDocuments({ createdBy: gym.owner });
            limit = plan.maxStaff;
            resourceName = 'staff';
        }

        // Check if limit exceeded (Infinity means unlimited)
        if (limit !== Infinity && currentCount >= limit) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                `You have reached your plan limit of ${limit} ${resourceName}. Please upgrade your plan to add more.`
            );
        }

        // Attach current count and limit to request for potential use in controller
        (req as any).planLimit = {
            resource,
            current: currentCount,
            limit,
            remaining: limit === Infinity ? Infinity : limit - currentCount,
            planName: plan.displayName
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
