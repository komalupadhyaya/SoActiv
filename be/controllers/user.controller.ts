import type { Request, Response } from "express";
import { Document, Types } from "mongoose";
import apiError from "../lib/ApiError.ts";
import ApiResponse from "../lib/ApiResponse.ts";
import { asyncHandler } from "../lib/AsyncHandler.ts";
import { HttpStatusCode } from "../lib/const.ts";
import { User } from "../models/user.model.js";
import admin from "../firebase/admin";
 
// Extend User document with methods
interface IUser extends Document {
  fullname: string;
  email: string;
  phone?: string;
  avatar: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
 
  isPasswordCorrect(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  toFrontendUser(): {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    createdAt: string;
  };
}
 
/**
 * Generate access token for user
 */
const generateAccessToken = async (userId: string | Types.ObjectId): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(HttpStatusCode.NOT_FOUND, "User not found");
  }
  return user.generateAccessToken();
};
 
/**
 * Register a new user
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  console.log("✅ 1. Register route hit");
  console.log("📨 2. Request body:", req.body);
 
  const { fullname, email, password } = req.body;
 
  console.log("✅ 3. Fields received:", { fullname, email });
 
  // Validate
  if ([fullname, email, password].some(field => !field || field.trim() === "")) {
    console.log("❌ 4. Validation failed");
    return res.status(400).json({ error: "Missing required fields" });
  }
 
  try {
    console.log("✅ 5. Checking if user exists...");
 
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      console.log("❌ 6. User already exists:", email);
      return res.status(409).json({ error: "Email already in use" });
    }
 
    console.log("✅ 7. Creating new user...");
 
    const user = await User.create({
      fullname,
      email,
      phone: req.body.phone,
      password,
      avatar: fullname.charAt(0).toUpperCase(),
      role: "admin",
    });
 
    console.log("✅ 8. User created with ID:", user._id);
 
    const safeUser = await User.findById(user._id).select("-password");
    console.log("✅ 9. Safe user found");
 
    return res.status(201).json({
      data: safeUser?.toFrontendUser(),
      message: "User registered successfully",
    });
 
  } catch (err: any) {
    console.log("💥 10. CRASH in registerUser:", err); // 🔥 THIS IS KEY
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});
 
/**
 * Login user with email and password
 */
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
 
  if (!email) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "Email is required");
  }
  if (!password) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "Password is required");
  }
 
  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials");
  }
 
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials");
  }
 
  const token = user.generateAccessToken();
  const safeUser = await User.findById(user._id).select("-password");
 
  return res
    .status(HttpStatusCode.OK)
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
     sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
     
    })
    .json(new ApiResponse(HttpStatusCode.OK, safeUser?.toFrontendUser(), "User logged in successfully"));
});
 
/**
 * Google Sign-In using Firebase ID token
 */
const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = req.body;
 
  if (!idToken) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "ID token is required");
  }
 
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;
 
    if (!email || !name) {
      throw new apiError(HttpStatusCode.UNAUTHORIZED, "Missing required user info from Google");
    }
 
    let user = await User.findOne({ email });
 
    if (!user) {
      user = await User.create({
        fullname: name,
        email,
        avatar: picture || name.charAt(0).toUpperCase(),
        role: "user",
      });
    }
 
    const token = user.generateAccessToken();
    const safeUser = user.toFrontendUser();
 
    return res
      .status(HttpStatusCode.OK)
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json(new ApiResponse(HttpStatusCode.OK, safeUser, "Google Sign-In successful"));
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "Google authentication failed");
  }
});
 
/**
 * Logout user (clear cookie)
 */
const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(HttpStatusCode.OK)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .json(new ApiResponse(HttpStatusCode.OK, {}, "User logged out successfully"));
});
 
/**
 * Get current logged-in user (from middleware, req.user)
 */
const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user; // Assuming `req.user` is set by auth middleware
  if (!user) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "No user is logged in");
  }
 
  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, user, "Current user fetched successfully"));
});
 
export { registerUser, loginUser, logoutUser, getCurrentUser, googleSignIn };