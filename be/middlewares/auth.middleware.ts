import ApiError from "../lib/ApiError.js";
import { asyncHandler } from "../lib/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { HttpStatusCode } from "../lib/const.js";
import type { NextFunction, Request, Response } from "express";
import { Gym } from "../models/gym.model.js";

// ... existing imports
import { Staff } from "../models/staff.model.js";

interface DecodedToken extends JwtPayload {
  _id: string;
  gym?: string;
  role?: string;
  tokenVersion?: number;
}

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw new Error("FATAL ERROR: ACCESS_TOKEN_SECRET is not set in .env");
}

export const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.accessToken;

    // Fallback: Check super_admin_token for platform-wide/shared operations
    if (!token && req.cookies?.super_admin_token) {
      token = req.cookies.super_admin_token;
    }

    // Fallback to Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Access token is missing");
    }

    try {
      // Verify JWT
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;

      if (!decoded._id) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid token: missing user ID");
      }

      const user = await User.findById(decoded._id).select("-password");
      if (!user) {
        console.warn(`⚠️ Auth: User not found in DB for token ID: ${decoded._id}`);
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "User not found");
      }

      // Verify token version (for force logout session invalidation)
      if (decoded.tokenVersion !== undefined && user.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Session has been invalidated. Please login again.");
      }

      // Track Online Status (Update at most once per minute)
      const now = new Date();
      const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      if (!lastActive || lastActive < oneMinuteAgo) {
        user.lastActiveAt = now;
        await user.save();
      }

      // ===== BROWSER-SCOPED AUTH =====
      // No global session validation needed
      // Each browser manages its own session via localStorage
      // Token validation is sufficient for browser-scoped auth
      // ===== END BROWSER-SCOPED AUTH =====

      // Convert to frontend-safe object (maps fullname -> name, _id -> id)
      const reqUser = user.toFrontendUser() as any;
      reqUser.gym = decoded.gym || user.gym?.toString(); // Ensure gym string is set

      if (user.role !== 'superadmin' && user.gym) {
        const gym = await Gym.findById(user.gym).select('features');
        if (gym) {
          reqUser.gymFeatures = gym.features;
        }
      }

      // --- Normalize Position ---
      if (user.role === 'admin') {
        reqUser.position = 'admin';
      } else if (user.role === 'superadmin') {
        reqUser.position = 'superadmin';
      } else if (user.role === 'trainer') {
        reqUser.position = 'trainer';
        // Check if there is a linked staff record to sync any updates (optional/future)
      } else if (user.role === 'staff') {
        // Fetch specific staff position from Staff collection
        const staffRecord = await Staff.findOne({ userId: user._id });
        if (staffRecord) {
          reqUser.position = staffRecord.position;
          reqUser.staffId = staffRecord._id; // Useful for efficient queries
          reqUser.adminId = staffRecord.createdBy; // Important: Staff are scoped by their creator (Admin)
        } else {
          // Fallback if staff record missing (should not happen for valid staff)
          reqUser.position = 'unknown';
        }
      } else {
        reqUser.position = 'member';
      }

      (req as any).user = reqUser; // Re-assign with position
      (req as any).gym = reqUser.gym;

      next();
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error.name === "TokenExpiredError") {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Access token has expired");
      }
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid or malformed access token");
    }
  }
);
