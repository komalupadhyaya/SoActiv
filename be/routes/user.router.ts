import express from "express";
import {
  getCurrentUser,
  //   getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  googleSignIn,
  updateUserProfile,
  changeCurrentPassword
} from "../controllers/user.controller";
import { loginRequestLimiter } from "../middlewares/rateLimit.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import upload from "../middlewares/upload.middleware";
// import { JWTVerify } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.route("/login").post(loginRequestLimiter, loginUser);
router.route("/register").post(loginRequestLimiter, registerUser);
router.route("/google-signin").post(googleSignIn);
router.route("/logout").post(loginRequestLimiter, logoutUser);
router.route("/getCurrentUser").get(authMiddleware, getCurrentUser);

router.route("/profile").patch(authMiddleware, upload.single("avatar"), updateUserProfile);
router.route("/change-password").post(authMiddleware, changeCurrentPassword);

export default router;