import React, { useState, useEffect, useMemo } from 'react';
import {
    Menu,
    Sun,
    Moon,
    Bell,
    User,
    LogOut,
    X,
    CheckCheck,
    Trash2,
} from 'lucide-react';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useClient } from '../../hooks/useClient';
import { useClientAttendance } from '../../hooks/useClientAttendance';
import { useSchedule } from '../../hooks/useSchedule';

interface MemberTopbarProps {
    onMobileMenuToggle: () => void;
    isMobileMenuOpen: boolean;
}

export const MemberTopbar: React.FC<MemberTopbarProps> = ({
    onMobileMenuToggle,
    isMobileMenuOpen,
}) => {
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);

    const { notifications, unreadCount, markRead, markAllAsRead, clearAll, deleteOne } = useNotifications();
    const { clients, fetchClients } = useClient();
    const { records: attendanceRecords } = useClientAttendance();
    const { schedules, fetchSchedules } = useSchedule();
    const [expiryRead, setExpiryRead] = useState(false);
    const [absenceRead, setAbsenceRead] = useState(false);
    const [isEnabled, setIsEnabled] = useState(
        localStorage.getItem('notificationsEnabled') !== 'false'
    );

    // Listen to changes in notificationsEnabled setting
    useEffect(() => {
        const handleToggle = () => {
            setIsEnabled(localStorage.getItem('notificationsEnabled') !== 'false');
        };

        window.addEventListener('storage', handleToggle);
        window.addEventListener('notifications-toggle', handleToggle);
        return () => {
            window.removeEventListener('storage', handleToggle);
            window.removeEventListener('notifications-toggle', handleToggle);
        };
    }, []);

    useEffect(() => {
        fetchClients();
        fetchSchedules({ type: 'holiday' });
    }, [fetchClients, fetchSchedules]);

    // Find current member's client record
    const memberClient = useMemo(() => {
        return clients.find(
            (c) =>
                c.email?.toLowerCase() === user?.email?.toLowerCase() ||
                c.userId === user?.id ||
                c.userId === user?._id
        );
    }, [clients, user]);

    // Calculate days remaining
    const daysRemaining = useMemo(() => {
        if (!memberClient) return null;
        return memberClient.remainingDays ?? memberClient.endDate
            ? Math.max(0, Math.ceil((new Date(memberClient.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
            : null;
    }, [memberClient]);

    // Check if virtual plan expiry notification has been read/dismissed
    useEffect(() => {
        if (memberClient?.endDate) {
            const isRead = localStorage.getItem(`plan_expiry_read_${memberClient.endDate}`) === 'true';
            setExpiryRead(isRead);
        }
    }, [memberClient?.endDate]);

    // Find the most recent check-in date to key the localStorage read state
    const latestCheckInDate = useMemo(() => {
        const presentRecords = attendanceRecords
            .filter(r => r.status === 'present')
            .map(r => new Date(r.date).getTime());
        if (presentRecords.length === 0) return memberClient?.startDate || '';
        return new Date(Math.max(...presentRecords)).toISOString().split('T')[0];
    }, [attendanceRecords, memberClient]);

    useEffect(() => {
        if (latestCheckInDate) {
            const isRead = localStorage.getItem(`absent_notification_read_${latestCheckInDate}`) === 'true';
            setAbsenceRead(isRead);
        }
    }, [latestCheckInDate]);

    // Calculate if member has been absent for the last 2 completed non-rest days
    const isAbsentForTwoDays = useMemo(() => {
        // Helper to check if a date is a Sunday or a scheduled holiday
        const isRestDay = (date: Date) => {
            if (date.getDay() === 0) return true; // Sunday is a rest day

            return schedules.some((s) => {
                if (s.type !== 'holiday') return false;

                const hDate = new Date(s.scheduledDate);
                const isSameDay =
                    hDate.getFullYear() === date.getFullYear() &&
                    hDate.getMonth() === date.getMonth() &&
                    date.getDate() === hDate.getDate();
                if (isSameDay) return true;

                if (s.startDate && s.endDate) {
                    const dTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                    const sTime = new Date(new Date(s.startDate).getFullYear(), new Date(s.startDate).getMonth(), new Date(s.startDate).getDate()).getTime();
                    const eTime = new Date(new Date(s.endDate).getFullYear(), new Date(s.endDate).getMonth(), new Date(s.endDate).getDate()).getTime();
                    return dTime >= sTime && dTime <= eTime;
                }
                return false;
            });
        };

        if (attendanceRecords.length === 0 && memberClient?.startDate) {
            // If they have never checked in, check if they signed up >= 2 non-rest days ago
            const today = new Date();
            const start = new Date(memberClient.startDate);
            let nonRestDaysCount = 0;
            let current = new Date(start);
            while (current < today) {
                if (!isRestDay(current)) {
                    nonRestDaysCount++;
                }
                current.setDate(current.getDate() + 1);
            }
            return nonRestDaysCount >= 2;
        }

        // Get the last 2 completed non-rest days
        const getPreviousNonRestDays = (count: number) => {
            const result: Date[] = [];
            let current = new Date();
            // Start checking from yesterday
            current.setDate(current.getDate() - 1);

            while (result.length < count) {
                if (!isRestDay(current)) {
                    result.push(new Date(current));
                }
                current.setDate(current.getDate() - 1);
            }
            return result;
        };

        const lastTwoNonRestDays = getPreviousNonRestDays(2);
        const yesterdayNonRest = lastTwoNonRestDays[0];
        const dayBeforeNonRest = lastTwoNonRestDays[1];

        // Helper to check present check-in on a date
        const hasCheckedInOnDate = (date: Date) => {
            return attendanceRecords.some((record) => {
                const d = new Date(record.date);
                return (
                    d.getFullYear() === date.getFullYear() &&
                    d.getMonth() === date.getMonth() &&
                    d.getDate() === date.getDate() &&
                    record.status === 'present'
                );
            });
        };

        const isAbsentYesterday = !hasCheckedInOnDate(yesterdayNonRest);
        const isAbsentDayBefore = !hasCheckedInOnDate(dayBeforeNonRest);

        // Check if membership started before or on the day before the first non-rest day we check
        const membershipStarted = memberClient?.startDate
            ? new Date(memberClient.startDate) <= dayBeforeNonRest
            : false;

        return membershipStarted && isAbsentYesterday && isAbsentDayBefore;
    }, [attendanceRecords, memberClient, schedules]);

    const virtualAbsenceNotif = useMemo(() => {
        if (isAbsentForTwoDays && !absenceRead && isEnabled) {
            const now = new Date().toISOString();
            return {
                _id: 'virtual-absent-reminder',
                recipientId: user?.id || user?._id || '',
                recipientRole: 'member',
                type: 'absent_reminder',
                title: 'We Miss You!',
                message: 'Your fitness journey is waiting for you 🔥 Get back on track today and continue your progress.',
                isRead: false,
                createdAt: now,
                updatedAt: now,
                link: '/member/dashboard',
            };
        }
        return null;
    }, [isAbsentForTwoDays, absenceRead, isEnabled, user]);

    // Inject dynamic/virtual notifications if plan is expiring in <= 7 days and notifications are enabled
    const displayNotifications = useMemo(() => {
        let list = [...notifications];

        // 1. Expiry Notification
        if (
            isEnabled &&
            daysRemaining !== null &&
            daysRemaining <= 7 &&
            memberClient &&
            !expiryRead
        ) {
            const virtualExpiryNotif = {
                _id: 'virtual-plan-expiry',
                recipientId: user?.id || user?._id || '',
                recipientRole: 'member',
                type: 'member_expiring',
                title: 'Membership Expiring Soon!',
                message: `Your ${memberClient.plan ? memberClient.plan.charAt(0).toUpperCase() + memberClient.plan.slice(1) : 'Premium'} plan expires in ${daysRemaining} day(s) on ${new Date(memberClient.endDate).toLocaleDateString('en-IN')}. Please renew to prevent interruption.`,
                isRead: false,
                createdAt: memberClient.endDate,
                updatedAt: memberClient.endDate,
                link: '/member/payments',
            };
            list.unshift(virtualExpiryNotif);
        }

        // 2. Absence Notification
        if (virtualAbsenceNotif) {
            list.unshift(virtualAbsenceNotif);
        }

        return list;
    }, [notifications, daysRemaining, memberClient, expiryRead, virtualAbsenceNotif, isEnabled, user]);

    const displayUnreadCount = useMemo(() => {
        let count = unreadCount;

        if (
            isEnabled &&
            daysRemaining !== null &&
            daysRemaining <= 7 &&
            memberClient &&
            !expiryRead
        ) {
            count += 1;
        }

        if (virtualAbsenceNotif) {
            count += 1;
        }

        return count;
    }, [unreadCount, daysRemaining, memberClient, expiryRead, virtualAbsenceNotif, isEnabled]);

    const handleMarkRead = async (id: string) => {
        if (id === 'virtual-plan-expiry') {
            if (memberClient?.endDate) {
                localStorage.setItem(`plan_expiry_read_${memberClient.endDate}`, 'true');
                setExpiryRead(true);
            }
        } else if (id === 'virtual-absent-reminder') {
            if (latestCheckInDate) {
                localStorage.setItem(`absent_notification_read_${latestCheckInDate}`, 'true');
                setAbsenceRead(true);
            }
        } else {
            await markRead(id);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (memberClient?.endDate) {
            localStorage.setItem(`plan_expiry_read_${memberClient.endDate}`, 'true');
            setExpiryRead(true);
        }
        if (latestCheckInDate) {
            localStorage.setItem(`absent_notification_read_${latestCheckInDate}`, 'true');
            setAbsenceRead(true);
        }
        await markAllAsRead();
    };

    const handleDeleteOne = async (id: string) => {
        if (id === 'virtual-plan-expiry') {
            if (memberClient?.endDate) {
                localStorage.setItem(`plan_expiry_read_${memberClient.endDate}`, 'true');
                setExpiryRead(true);
            }
        } else if (id === 'virtual-absent-reminder') {
            if (latestCheckInDate) {
                localStorage.setItem(`absent_notification_read_${latestCheckInDate}`, 'true');
                setAbsenceRead(true);
            }
        } else {
            await deleteOne(id);
        }
    };

    const toggleNotifications = () => {
        setIsNotificationOpen((prev) => !prev);
        setShowProfileMenu(false);
    };

    const closeAllMenus = () => {
        setIsNotificationOpen(false);
        setShowProfileMenu(false);
    };

    const handleProfileClick = () => {
        setShowProfileMenu(false);
        navigate('/member/profile');
    };

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between py-[0.87rem] mx-auto w-full px-4 xl:px-6">
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
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden sm:block"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    {/* Notification Bell - always visible */}
                    <div className="relative">
                        <button
                            onClick={toggleNotifications}
                            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                            aria-label="Open notifications"
                        >
                            <Bell size={18} />
                            {displayUnreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full">
                                    {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
                                </span>
                            )}
                        </button>
                        {isNotificationOpen && (
                            <div
                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Notifications
                                        {displayUnreadCount > 0 && (
                                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                                                {displayUnreadCount} new
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {displayUnreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline"
                                            >
                                                <CheckCheck size={13} />
                                                Mark read
                                            </button>
                                        )}
                                        {displayNotifications.length > 0 && (
                                            <button
                                                onClick={clearAll}
                                                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                                            >
                                                <Trash2 size={13} />
                                                Clear all
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="overflow-y-auto max-h-72 p-2 space-y-1">
                                    {displayNotifications.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                                            No new notifications
                                        </p>
                                    ) : (
                                        displayNotifications.map((notif) => (
                                            <div key={notif._id} className="relative group w-full">
                                                <button
                                                    onClick={() => {
                                                        handleMarkRead(notif._id);
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
                                                    className={`w-full text-left p-3 pr-10 rounded-lg transition-colors ${
                                                        notif.isRead
                                                            ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-white dark:bg-gray-800'
                                                            : 'bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800'
                                                    }`}
                                                >
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{notif.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(notif.createdAt).toLocaleString('en-IN', {
                                                            day: '2-digit', month: 'short',
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </p>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteOne(notif._id);
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
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-xs font-bold">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                                </span>
                            </div>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                {/* Mobile: Show Theme Toggle inside menu */}
                                <div className="sm:hidden px-4 py-2 border-b border-gray-200 dark:border-gray-700">
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

                                {/* Profile Link */}
                                <button
                                    onClick={handleProfileClick}
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
            {(isNotificationOpen || showProfileMenu) && (
                <div className="fixed inset-0 z-40" onClick={closeAllMenus} />
            )}
        </header>
    );
};
