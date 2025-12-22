import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { SuperAdminHeader } from './SuperAdminHeader';
import { useAuth } from '../../contexts/AuthContext';

export function SuperAdminLayout() {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // ===== USE AUTHCONTEXT (SINGLE SOURCE OF TRUTH) =====
    const { user, role, isLoading, logout } = useAuth();

    // ===== HARD ROLE GUARD (PREVENT ROLE MUTATION) =====
    // ONLY run guard AFTER auth initialization completes
    useEffect(() => {
        if (!isLoading && role !== 'superadmin') {
            // Role mismatch detected - another role logged in
            // AuthContext handles storage clearing
            logout();
            navigate('/super-admin/login', { replace: true });
        }
    }, [isLoading, role, logout, navigate]);

    // ===== WAIT FOR AUTH INITIALIZATION =====
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // ===== BLOCK RENDER ON ROLE MISMATCH =====
    if (!user || role !== 'superadmin') {
        return null; // Prevent any rendering until role is correct
    }

    const handleLogout = async () => {
        // AuthContext handles all storage clearing
        await logout();
        navigate('/super-admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar Component */}
            <SuperAdminSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                onLogout={handleLogout}
                user={user || {}}
            />

            {/* Main Content Wrapper */}
            <div className="xl:pl-64 flex flex-col min-h-screen transition-all duration-300">
                {/* Header Component */}
                <SuperAdminHeader
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                {/* Page Content */}
                <main className="p-4 sm:p-6 flex-1">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 xl:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}

