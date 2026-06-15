import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchNotifications,
    markOneRead,
    markAllRead,
    clearNotifications,
    deleteOneNotification,
    type AppNotification,
} from '../api/notifications.api';

const POLL_INTERVAL_MS = 60_000; // Poll every 60 seconds

interface UseNotificationsReturn {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    markRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    deleteOne: (id: string) => Promise<void>;
    refresh: () => void;
}

/**
 * useNotifications
 *
 * Shared hook used by Admin (Header), Staff (StaffTopbar), Member (MemberTopbar),
 * and SuperAdmin (SuperAdminHeader).
 *
 * - Fetches first page of notifications on mount
 * - Polls every 60 seconds in the background
 * - Exposes read / clear helpers
 */
export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEnabled, setIsEnabled] = useState(
        localStorage.getItem('notificationsEnabled') !== 'false'
    );
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const load = useCallback(async (silent = false) => {
        const isNotificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
        if (!isNotificationsEnabled) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const data = await fetchNotifications(0, 20);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err: any) {
            // Silently ignore 401 (not logged in); surface other errors
            if (err?.response?.status !== 401) {
                setError('Could not load notifications');
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    // Listen to changes in notificationsEnabled setting
    useEffect(() => {
        const handleToggle = () => {
            const state = localStorage.getItem('notificationsEnabled') !== 'false';
            setIsEnabled(state);
            if (!state) {
                setNotifications([]);
                setUnreadCount(0);
            } else {
                load();
            }
        };

        window.addEventListener('storage', handleToggle);
        window.addEventListener('notifications-toggle', handleToggle);
        return () => {
            window.removeEventListener('storage', handleToggle);
            window.removeEventListener('notifications-toggle', handleToggle);
        };
    }, [load]);

    // Initial load + polling
    useEffect(() => {
        if (!isEnabled) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        load();
        intervalRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [load, isEnabled]);

    // Mark one notification as read (optimistic update)
    const markRead = useCallback(async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        try {
            await markOneRead(id);
        } catch {
            // Revert on failure — re-fetch for accuracy
            load(true);
        }
    }, [load]);

    // Mark all as read (optimistic update)
    const markAllAsRead = useCallback(async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await markAllRead();
        } catch {
            load(true);
        }
    }, [load]);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        setNotifications([]);
        setUnreadCount(0);
        try {
            await clearNotifications();
        } catch {
            load(true);
        }
    }, [load]);

    // Delete one notification (optimistic update)
    const deleteOne = useCallback(async (id: string) => {
        const notifToDelete = notifications.find((n) => n._id === id);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (notifToDelete && !notifToDelete.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        try {
            await deleteOneNotification(id);
        } catch {
            load(true);
        }
    }, [notifications, load]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        markRead,
        markAllAsRead,
        clearAll,
        deleteOne,
        refresh: () => load(),
    };
}
