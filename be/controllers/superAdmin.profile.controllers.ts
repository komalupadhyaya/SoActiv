import type { Request, Response } from "express";
import { asyncHandler } from "../lib/AsyncHandler.js";
import ApiError from "../lib/ApiError.js";
import { HttpStatusCode } from "../lib/const.js";
import { User } from "../models/user.model.js";
import ApiResponse from "../lib/ApiResponse.js";

/**
 * UPDATE SUPER ADMIN PROFILE
 * PATCH /api/v1/super-admin/profile
 */
export const updateSuperAdminProfile = asyncHandler(async (req: Request, res: Response) => {
    const { fullname, phone, email, avatar } = req.body;
    let avatarSettings = req.body.avatarSettings;

    // MANDATORY DEFENSIVE CHECK
    if (!(req as any).user || !(req as any).user.id) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized: user not attached to request");
    }

    const userId = (req as any).user.id;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
    }

    if (user.role !== "superadmin") {
        throw new ApiError(HttpStatusCode.FORBIDDEN, "Not a super admin");
    }

    // Parse avatarSettings if it's a JSON string
    if (typeof avatarSettings === 'string') {
        try {
            avatarSettings = JSON.parse(avatarSettings);
        } catch (error) {
            console.error('Failed to parse avatarSettings:', error);
            avatarSettings = undefined;
        }
    }

    // Update fields
    if (fullname) user.fullname = fullname;
    if (phone !== undefined) user.phone = phone;

    // Handle avatar
    if (req.file) {
        user.avatar = (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://')))
            ? req.file.path
            : `/uploads/${req.file.filename}`;
    } else if (avatar) {
        user.avatar = avatar;
    }

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
            throw new ApiError(HttpStatusCode.CONFLICT, "Email already in use");
        }
        user.email = email;
    }

    await user.save();

    const safeUser = {
        id: user._id,
        name: user.fullname,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        avatarSettings: user.avatarSettings
    };

    return res
        .status(HttpStatusCode.OK)
        .json(new ApiResponse(HttpStatusCode.OK, safeUser, "Super Admin profile updated successfully"));
});

/**
 * CHANGE SUPER ADMIN PASSWORD
 * POST /api/v1/super-admin/change-password
 */
export const changeSuperAdminPassword = asyncHandler(async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    // MANDATORY DEFENSIVE CHECK
    if (!(req as any).user || !(req as any).user.id) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, "Unauthorized: user not attached to request");
    }

    const userId = (req as any).user.id;

    if (!oldPassword || !newPassword) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Old and new password are required");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, "User not found");
    }

    if (user.role !== "superadmin") {
        throw new ApiError(HttpStatusCode.FORBIDDEN, "Not a super admin");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid old password");
    }

    user.password = newPassword;
    await user.save();

    return res
        .status(HttpStatusCode.OK)
        .json(new ApiResponse(HttpStatusCode.OK, {}, "Password changed successfully"));
});
