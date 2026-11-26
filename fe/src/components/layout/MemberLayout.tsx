import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MemberSidebar } from './MemberSidebar';
import { MemberTopbar } from './MemberTopbar';
import { clsx } from 'clsx';

export const MemberLayout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        return localStorage.getItem('sidebar_collapsed') === 'true';
    });

    const toggleSidebarCollapse = () => {
        setIsSidebarCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar: collapsed mode only for now (expanded code commented out) */}
            <MemberSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                isCollapsed={true}
                /* onToggleCollapse={toggleSidebarCollapse} -- EXPANDED SIDEBAR TOGGLE COMMENTED OUT */
            />

            {/* EXPANDED SIDEBAR PADDING COMMENTED OUT: isSidebarCollapsed ? "xl:pl-20" : "xl:pl-64" */}
            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out xl:pl-24">
                <MemberTopbar
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    isMobileMenuOpen={isMobileMenuOpen}
                />

                <main className="p-4 xl:p-6 flex-1 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
};

export default MemberLayout;
