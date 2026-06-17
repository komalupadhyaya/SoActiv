import { Router } from "express";
import { requireSuperAdminAuth } from "../middlewares/superAdminAuth.middleware.js";
import { authMiddleware as auth } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../lib/AsyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { logSuperAdminAction, getSuperAdminContext } from "../utils/superAdminLogger.js";

// Import controllers
import {
    createGym,
    listGyms,
    getGymDetails,
    updateGym,
    updateGymStatus,
    toggleFeature,
    deleteGym,
    extendTrial
} from "../controllers/superAdmin.gym.controllers.js";

import {
    createAdmin,
    listAdmins,
    updateAdmin,
    resetAdminPassword,
    forceLogoutAdmin
} from "../controllers/superAdmin.admin.controllers.js";

import {
    getMetrics,
    getCharts,
    getAuditLogs
} from "../controllers/superAdmin.dashboard.controllers.js";

import { getMe } from "../controllers/superAdmin.session.controllers.js";
import { impersonateAdmin } from "../controllers/superAdmin.impersonation.controllers.js";
import {
    listPlans,
    createPlan,
    updatePlan,
    deletePlan
} from "../controllers/superAdmin.plan.controllers.js";

import {
    updateSuperAdminProfile,
    changeSuperAdminPassword
} from "../controllers/superAdmin.profile.controllers.js";

// Multer middleware for avatar upload
import upload from "../middlewares/upload.middleware.js";

const router = Router();


/**
 * Super Admin Login
 * POST /api/v1/super-admin/auth/login
 */
router.post("/auth/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Email and password are required");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials");
    }

    // CRITICAL: Check if user is Super Admin
    if (user.role !== "superadmin") {
        throw new ApiError(HttpStatusCode.FORBIDDEN, "Access denied. Super Admin privileges required.");
    }

    // Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Invalid credentials");
    }

    // Generate token with Super Admin role
    const token = user.generateAccessToken();

    // Get IP address
    const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown';

    const userAgent = req.headers['user-agent'] || 'unknown';

    // Log login
    await logSuperAdminAction({
        action: "login",
        targetType: "system",
        performedBy: user._id,
        metadata: { email },
        ipAddress,
        userAgent
    });

    // Set cookie with separate name for Super Admin
    res.cookie("super_admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // CRITICAL: Clear Admin/User cookie to prevent collisions
    res.clearCookie("accessToken");

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Login successful",
        data: {
            user: {
                id: user._id,
                name: user.fullname,
                email: user.email,
                role: user.role
            },
            token
        }
    });
}));

/**
 * Super Admin Logout
 * POST /api/v1/super-admin/auth/logout
 */
router.post("/auth/logout", requireSuperAdminAuth, asyncHandler(async (req, res) => {
    const context = getSuperAdminContext(req);

    // Log logout
    await logSuperAdminAction({
        action: "logout",
        targetType: "system",
        performedBy: context.performedBy,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
    });

    res.clearCookie("super_admin_token");
    res.clearCookie("accessToken"); // Ensure clean state

    res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Logout successful"
    })
}));

// ==================== SESSION & SECURITY ROUTES ====================
// Use requireSuperAdminAuth to ensure we read super_admin_token, NOT accessToken
router.get("/me", requireSuperAdminAuth, getMe);
router.patch("/profile", requireSuperAdminAuth, upload.single("avatar"), updateSuperAdminProfile);
router.post("/change-password", requireSuperAdminAuth, changeSuperAdminPassword);

// ==================== IMPERSONATION ROUTES ====================
router.post("/impersonate/:adminId", requireSuperAdminAuth, impersonateAdmin);

// ==================== DASHBOARD ROUTES ====================
router.get("/dashboard/metrics", requireSuperAdminAuth, getMetrics);
router.get("/dashboard/charts", requireSuperAdminAuth, getCharts);

// ==================== GYM MANAGEMENT ROUTES ====================
router.post("/gyms", requireSuperAdminAuth, createGym);
router.get("/gyms", requireSuperAdminAuth, listGyms);
router.get("/gyms/:id", requireSuperAdminAuth, getGymDetails);
router.patch("/gyms/:id", requireSuperAdminAuth, updateGym);
router.patch("/gyms/:id/status", requireSuperAdminAuth, updateGymStatus);
router.patch("/gyms/:id/features/:featureName", requireSuperAdminAuth, toggleFeature);
router.patch("/gyms/:id/extend-trial", requireSuperAdminAuth, extendTrial);
router.delete("/gyms/:id", requireSuperAdminAuth, deleteGym);

// ==================== ADMIN MANAGEMENT ROUTES ====================
router.post("/admins", requireSuperAdminAuth, createAdmin);
router.get("/admins", requireSuperAdminAuth, listAdmins);
router.patch("/admins/:id", requireSuperAdminAuth, updateAdmin);
router.post("/admins/:id/reset-password", requireSuperAdminAuth, resetAdminPassword);
router.post("/admins/:id/force-logout", requireSuperAdminAuth, forceLogoutAdmin);

// ==================== PLAN MANAGEMENT ROUTES ====================
router.get("/plans", listPlans);
router.post("/plans", requireSuperAdminAuth, createPlan);
router.patch("/plans/:id", requireSuperAdminAuth, updatePlan);
router.delete("/plans/:id", requireSuperAdminAuth, deletePlan);

// ==================== AUDIT LOGS ROUTES ====================
router.get("/logs", requireSuperAdminAuth, getAuditLogs);

export default router;
