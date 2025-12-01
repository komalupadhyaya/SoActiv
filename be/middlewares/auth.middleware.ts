import ApiError from "../lib/ApiError.js";
import { asyncHandler } from "../lib/AsyncHandler.js";
import { User } from "../models/user.model.js";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { HttpStatusCode } from "../lib/const.js";
import type { NextFunction, Request, Response } from "express";

interface DecodedToken extends JwtPayload {
  _id: string;
  gym?: string;
  role?: string;
}

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
      // Verify JWT
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;

      if (!decoded._id) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid token: missing user ID");
      }

      const user = await User.findById(decoded._id).select("-password");
      if (!user) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "User not found");
      }

      // ✅ Attach user and gym info to request
      (req as any).user = user;
      (req as any).gym = decoded.gym || user.gym?.toString();

      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Access token has expired");
      }
      throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid or malformed access token");
    }
  }
);
