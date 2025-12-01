import type { Request, Response } from "express";
import { Types } from "mongoose";
import apiError from "../lib/ApiError.ts";
import ApiResponse from "../lib/ApiResponse.ts";
import { asyncHandler } from "../lib/AsyncHandler.ts";
import { HttpStatusCode } from "../lib/const.ts";
import { User } from "../models/user.model.js";
import { Gym } from "../models/gym.model.js"; // 👈 NEW import
import admin from "../firebase/admin";

/**
 * REGISTER USER (Admin or Staff)
 * - If role = admin → create a new Gym + link user to it
 * - If role != admin → link user to an existing gym (gymId must be provided)
 */
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  console.log("📥 Register request received:", req.body);

  const { fullname, email, password, phone, role, gymName, gymId } = req.body;

  // Basic validation
  if (!fullname || !email || !password) {
    throw new apiError(HttpStatusCode.BAD_REQUEST, "fullname, email, and password are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new apiError(HttpStatusCode.CONFLICT, "Email already in use");
  }

  let gymRef: Types.ObjectId | undefined;

  // 🧱 CASE 1: Admin registering a new Gym
  if (role === "admin") {
    if (!gymName) {
      throw new apiError(HttpStatusCode.BAD_REQUEST, "Gym name is required for admin registration");
    }

    // Create Gym
    const newGym = await Gym.create({
      name: gymName,
    });
    gymRef = newGym._id as Types.ObjectId;
  }

  // 🧱 CASE 2: Staff/Trainer joining existing Gym
  else {
    if (!gymId) {
      throw new apiError(HttpStatusCode.BAD_REQUEST, "gymId is required for non-admin registration");
    }
    gymRef = new Types.ObjectId(gymId);
  }

  // Create User
  const user = await User.create({
    fullname,
    email,
    phone,
    password,
    avatar: fullname.charAt(0).toUpperCase(),
    role: role || "user",
    gym: gymRef,
  });

  // If admin → update Gym owner
  if (role === "admin") {
    await Gym.findByIdAndUpdate(gymRef, { owner: user._id });
  }

  const token = user.generateAccessToken();
  const safeUser = user.toFrontendUser();

  return res
    .status(HttpStatusCode.CREATED)
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .json(new ApiResponse(HttpStatusCode.CREATED, safeUser, "User registered successfully"));
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

  const token = user.generateAccessToken();
  const safeUser = user.toFrontendUser();

  return res
    .status(HttpStatusCode.OK)
    .cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .json(new ApiResponse(HttpStatusCode.OK, safeUser, "User logged in successfully"));
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
    .json(new ApiResponse(HttpStatusCode.OK, safeUser, "Google Sign-In successful"));
});

/**
 * LOGOUT
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

export { registerUser, loginUser, logoutUser, getCurrentUser, googleSignIn };
