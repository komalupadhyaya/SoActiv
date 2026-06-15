import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MemberSidebar } from './MemberSidebar';
import { MemberTopbar } from './MemberTopbar';

export const MemberLayout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            <MemberSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

            <div className="flex-1 xl:pl-64 flex flex-col overflow-hidden">
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
