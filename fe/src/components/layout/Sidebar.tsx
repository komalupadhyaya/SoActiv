import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  PlusCircle,
  BarChart3,
  LogOut,
  Dumbbell,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

const navigationItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Enquiries', href: '/admin/enquiries', icon: FileText },
  { name: 'Enquiry Form', href: '/admin/enquiry-form', icon: PlusCircle },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Staff', href: '/admin/staff', icon: UserPlus },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Profile', href: '/admin/profile', icon: User },
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-500 rounded-lg">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">SoActiv</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fitness Application</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 px-4 py-6 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-l-4 border-orange-500 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )
              }
            >
              <item.icon
                className={clsx(
                  'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                  'group-hover:text-orange-500'
                )}
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
    </div>
  );
};