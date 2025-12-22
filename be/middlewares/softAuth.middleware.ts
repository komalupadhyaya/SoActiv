import { asyncHandler } from "../lib/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { Staff } from "../models/staff.model.js";

interface DecodedToken extends JwtPayload {
    _id: string;
    gym?: string;
    role?: string;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

/**
 * Middleware that populates req.user if a valid token is present,
 * but allows the request to continue even if NO token is present.
 */
export const softAuthMiddleware = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        let token = req.cookies?.accessToken;

        if (!token && req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token || !ACCESS_TOKEN_SECRET) {
            return next(); // Proceed without req.user
        }

        try {
            const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;
            if (!decoded._id) return next();

            const user = await User.findById(decoded._id).select("-password");
            if (!user) return next();

            // Convert to frontend-safe object
            const reqUser = user.toFrontendUser() as any;
            reqUser.gym = decoded.gym || user.gym?.toString();

            // Normalize Position (Same as authMiddleware)
            if (user.role === 'admin') {
                reqUser.position = 'admin';
            } else if (user.role === 'superadmin') {
                reqUser.position = 'superadmin';
            } else if (user.role === 'trainer') {
                reqUser.position = 'trainer';
            } else if (user.role === 'staff') {
                const staffRecord = await Staff.findOne({ userId: user._id });
                if (staffRecord) {
                    reqUser.position = staffRecord.position;
                    reqUser.staffId = staffRecord._id;
                    reqUser.adminId = staffRecord.createdBy;
                } else {
                    reqUser.position = 'unknown';
                }
            } else {
                reqUser.position = 'member';
            }

            (req as any).user = reqUser;
            (req as any).gym = reqUser.gym;

            next();
        } catch (error) {
            // Ignore errors and proceed as unauthenticated
            next();
        }
    }
);
