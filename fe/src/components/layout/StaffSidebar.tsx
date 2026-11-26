
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    LogOut,
    Dumbbell,
    Bell,
    X,
    TrendingUp,
    CalendarCheck2,
    MessageSquareReply,
    UserCog,
    Apple,
    Sparkles,
    Inbox,
    GraduationCap,
    CheckCircle2,
    CalendarPlus,
    ClipboardList,
    MessageSquare,
    Menu,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStaffPermissions } from '../../hooks/useStaffPermissions';
import { clsx } from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const StaffSidebar: React.FC<SidebarProps> = ({
    isOpen,
    onClose,
    isCollapsed = false,
    onToggleCollapse,
}) => {
    const { user, logout } = useAuth();
    const {
        canViewMembers,
        canViewLeads,
        canViewStaff,
        isManager,
        isTrainer,
        isCleaner,
        isReceptionist
    } = useStaffPermissions();

    const navigationItems = [
        { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard, show: true },

        // Manager & Receptionist & Trainer
        { name: 'Members', href: '/staff/members', icon: Users, show: canViewMembers },

        // { name: 'Profile', href: '/staff/profile', icon: User, show: true },
        { name: isCleaner ? 'My Cleaning Tasks' : 'My Follow-Ups', href: '/staff/follow-ups', icon: MessageSquareReply, show: true },
        { name: 'Cleaning Checklist', href: '/staff/cleaning', icon: Sparkles, show: isCleaner || isManager },
        { name: 'My Attendance', href: '/staff/attendance', icon: CalendarCheck2, show: true },
        // All Staff
        { name: 'Calendar', href: '/staff/schedule', icon: CalendarCheck2, show: !isCleaner }, // Hide Calendar page link for Cleaner

        { name: 'Announcements', href: '/staff/announcements', icon: Bell, show: true },

        // Trainer Only
        { name: 'My Classes', href: '/staff/my-classes', icon: GraduationCap, show: isTrainer, feature: 'classes' },
        { name: 'My PT Clients', href: '/staff/pt-clients', icon: Users, show: isTrainer, feature: 'pt' },
        { name: 'Client Nutrition', href: '/staff/client-nutrition', icon: Apple, show: isTrainer },

        // Manager Only
        { name: 'Staff List', href: '/staff/staff-list', icon: UserCog, show: isManager && canViewStaff },
        { name: 'Classes', href: '/staff/classes', icon: GraduationCap, show: isManager, feature: 'classes' },
        { name: 'PT Assignments', href: '/staff/pt-assignments', icon: Dumbbell, show: isManager, feature: 'pt' },
        { name: 'Exercise Library', href: '/staff/exercises', icon: Dumbbell, show: isManager },
        { name: 'Member Support', href: '/staff/member-support', icon: Inbox, show: isManager },
        // { name: 'Team Attendance', href: '/staff/team-attendance', icon: FileText, show: isManager },

        // Sales Only
        { name: 'Sales Leads', href: '/staff/enquiries', icon: TrendingUp, show: canViewLeads },

        // Receptionist Only
        { name: 'Check In / Out', href: '/staff/check-in', icon: CheckCircle2, show: isReceptionist, feature: 'attendance' },
        { name: 'Book Class', href: '/staff/book-class', icon: CalendarPlus, show: isReceptionist, feature: 'classes' },
        { name: 'Book Appointment', href: '/staff/book-appointment', icon: ClipboardList, show: isReceptionist },
        { name: 'Register Complaint', href: '/staff/complaints', icon: MessageSquare, show: isReceptionist },
    ];

    const filteredItems = navigationItems.filter((item) => {
        if (!item.show) return false;
        if (item.feature) {
            const hasFeature = user?.gymFeatures ? user.gymFeatures[item.feature as keyof typeof user.gymFeatures] : true;
            if (hasFeature === false) return false;
        }
        return true;
    });

    return (
        <div
            className={clsx(
                'transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50 fixed inset-y-0 left-0 flex flex-col',
                /* EXPANDED SIDEBAR WIDTH COMMENTED OUT:
                isOpen
                    ? 'w-64 translate-x-0'
                    : isCollapsed
                    ? 'hidden xl:flex xl:w-20'
                    : 'hidden xl:flex xl:w-64',
                */
                isOpen ? 'w-24 translate-x-0' : 'hidden xl:flex xl:w-24'
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">Staff Portal</p>
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
                {filteredItems.map((item) => (
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
                                    ? 'text-[11px] font-medium text-center w-full mt-1 leading-tight px-0.5 break-words line-clamp-2'
                                    : 'text-sm font-medium truncate'
                            )}
                        >
                            {item.name}
                        </span>
                    </NavLink>
                ))}
            </div>

            <div className={clsx('pb-6', isCollapsed ? 'px-1.5' : 'px-3')}>
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
            </div>
        </div>
    );
};
