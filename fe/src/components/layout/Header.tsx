// components/layout/Header.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  LogOut,
  X,
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  activities: Notification[];
  markAsSeen: () => void;
  dateFilter: 'monthly' | 'yearly';
  setDateFilter: React.Dispatch<React.SetStateAction<'monthly' | 'yearly'>>;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen,
  activities,
  markAsSeen,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);

  const hasNewNotifications =
    activities.length > 0 && activities.some((a) => !seenNotificationIds.has(a.id));

  useEffect(() => {
    const saved = localStorage.getItem('notifications.seenIds');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSeenNotificationIds(new Set(parsed));
        }
      } catch (e) {
        console.error('Failed to load seen notifications', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications.seenIds', JSON.stringify(Array.from(seenNotificationIds)));
  }, [seenNotificationIds]);

  const toggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
    setShowCreateMenu(false);
    setShowProfileMenu(false);

    if (!isNotificationOpen && hasNewNotifications) {
      const updatedSeen = new Set(seenNotificationIds);
      activities.forEach((activity) => updatedSeen.add(activity.id));
      setSeenNotificationIds(updatedSeen);
      markAsSeen();
    }
  };

  const closeAllMenus = () => {
    setShowCreateMenu(false);
    setIsNotificationOpen(false);
    setShowProfileMenu(false);
  };

  useEffect(() => {
    if (isNotificationOpen) {
      setCurrentPage(0);
    }
  }, [isNotificationOpen]);

  const paginatedNotifications = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return activities.slice(start, end);
  }, [activities, currentPage]);

  const goToPreviousPage = () => {
    if (currentPage > 0) setCurrentPage((prev) => prev - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) setCurrentPage((prev) => prev + 1);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between py-[0.87rem] mx-auto max-w-screen-xl w-full">
        {/* Left side: Mobile Menu Toggle and Logo */}
        <div className="flex items-center space-x-2 xl:space-x-4">
          {/* Mobile Menu Toggle (only on mobile) */}
          <button
            onClick={onMobileMenuToggle}
            className="xl:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo and company name (shown only on mobile/tablet) */}
          <div className="flex items-center space-x-2 xl:hidden">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-md">
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">SoActiv</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Other action buttons only visible on large screens */}
          <div className="hidden xl:flex items-center space-x-3">
            {/* Create Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCreateMenu((prev) => !prev);
                  setShowProfileMenu(false);
                  setIsNotificationOpen(false);
                }}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Create new"
              >
                <Plus size={20} />
              </button>
              {showCreateMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <button
                    onClick={() => {
                      navigate('/admin/enquiry-form');
                      setShowCreateMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Add Enquiry
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admin/staff-form');
                      setShowCreateMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Add Staff
                  </button>
                  <button
                    onClick={() => {
                      navigate('/admin/client-form');
                      setShowCreateMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Add Client
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                navigate('/admin/calendar');
              }}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View Calendar"
            >
              <Calendar size={20} />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>

          {/* Notification Bell - always visible */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              aria-label="Open notifications"
            >
              <Bell size={18} />
              {hasNewNotifications && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            {isNotificationOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {paginatedNotifications.length === 0 ? (
                    <p className="text-sm text-orange-500 dark:text-gray-400 text-center py-4">
                      No notifications
                    </p>
                  ) : (
                    paginatedNotifications.map((activity) => (
                      <div
                        key={activity.id}
                        className={`p-3 border border-gray-200  bg-white dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${seenNotificationIds.has(activity.id)
                          ? 'bg-gray-800 dark:bg-gray-750'
                          : 'ring-1 ring-orange-200 dark:ring-orange-800 bg-orange-50 dark:bg-orange-900/20'
                          }`}
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-2 border-t border-gray-100 dark:border-gray-700 text-sm">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 0}
                      className={`p-1 rounded ${currentPage === 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                      {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages - 1}
                      className={`p-1 rounded ${currentPage === totalPages - 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                <div className="p-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setIsNotificationOpen(false)}
                    className="w-full text-center text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 py-1 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Button - always visible */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              {/* <span className="hidden sm:block text-sm font-medium">{user?.name}</span> */}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                {/* Mobile: Show all buttons inside profile dropdown except Notifications */}
                <div className="xl:hidden px-4 py-2 space-y-2">
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      setShowProfileMenu(false);
                      setIsNotificationOpen(false);
                      navigate('/admin/enquiry-form');
                    }}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Enquiry
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      setShowProfileMenu(false);
                      setIsNotificationOpen(false);
                      navigate('/admin/staff-form');
                    }}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Staff
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateMenu(false);
                      setShowProfileMenu(false);
                      setIsNotificationOpen(false);
                      navigate('/admin/client-form');
                    }}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                  >
                    <Plus size={18} className="mr-2" />
                    Add Client
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/admin/calendar');
                    }}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                  >
                    <Calendar size={18} className="mr-2" />
                    Calendar
                  </button>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon size={18} className="mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Sun size={18} className="mr-2" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>

                {/* Common Profile Links */}
                <button
                  onClick={() => {
                    navigate('/admin/profile');
                    setShowProfileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User size={16} className="inline-block mr-2" />
                  <span className="text-sm font-medium">
                    {user?.name && user.name.trim().length > 0 ? user.name : 'My Profile'}
                  </span>
                </button>

                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut size={16} className="inline-block mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {(isNotificationOpen || showProfileMenu || showCreateMenu) && (
        <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
      )}
    </header>
  );
};
