/**
 * Protected Route Component
 * Restricts access to routes based on user role
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();

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

    // Check if user's role is allowed
    if (!allowedRoles.includes(user.role)) {
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

    // User is authenticated and has correct role
    return <>{children}</>;
};
