import type { Request, Response, NextFunction } from 'express';
import ApiError from '../lib/ApiError.js';
import { HttpStatusCode } from '../lib/const.js';

/**
 * RBAC Middleware - Role-Based Access Control
 * Ensures that only users with specified roles can access protected routes
 * 
 * Usage:
 * router.get('/admin-only', authMiddleware, requireRole('admin'), handler);
 * router.get('/multi-role', authMiddleware, requireRole('admin', 'superadmin'), handler);
 */
export const requireRole = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // User should be attached by authMiddleware
        const user = (req as any).user;

        if (!user) {
            throw new ApiError(
                HttpStatusCode.UNAUTHORIZED,
                'Authentication required. Please login.'
            );
        }

        if (!user.role) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                'User role not found. Access denied.'
            );
        }

        // Check if user's role is in the allowed roles list
        if (!allowedRoles.includes(user.role)) {
            throw new ApiError(
                HttpStatusCode.FORBIDDEN,
                `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${user.role}`
            );
        }

        // User has required role, proceed
        next();
    };
};

/**
 * Require SuperAdmin role specifically
 */
export const requireSuperAdmin = requireRole('superadmin');

/**
 * Require Admin role specifically
 */
export const requireAdmin = requireRole('admin');

/**
 * Require Staff role (any staff position)
 */
export const requireStaff = requireRole('staff');

/**
 * Require Trainer role
 */
export const requireTrainer = requireRole('trainer');

/**
 * Require Admin or SuperAdmin (management roles)
 */
export const requireManagement = requireRole('admin', 'superadmin');
