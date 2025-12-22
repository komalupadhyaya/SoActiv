import ApiError from "../lib/ApiError.js";
import { asyncHandler } from "../lib/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { HttpStatusCode } from "../lib/const.js";
import type { NextFunction, Request, Response } from "express";

interface DecodedToken extends JwtPayload {
    _id: string;
    role?: string;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET) {
    throw new Error("FATAL ERROR: ACCESS_TOKEN_SECRET is not set in .env");
}

/**
 * Middleware to protect Super Admin routes
 * Ensures only users with role="superadmin" can access
 */
export const requireSuperAdminAuth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let token = req.cookies?.super_admin_token;

        // Fallback to Authorization header
        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Super Admin access token is missing");
        }

        try {
            // Verify JWT
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;

            if (!decoded._id) {
                throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid token: missing user ID");
            }

            const user = await User.findById(decoded._id).select("-password");
            if (!user) {
                throw new ApiError(HttpStatusCode.UNAUTHORIZED, "User not found");
            }

            // CRITICAL: Check if user is Super Admin
            if (user.role !== "superadmin") {
                throw new ApiError(
                    HttpStatusCode.FORBIDDEN,
                    "Access denied. Super Admin privileges required."
                );
            }

            // Attach Super Admin user to request
            const safeUser = {
                id: user._id.toString(),
                name: user.fullname,
                email: user.email,
                role: user.role
            };

            (req as any).superAdmin = safeUser;
            (req as any).user = safeUser; // CRITICAL: Standardize on req.user for compatibility

            // Capture IP address and User Agent for logging
            const ipAddress =
                (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                req.socket.remoteAddress ||
                'unknown';

            const userAgent = req.headers['user-agent'] || 'unknown';

            (req as any).superAdminContext = {
                ipAddress,
                userAgent
            };

            next();
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Access token has expired");
            }
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid or malformed access token");
        }
    }
);
