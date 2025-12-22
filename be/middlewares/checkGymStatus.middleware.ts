import { type Request, type Response, type NextFunction } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { Gym } from "../models/gym.model.js";

/**
 * Middleware to check gym status and block suspended/expired/deleted gyms
 * 
 * Apply to ALL admin and staff routes
 * Super Admin bypasses this check
 */
export const checkGymStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        // Check if user is Super Admin - they bypass all checks
        const userRole = (req as any).user?.role || (req as any).superAdmin?.role;
        if (userRole === "superadmin") {
            return next();
        }

        // Get gym ID from user
        const gymId = (req as any).user?.gym;

        if (!gymId) {
            throw new ApiError(HttpStatusCode.FORBIDDEN, "No gym associated with this account");
        }

        // Fetch gym
        const gym = await Gym.findById(gymId);

        if (!gym) {
            throw new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found");
        }

        // Check if gym is deleted (soft delete)
        if (gym.deletedAt) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                "Your gym account has been deleted. Please contact support."
            );
        }

        // Check gym status
        switch (gym.status) {
            case "active":
            case "trial":
                // Allow access
                return next();

            case "suspended":
                throw new ApiError(
                    HttpStatusCode.FORBIDDEN,
                    "Your gym account is suspended. Please contact support to reactivate your account."
                );

            case "expired":
                // For expired, you can choose to block completely or allow read-only
                // Currently blocking completely - modify if you want read-only
                throw new ApiError(
                    HttpStatusCode.FORBIDDEN,
                    "Your gym subscription has expired. Please renew your subscription to continue using the platform."
                );

            default:
                throw new ApiError(
                    HttpStatusCode.FORBIDDEN,
                    "Your gym account status is invalid. Please contact support."
                );
        }
    }
);
