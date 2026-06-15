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
  CheckCheck,
  Trash2,
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../ui/Avatar';
import { useNotifications } from '../../hooks/useNotifications';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  // Legacy props kept for backwards compatibility — no longer used internally
  activities?: any[];
  markAsSeen?: () => void;
  dateFilter?: 'monthly' | 'yearly';
  setDateFilter?: React.Dispatch<React.SetStateAction<'monthly' | 'yearly'>>;
}

export const Header: React.FC<HeaderProps> = ({
  onMobileMenuToggle,
  isMobileMenuOpen,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const { notifications, unreadCount, markRead, markAllAsRead, clearAll, deleteOne } = useNotifications();

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);

  const hasNewNotifications = unreadCount > 0;

  useEffect(() => {
    if (isNotificationOpen) setCurrentPage(0);
  }, [isNotificationOpen]);

  const toggleNotifications = () => {
    setIsNotificationOpen((prev) => !prev);
    setShowCreateMenu(false);
    setShowProfileMenu(false);
  };

  const closeAllMenus = () => {
    setShowCreateMenu(false);
    setIsNotificationOpen(false);
    setShowProfileMenu(false);
  };

  const paginatedNotifications = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return notifications.slice(start, end);
  }, [notifications, currentPage]);

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
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isNotificationOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline">
                        <CheckCheck size={13} /> Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline">
                        <Trash2 size={13} /> Clear all
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {paginatedNotifications.length === 0 ? (
                    <p className="text-sm text-orange-500 dark:text-gray-400 text-center py-4">
                      No notifications
                    </p>
                  ) : (
                    paginatedNotifications.map((notif) => (
                      <div key={notif._id} className="relative group w-full">
                        <button
                          onClick={() => {
                            markRead(notif._id);
                            if (notif.link) {
                              const targetId = notif.metadata?.followUpId ||
                                               notif.metadata?.staffId ||
                                               notif.metadata?.clientId ||
                                               notif.metadata?.enquiryId;
                              const targetLink = targetId && !notif.link.includes('id=')
                                ? `${notif.link}${notif.link.includes('?') ? '&' : '?'}id=${targetId}`
                                : notif.link;
                              navigate(targetLink);
                            }
                            setIsNotificationOpen(false);
                          }}
                          className={`w-full text-left p-3 pr-10 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            notif.isRead
                              ? 'bg-white dark:bg-gray-800'
                              : 'ring-1 ring-orange-200 dark:ring-orange-800 bg-orange-50 dark:bg-orange-900/20'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notif.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOne(notif._id);
                          }}
                          className="absolute right-2 top-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          aria-label="Delete notification"
                          title="Delete notification"
                        >
                          <Trash2 size={14} />
                        </button>
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
              <Avatar
                src={user?.avatar}
                name={user?.name || 'User'}
                userId={user?.id}
                size="md"
                forceInitials={true}
                customColors={user?.avatarSettings}
              />
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
