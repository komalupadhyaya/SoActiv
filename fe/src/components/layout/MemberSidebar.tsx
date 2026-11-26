import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    LogOut,
    Dumbbell,
    X,
    CreditCard,
    CalendarDays,
    Camera,
    Target,
    Apple,
    Settings,
    Sun,
    Moon,
    Bell,
    BellOff,
    Megaphone,
    MessageSquare,
    GraduationCap,
    Menu,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { clsx } from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const MemberSidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    isCollapsed = false,
    onToggleCollapse,
}) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(
        localStorage.getItem('notificationsEnabled') !== 'false'
    );

    // Disable scrolling when Settings modal is open
    useEffect(() => {
        const mainElement = document.querySelector('main');
        if (isSettingsOpen) {
            document.body.style.overflow = 'hidden';
            if (mainElement) {
                mainElement.style.overflow = 'hidden';
            }
        } else {
            document.body.style.overflow = '';
            if (mainElement) {
                mainElement.style.overflow = '';
            }
        }
        return () => {
            document.body.style.overflow = '';
            if (mainElement) {
                mainElement.style.overflow = '';
            }
        };
    }, [isSettingsOpen]);

    const handleNotificationsToggle = () => {
        const nextState = !notificationsEnabled;
        setNotificationsEnabled(nextState);
        localStorage.setItem('notificationsEnabled', nextState ? 'true' : 'false');
        window.dispatchEvent(new Event('notifications-toggle'));
    };

    const navigationItems = [
        { name: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard },
        { name: 'Announcements', href: '/member/announcements', icon: Megaphone },
        { name: 'Classes', href: '/member/classes', icon: GraduationCap, feature: 'classes' },
        { name: 'Payment History', href: '/member/payments', icon: CreditCard, feature: 'payments' },
        { name: 'Attendance Tracking', href: '/member/attendance', icon: CalendarDays, feature: 'attendance' },
        { name: 'Progress Photos', href: '/member/progress-photos', icon: Camera, feature: 'memberPortal' },
        { name: 'Fitness Goals', href: '/member/fitness-goals', icon: Target, feature: 'memberPortal' },
        { name: 'Nutrition & Diet', href: '/member/nutrition', icon: Apple, feature: 'memberPortal' },
        { name: 'Exercise Library', href: '/member/exercises', icon: Dumbbell, feature: 'memberPortal' },
        { name: 'Contact Support', href: '/member/contact-support', icon: MessageSquare },
        { name: 'My Profile', href: '/member/profile', icon: User },
    ].filter(item => {
        if (item.feature) {
            const hasFeature = user?.gymFeatures ? user.gymFeatures[item.feature as keyof typeof user.gymFeatures] : true;
            if (hasFeature === false) {
                return false;
            }
        }
        return true;
    });

    return (
        <div
            className={clsx(
                'transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50 fixed inset-y-0 left-0 flex flex-col',
                /* EXPANDED SIDEBAR WIDTH COMMENTED OUT:
                isOpen
                    ? 'w-64 translate-x-0 animate-slideIn'
                    : isCollapsed
                    ? 'hidden xl:flex xl:w-20 xl:z-30'
                    : 'hidden xl:flex xl:w-64 xl:z-30',
                */
                isOpen ? 'w-24 translate-x-0 animate-slideIn' : 'hidden xl:flex xl:w-24 xl:z-30'
            )}
        >
            <div
                className={clsx(
                    'flex items-center border-b border-gray-200 dark:border-gray-700 py-4 transition-all duration-300',
                    /* EXPANDED SIDEBAR HEADER JUSTIFY COMMENTED OUT: isCollapsed ? 'justify-center px-1' : 'justify-between px-4' */
                    'justify-center px-1'
                )}
            >
                <div className="flex items-center space-x-1.5">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-lg shrink-0 shadow-sm">
                        <Dumbbell className="w-6 h-6 text-white" />
                    </div>

                    {/* EXPANDED SIDEBAR TITLE & SUBTITLE COMMENTED OUT:
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap transition-all duration-300 ml-1.5">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">SoActiv</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Member Portal</p>
                        </div>
                    )}
                    */}

                    {/* EXPANDED SIDEBAR EXPAND/COLLAPSE TOGGLE BUTTONS COMMENTED OUT:
                    {isCollapsed && onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="hidden xl:flex p-1 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Expand sidebar"
                            aria-label="Expand sidebar"
                        >
                            <ChevronRight size={20} />
                        </button>
                    )}
                    */}
                </div>

                <div className="flex items-center space-x-1">
                    {/* EXPANDED SIDEBAR HAMBURGER BUTTON COMMENTED OUT:
                    {!isCollapsed && onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            className="hidden xl:flex p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Collapse sidebar"
                            aria-label="Collapse sidebar"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    */}

                    {/* Close button visible only on mobile when sidebar is open */}
                    {isOpen && (
                        <button
                            onClick={onClose}
                            className="xl:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label="Close sidebar"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-col flex-1 py-6 space-y-1 overflow-y-auto px-1.5">
                {navigationItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        title={item.name}
                        className={({ isActive }) =>
                            clsx(
                                'group flex font-medium rounded-lg transition-all duration-200',
                                isCollapsed
                                    ? 'flex-col items-center justify-center py-2 px-1 text-center'
                                    : 'flex-row items-center px-3 py-2.5 text-sm',
                                isActive
                                    ? isCollapsed
                                        ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-semibold'
                                        : 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-l-4 border-orange-500 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                            )
                        }
                    >
                        <item.icon
                            className={clsx(
                                'flex-shrink-0 transition-colors',
                                isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3',
                                'group-hover:text-orange-500'
                            )}
                        />
                        <span
                            className={clsx(
                                'transition-all duration-300',
                                isCollapsed
                                    ? 'text-[11px] font-medium text-center w-full truncate mt-1 leading-tight'
                                    : 'text-sm font-medium truncate'
                            )}
                        >
                            {item.name}
                        </span>
                    </NavLink>
                ))}
            </div>

            <div className={clsx('pb-6 space-y-2', isCollapsed ? 'px-1.5' : 'px-3')}>
                <button
                    onClick={logout}
                    title="Logout"
                    className={clsx(
                        'group flex w-full font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200',
                        isCollapsed
                            ? 'flex-col items-center justify-center py-2 px-1 text-center'
                            : 'flex-row items-center px-3 py-2.5 text-sm'
                    )}
                >
                    <LogOut
                        className={clsx(
                            'flex-shrink-0 transition-colors group-hover:text-red-500',
                            isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'
                        )}
                    />
                    <span
                        className={clsx(
                            'transition-all duration-300',
                            isCollapsed
                                ? 'text-[11px] font-medium text-center w-full truncate mt-1 leading-tight'
                                : 'text-sm font-medium truncate'
                        )}
                    >
                        Logout
                    </span>
                </button>
                <button
                    onClick={() => {
                        setIsSettingsOpen(true);
                        if (onClose) onClose();
                    }}
                    title="Settings"
                    className={clsx(
                        'group flex w-full font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200',
                        isCollapsed
                            ? 'flex-col items-center justify-center py-2 px-1 text-center'
                            : 'flex-row items-center px-3 py-2.5 text-sm'
                    )}
                >
                    <Settings
                        className={clsx(
                            'flex-shrink-0 transition-colors group-hover:text-orange-500',
                            isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3'
                        )}
                    />
                    <span
                        className={clsx(
                            'transition-all duration-300',
                            isCollapsed
                                ? 'text-[11px] font-medium text-center w-full truncate mt-1 leading-tight'
                                : 'text-sm font-medium truncate'
                        )}
                    >
                        Settings
                    </span>
                </button>
            </div>

            {/* Premium Settings Modal */}
            {isSettingsOpen && (
                <div 
                    onClick={() => setIsSettingsOpen(false)}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700 animate-fadeIn"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center space-x-2">
                                <Settings className="w-5 h-5 text-orange-500 animate-spin-slow" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Settings</h3>
                            </div>
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Theme Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {theme === 'dark' ? <Moon className="w-4 h-4 text-orange-500" /> : <Sun className="w-4 h-4 text-orange-500" />}
                                        Theme / Appearance
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Choose light or dark interface preference.
                                    </p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={clsx(
                                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                        theme === 'dark' ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                            theme === 'dark' ? "translate-x-5" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>

                            {/* Notifications Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        {notificationsEnabled ? <Bell className="w-4 h-4 text-orange-500" /> : <BellOff className="w-4 h-4 text-gray-400" />}
                                        In-App Notifications
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Receive active in-app updates and bell count badges.
                                    </p>
                                </div>
                                <button
                                    onClick={handleNotificationsToggle}
                                    className={clsx(
                                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                        notificationsEnabled ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
                                    )}
                                >
                                    <span
                                        className={clsx(
                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                            notificationsEnabled ? "translate-x-5" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
