import { useState } from 'react';
import { Menu, Sun, Moon, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';

interface SuperAdminHeaderProps {
    onMobileMenuToggle: () => void;
}

export function SuperAdminHeader({ onMobileMenuToggle }: SuperAdminHeaderProps) {
    const { theme, toggleTheme } = useTheme();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/super-admin/login');
    };

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Mobile Toggle */}
                    <button
                        onClick={onMobileMenuToggle}
                        className="xl:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="hidden sm:inline text-gray-600 dark:text-gray-300">Platform Active</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="rounded-full ring-2 ring-transparent hover:ring-indigo-400 transition-all focus:outline-none"
                            aria-label="User menu"
                            aria-haspopup="true"
                            aria-expanded={showProfileMenu}
                        >
                            <Avatar
                                src={user?.avatar}
                                name={user?.name || 'Super Admin'}
                                userId={user?.id}
                                className="w-8 h-8"
                                forceInitials={true}
                                customColors={user?.avatarSettings}
                            />
                        </button>

                        {showProfileMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowProfileMenu(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                            {user?.name || 'Super Admin'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                            {user?.email}
                                        </div>
                                        <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                                            {user?.role === 'superadmin' ? 'Super Admin' : user?.role}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            navigate('/super-admin/profile');
                                            setShowProfileMenu(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                    >
                                        <User className="w-4 h-4" />
                                        My Profile
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-gray-700 mt-2 pt-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
