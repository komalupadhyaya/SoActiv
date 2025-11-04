import ApiError from "../lib/ApiError.js";
import { asyncHandler } from "../lib/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { HttpStatusCode } from "../lib/const.js";
import type { NextFunction, Request, Response } from "express";

// ✅ Step 1: Define what we expect in the JWT payload
interface DecodedToken extends JwtPayload {
  _id: string;
}

// ✅ Step 2: Ensure secret is defined at startup (eliminates `undefined`)
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
if (!ACCESS_TOKEN_SECRET) {
  throw new Error("FATAL ERROR: ACCESS_TOKEN_SECRET is not set in .env");
}

export const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Access token is missing");
    }

    try {
      // ✅ Step 3: Verify token — cast only after verifying
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;

      // ✅ Step 4: Validate that `_id` exists
      if (!decoded._id) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid token: missing user ID");
      }

      // ✅ Step 5: Find user
      const user = await User.findById(decoded._id).select("-password");
      if (!user) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "User not found");
      }

      // ✅ Step 6: Attach to request
      (req as any).user = user;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Access token has expired");
      }
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid or malformed access token");
    }
  }
);