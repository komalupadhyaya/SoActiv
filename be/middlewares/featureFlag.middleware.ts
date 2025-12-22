import { type Request, type Response, type NextFunction } from "express";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { Gym } from "../models/gym.model.js";

/**
 * Middleware to check if a gym has a specific feature enabled
 * Usage: checkGymFeature("payments")
 */
export const checkGymFeature = (featureName: keyof typeof featureMap) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;

            if (!user) {
                return next(new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated"));
            }

            // Super Admins bypass feature checks
            if (user.role === "superadmin") {
                return next();
            }

            // Get gym ID from user
            const gymId = user.gym;
            if (!gymId) {
                return next(new ApiError(HttpStatusCode.BAD_REQUEST, "Gym ID not found for user"));
            }

            // Fetch gym from database
            const gym = await Gym.findById(gymId);
            if (!gym) {
                return next(new ApiError(HttpStatusCode.NOT_FOUND, "Gym not found"));
            }

            // Check if gym is suspended or expired
            if (gym.status === "suspended") {
                return next(
                    new ApiError(
                        HttpStatusCode.FORBIDDEN,
                        "Your gym account is suspended. Please contact support."
                    )
                );
            }

            if (gym.status === "expired") {
                return next(
                    new ApiError(
                        HttpStatusCode.FORBIDDEN,
                        "Your gym subscription has expired. Please renew to continue."
                    )
                );
            }

            // Check if feature is enabled
            const featureKey = featureMap[featureName];
            if (!gym.features[featureKey]) {
                return next(
                    new ApiError(
                        HttpStatusCode.FORBIDDEN,
                        `The "${featureName}" feature is not enabled for your gym. Please upgrade your plan.`
                    )
                );
            }

            // Feature is enabled, proceed
            next();
        } catch (error: any) {
            next(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, error.message || "Feature check failed"));
        }
    };
};

// Feature name mapping (for flexibility)
const featureMap = {
    payments: "payments" as const,
    attendance: "attendance" as const,
    pt: "pt" as const,
    classes: "classes" as const,
    memberPortal: "memberPortal" as const
};
