import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  BarChart3,
  LogOut,
  Dumbbell,
  AlertCircle,
  Bell,
  X,
  Calendar,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

const navigationItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Enquiries', href: '/admin/enquiries', icon: FileText },
  { name: 'Enquiries Expiring', href: '/admin/enquiries-expiring', icon: AlertCircle },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'PT Plans', href: '/admin/pt-plans', icon: Dumbbell },
  { name: 'PT Assignments', href: '/admin/pt-assignments', icon: Users },
  { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
  { name: 'Staff', href: '/admin/staff-page', icon: UserPlus },
  { name: 'Calendar', href: '/admin/schedule', icon: Calendar },
  { name: 'Follow-Ups', href: '/admin/follow-ups', icon: Bell },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();

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
            <p className="text-xs text-gray-500 dark:text-gray-400">Fitness Application</p>
          </div>
        </div>

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

      {/* Navigation */}
      <div className="flex flex-col flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
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

      {/* Logout */}
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