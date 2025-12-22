import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from "express";
import { Types } from "mongoose";
import apiError from "../lib/ApiError.ts";
import ApiResponse from "../lib/ApiResponse.ts";
import { asyncHandler } from "../lib/AsyncHandler.ts";
import { HttpStatusCode } from "../lib/const.ts";
import { User } from "../models/user.model.js";
import { Gym } from "../models/gym.model.js"; // 👈 NEW import
import admin from "../firebase/admin";

import { Subscription } from "../models/subscription.model.js"; // 👈 NEW import

/**
 * REGISTER USER (Admin or Staff)
 * - If role = admin → create a new Gym + link user to it
 * - If role != admin → link user to an existing gym (gymId must be provided)
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  console.log("📥 Register request received:", req.body);

  const { fullname, email, password, phone, gymName } = req.body;

  // Basic validation
  if (!fullname || !email || !password) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "fullname, email, and password are required");
  }

  // CRITICAL: Public registration is ONLY for gym owners (admin role)
  const role = 'admin';

  if (!gymName) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "Gym name is required for registration");
  }

  // Check if user already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new apiError(HttpStatusCode.CONFLICT, "Email already in use");
  }

  // 1. Pre-generate IDs for atomicity
  const gymId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  try {
    // 2. Create Gym with TRIAL status
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const newGym = await Gym.create({
      _id: gymId,
      name: gymName,
      status: 'trial',
      trialEndsAt,
      plan: 'pro', // Default to pro for trial
      owner: userId,
      features: {
        payments: true,
        attendance: true,
        pt: true,
        classes: true,
        memberPortal: true
      }
    });

    // 3. Create User
    const user = await User.create({
      _id: userId,
      fullname,
      email,
      phone,
      password,
      avatar: fullname.charAt(0).toUpperCase(),
      role: 'admin',
      gym: gymId,
    });

    // 4. Create initial trial subscription
    await Subscription.create({
      gymId: gymId,
      plan: 'pro',
      status: 'trialing',
      billingCycle: 'monthly',
      amount: 0,
      currency: 'INR',
      nextBillingDate: trialEndsAt
    });

    const token = user.generateAccessToken();
    const safeUser = user.toFrontendUser();

    return res
      .status(HttpStatusCode.CREATED)
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .json(new ApiResponse(HttpStatusCode.CREATED, safeUser, "Account created! Your 14-day trial has started."));

  } catch (error) {
    // Cleanup on failure
    await Gym.findByIdAndDelete(gymId);
    await User.findByIdAndDelete(userId);
    await Subscription.deleteOne({ gymId });
    throw error;
  }
});

/**
 * LOGIN USER
 */
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials");
  }

  // ===== BROWSER-SCOPED SESSION TRACKING =====
  // Generate session ID for logging/analytics (not used for validation)
  const sessionId = uuidv4();

  // Store session info for logging purposes only
  user.currentSessionId = sessionId;
  user.sessionCreatedAt = new Date();
  user.lastActiveAt = new Date();

  // NOTE: We do NOT increment tokenVersion here
  // Browser-scoped auth means each browser manages its own session
  // No global invalidation across browsers/devices

  await user.save();
  // ===== END SESSION TRACKING =====

  const token = user.generateAccessToken();
  // Fetch Staff Position if role is staff
  const safeUser = user.toFrontendUser() as any; // Cast to any to add extra prop

  if (safeUser.role === 'staff') {
    // Import Staff model at top or here (dynamic import might be safer if not top-level)
    const { Staff } = await import("../models/staff.model.js");
    const staffRecord = await Staff.findOne({ userId: user._id });
    safeUser.position = staffRecord ? staffRecord.position : 'unknown';
    safeUser.staffId = staffRecord ? staffRecord._id : undefined; // Expose Staff ID
  } else if (safeUser.role === 'trainer') {
    safeUser.position = 'trainer';
  } else if (safeUser.role === 'admin' || safeUser.role === 'superadmin') {
    safeUser.position = safeUser.role;
  } else {
    safeUser.position = 'member';
  }

  return res
    .status(HttpStatusCode.OK)
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    // CRITICAL: Clear SuperAdmin cookie to prevent collisions
    .clearCookie("super_admin_token")
    .json(new ApiResponse(HttpStatusCode.OK, {
      ...safeUser,
      accessToken: token,
      sessionId: sessionId  // Return for frontend logging only
    }, "User logged in successfully"));
});

/**
 * GOOGLE SIGN-IN
 * (Optional: assign gym manually if you want Google users to belong to a gym)
 */
const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, gymId } = req.body;

  if (!idToken) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "ID token is required");
  }

  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, name, picture } = decodedToken;

  if (!email || !name) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "Invalid Google user data");
  }

  let user = await User.findOne({ email });
  if (!user) {
    if (!gymId) {
      throw new apiError(HttpStatusCode.BAD_REQUEST, "gymId required for new Google users");
    }

    user = await User.create({
      fullname: name,
      email,
      avatar: picture || name.charAt(0).toUpperCase(),
      role: "user",
      gym: new Types.ObjectId(gymId),
      password: Math.random().toString(36).slice(-8), // random temp password
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
    .clearCookie("super_admin_token")
    .json(new ApiResponse(HttpStatusCode.OK, safeUser, "Google Sign-In successful"));
});

/**
 * LOGOUT
 */
const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  // Clear active status on logout
  const userId = (req as any).user?._id || (req as any).user?.id;
  if (userId) {
    await User.findByIdAndUpdate(userId, { lastActiveAt: null });
  }

  return res
    .status(HttpStatusCode.OK)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .clearCookie("super_admin_token")
    .json(new ApiResponse(HttpStatusCode.OK, {}, "User logged out successfully"));
});

/**
 * GET CURRENT USER
 */
const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    throw new apiError(HttpStatusCode.UNAUTHORIZED, "No user logged in");
  }

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, user, "Current user fetched successfully"));
});


/**
 * UPDATE USER PROFILE
 * PATCH /api/v1/users/profile
 */
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { fullname, phone, email, avatar } = req.body;
  let avatarSettings = req.body.avatarSettings;
  const userId = (req as any).user.id;

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(HttpStatusCode.NOT_FOUND, "User not found");
  }

  // Parse avatarSettings if it's a JSON string (from FormData)
  if (typeof avatarSettings === 'string') {
    try {
      avatarSettings = JSON.parse(avatarSettings);
    } catch (error) {
      console.error('Failed to parse avatarSettings:', error);
      avatarSettings = undefined;
    }
  }

  // Update allowed fields
  if (fullname) user.fullname = fullname;
  if (phone !== undefined) user.phone = phone;

  // Handle avatar update
  if (req.file) {
    // If a file is uploaded, use its path
    // Remove "public" from path if it was saved relative to public root, but here we saved to "uploads" which is served at /uploads
    // Our static serve is app.use('/uploads', express.static(...)) matching the folder structure.
    // The middleware saves to ../../uploads
    // So the URL should be /uploads/filename
    user.avatar = `/uploads/${req.file.filename}`;
  } else if (avatar) {
    // If no file but avatar string provided (e.g. url), use it
    user.avatar = avatar;
  }

  // Handle avatar settings update
  if (avatarSettings) {
    user.avatarSettings = {
      textColor: avatarSettings.textColor,
      backgroundColor: avatarSettings.backgroundColor,
      backgroundType: avatarSettings.backgroundType,
      gradientStart: avatarSettings.gradientStart,
      gradientEnd: avatarSettings.gradientEnd,
    };
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new apiError(HttpStatusCode.CONFLICT, "Email already in use");
    }
    user.email = email;
  }

  await user.save();

  const safeUser = user.toFrontendUser();

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, safeUser, "Profile updated successfully"));
});

/**
 * CHANGE PASSWORD
 * POST /api/v1/users/change-password
 */
const changeCurrentPassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  if (!oldPassword || !newPassword) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "Old and new password are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(HttpStatusCode.NOT_FOUND, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "Invalid old password");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(HttpStatusCode.OK)
    .json(new ApiResponse(HttpStatusCode.OK, {}, "Password changed successfully"));
});

export { registerUser, loginUser, logoutUser, getCurrentUser, googleSignIn, updateUserProfile, changeCurrentPassword };
