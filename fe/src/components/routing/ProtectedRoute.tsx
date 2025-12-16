/**
 * Protected Route Component
 * Restricts access to routes based on user role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { useStaffPermissions } from '../../hooks/useStaffPermissions';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[]; // Keep for backward compatibility or broad checks
    allowedPositions?: string[]; // New: Granular position check
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, allowedPositions }) => {
    const { user, isLoading } = useAuth();
    const { position } = useStaffPermissions(); // Use our hook to normalize position

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 1. Check Role (Broad)
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const roleRedirects: Record<string, string> = {
            admin: '/admin/dashboard',
            staff: '/staff/dashboard',
            trainer: '/trainer/dashboard',
            member: '/member/dashboard',
        };
        const redirectPath = roleRedirects[user.role] || '/login';
        return <Navigate to={redirectPath} replace />;
    }

    // 2. Check Position (Granular)
    if (allowedPositions) {
        // Admin always passes position checks (unless strictly excluded, but usually admin can do everything)
        const isAdmin = user.role === 'admin' || user.role === 'superadmin';

        if (!isAdmin && !allowedPositions.includes(position)) {
            // If denied by position, go to safe dashboard
            return <Navigate to="/staff/dashboard" replace />;
        }
    }

    // User is authenticated and has correct role/position
    return <>{children}</>;
};
