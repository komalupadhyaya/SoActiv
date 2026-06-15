
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
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStaffPermissions } from '../../hooks/useStaffPermissions';
import { clsx } from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose?: () => void;
}

export const StaffSidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
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
        { name: 'My Classes', href: '/staff/my-classes', icon: GraduationCap, show: isTrainer },
        { name: 'My PT Clients', href: '/staff/pt-clients', icon: Users, show: isTrainer },
        { name: 'Client Nutrition', href: '/staff/client-nutrition', icon: Apple, show: isTrainer },

        // Manager Only
        { name: 'Staff List', href: '/staff/staff-list', icon: UserCog, show: isManager && canViewStaff },
        { name: 'Classes', href: '/staff/classes', icon: GraduationCap, show: isManager },
        { name: 'PT Assignments', href: '/staff/pt-assignments', icon: Dumbbell, show: isManager },
        { name: 'Exercise Library', href: '/staff/exercises', icon: Dumbbell, show: isManager },
        { name: 'Member Support', href: '/staff/member-support', icon: Inbox, show: isManager },
        // { name: 'Team Attendance', href: '/staff/team-attendance', icon: FileText, show: isManager },

        // Sales Only
        { name: 'Sales Leads', href: '/staff/enquiries', icon: TrendingUp, show: canViewLeads },

        // Receptionist Only
        { name: 'Check In / Out', href: '/staff/check-in', icon: CheckCircle2, show: isReceptionist },
        { name: 'Book Class', href: '/staff/book-class', icon: CalendarPlus, show: isReceptionist },
        { name: 'Book Appointment', href: '/staff/book-appointment', icon: ClipboardList, show: isReceptionist },
        { name: 'Register Complaint', href: '/staff/complaints', icon: MessageSquare, show: isReceptionist },
    ];

    return (
        <div
            className={clsx(
                isOpen
                    ? 'fixed inset-y-0 left-0 w-64 flex flex-col z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg'
                    : 'hidden xl:flex xl:flex-col xl:w-64 xl:fixed xl:inset-y-0',
            )}
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-lg">
                        <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">SoActiv</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Staff Portal</p>
                    </div>
                </div>

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

            <div className="flex flex-col flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigationItems.filter(i => i.show).map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={({ isActive }) =>
                            clsx(
                                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-l-4 border-orange-500 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                            )
                        }
                    >
                        <item.icon
                            className={clsx('mr-3 flex-shrink-0 h-5 w-5 transition-colors', 'group-hover:text-orange-500')}
                        />
                        {item.name}
                    </NavLink>
                ))}
            </div>

            <div className="px-4 pb-6">
                <button
                    onClick={logout}
                    className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200"
                >
                    <LogOut className="mr-3 flex-shrink-0 h-5 w-5 group-hover:text-red-500" />
                    Logout
                </button>
            </div>
        </div>
    );
};
