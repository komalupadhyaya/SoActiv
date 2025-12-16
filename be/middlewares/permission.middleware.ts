
import { type Request, type Response, type NextFunction } from "express";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";

/**
 * Middleware to restrict access based on staff position
 * Assumes authMiddleware has successfully run and populated req.user.position
 */
export const requirePosition = (allowedPositions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return next(new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated"));
        }

        // Admins and Superadmins bypass position checks unless explicitly excluded (can be handled differently if needed)
        if (user.role === 'admin' || user.role === 'superadmin') {
            return next();
        }

        // Check if user's position is in allowed list
        if (allowedPositions.includes(user.position)) {
            return next();
        }

        return next(
            new ApiError(
                HttpStatusCode.FORBIDDEN,
                `Access denied. Required position: ${allowedPositions.join(", ")}. Your position: ${user.position}`
            )
        );
    };
};

/**
 * Middleware to enforce ADMIN only (shorthand)
 */
export const requireAdmin = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
            return next();
        }
        return next(new ApiError(HttpStatusCode.FORBIDDEN, "Admin access required"));
    };
};

/**
 * Middleware to enforce ADMIN or MANAGER access
 * Used for schedule creation, editing, deletion
 */
export const requireAdminOrManager = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return next(new ApiError(HttpStatusCode.UNAUTHORIZED, "User not authenticated"));
        }

        // Allow if Admin or Superadmin
        if (user.role === 'admin' || user.role === 'superadmin') {
            return next();
        }

        // Allow if Staff with Manager position
        if (user.role === 'staff' && user.position === 'manager') {
            return next();
        }

        return next(
            new ApiError(
                HttpStatusCode.FORBIDDEN,
                "Access denied. Only Admin or Manager can perform this action."
            )
        );
    };
};
