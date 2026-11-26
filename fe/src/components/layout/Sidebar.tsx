import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  BarChart3,
  LogOut,
  Dumbbell,
  X,
  ChevronRight,
  Settings,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';

const navigationItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Enquiries', href: '/admin/enquiries', icon: FileText },
  { name: 'Clients', href: '/admin/clients', icon: Users },
  { name: 'Staff', href: '/admin/staff', icon: UserPlus },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Service Management', href: '/admin/services', icon: Settings },
  { name: 'Extra', href: '#', icon: Layers },
];

const extraRoutes = [
  '/admin/enquiries-expiring',
  '/admin/staff-attendance',
  '/admin/attendance',
  '/admin/classes',
  '/admin/pt-plans',
  '/admin/pt-assignments',
  '/admin/pt-expiring',
  '/admin/follow-ups',
  '/admin/exercises',
  '/admin/exercise-library',
  '/admin/cleaning',
  '/admin/announcements',
  '/admin/contact-support',
  '/admin/member-support',
  '/admin/support-inbox',
  '/admin/calendar',
  '/admin/schedule',
  '/admin/biometric',
  '/admin/biometric-management',
];

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isClientSegmentsOpen?: boolean;
  onToggleClientSegments?: () => void;
  isReportsSidebarOpen?: boolean;
  onToggleReportsSidebar?: () => void;
  isExtraSidebarOpen?: boolean;
  onToggleExtraSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  isClientSegmentsOpen = false,
  onToggleClientSegments,
  isReportsSidebarOpen = false,
  onToggleReportsSidebar,
  isExtraSidebarOpen = false,
  onToggleExtraSidebar,
}) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const isTrainer = user?.role === 'trainer';
  const filteredItems = isTrainer
    ? navigationItems.filter(item => item.name === 'Clients' || item.name === 'Extra')
    : navigationItems;

  const isExtraRouteActive = extraRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 xl:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-24' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'
        )}
      >
        {/* Header */}
        <div className={clsx('flex items-center justify-between h-16 border-b border-gray-200 dark:border-gray-700', isCollapsed ? 'px-3 justify-center' : 'px-6')}>
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md">
              <Dumbbell className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                SoActiv
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {onClose && (
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
          {filteredItems.map((item) => {
            const isClientsItem = item.name === 'Clients';
            const isReportsItem = item.name === 'Reports';
            const isExtraItem = item.name === 'Extra';
            const isClientsRouteActive = isClientsItem && location.pathname.startsWith('/admin/clients');
            const isReportsRouteActive = isReportsItem && location.pathname.startsWith('/admin/reports');

            return (
              <NavLink
                key={item.name}
                to={isClientsItem || isReportsItem || isExtraItem ? '#' : item.href}
                data-nav-item={item.name}
                onClick={(e) => {
                  if (isClientsItem) {
                    e.preventDefault();
                    if (onToggleClientSegments) onToggleClientSegments();
                    return;
                  }
                  if (isReportsItem) {
                    e.preventDefault();
                    if (onToggleReportsSidebar) onToggleReportsSidebar();
                    return;
                  }
                  if (isExtraItem) {
                    e.preventDefault();
                    if (onToggleExtraSidebar) onToggleExtraSidebar();
                    return;
                  }
                  if (onClose) onClose();
                }}
                title={item.name}
                className={({ isActive }) => {
                  const isItemActive = isClientsItem
                    ? isClientsRouteActive
                    : isReportsItem
                    ? isReportsRouteActive || isReportsSidebarOpen
                    : isExtraItem
                    ? isExtraRouteActive || isExtraSidebarOpen
                    : isActive;
                  return clsx(
                    'group relative flex font-medium rounded-lg transition-all duration-200',
                    isCollapsed
                      ? 'flex-col items-center justify-center py-2 px-1 text-center'
                      : 'flex-row items-center px-3 py-2.5 text-sm',
                    isItemActive
                      ? isCollapsed
                        ? 'bg-orange-50 dark:bg-orange-950/60 text-red-600 dark:text-red-400 font-semibold'
                        : 'bg-orange-50 dark:bg-orange-950 text-red-600 dark:text-red-400 border-l-4 border-red-500 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  );
                }}
              >
                <item.icon
                  className={clsx(
                    'flex-shrink-0 transition-colors',
                    isCollapsed ? 'h-5 w-5' : 'h-5 w-5 mr-3',
                    isClientsItem
                      ? (isClientsRouteActive ? 'text-red-500' : 'group-hover:text-orange-500')
                      : isReportsItem
                      ? (isReportsRouteActive || isReportsSidebarOpen ? 'text-red-500' : 'group-hover:text-orange-500')
                      : isExtraItem
                      ? (isExtraRouteActive || isExtraSidebarOpen ? 'text-red-500' : 'group-hover:text-orange-500')
                      : 'group-hover:text-orange-500'
                  )}
                />
                <span
                  className={clsx(
                    'transition-all duration-300',
                    isCollapsed
                      ? 'text-[11px] font-medium text-center w-full mt-1 leading-tight px-0.5 break-words line-clamp-2'
                      : 'text-sm font-medium truncate',
                    isClientsItem
                      ? (isClientsRouteActive && 'text-red-500')
                      : isReportsItem
                      ? ((isReportsRouteActive || isReportsSidebarOpen) && 'text-red-500')
                      : isExtraItem
                      ? ((isExtraRouteActive || isExtraSidebarOpen) && 'text-red-500')
                      : ''
                  )}
                >
                  {item.name}
                </span>

                {/* Chevron Right indicator for modules with flyouts (Clients, Reports, Extra) */}
                {(isClientsItem || isReportsItem || isExtraItem) && (
                  <ChevronRight
                    size={isCollapsed ? 13 : 15}
                    className={clsx(
                      'transition-all duration-200',
                      isCollapsed
                        ? 'absolute right-1 top-1/2 -translate-y-1/2'
                        : 'ml-auto flex-shrink-0',
                      (isClientsItem && (isClientsRouteActive || isClientSegmentsOpen)) ||
                      (isReportsItem && (isReportsRouteActive || isReportsSidebarOpen)) ||
                      (isExtraItem && (isExtraRouteActive || isExtraSidebarOpen))
                        ? 'text-red-500 font-bold'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-orange-500'
                    )}
                  />
                )}
              </NavLink>
            );
          })}
        </div>

      {/* Logout */}
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
                ? 'text-[11px] font-medium text-center w-full mt-1 leading-tight px-0.5'
                : 'text-sm font-medium truncate'
            )}
          >
            Logout
          </span>
        </button>
      </div>
    </div>
    </>
  );
};