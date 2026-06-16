/**
 * Notifications API
 * All requests are authenticated via cookies + Bearer token (same as staffApi pattern)
 */
import axios from 'axios';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

const notifApi = axios.create({
    baseURL: `${API_URL}/notifications`,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// Inject JWT token on every request
notifApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-redirect on 401
notifApi.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AppNotification {
    _id: string;
    recipientId: string;
    recipientRole: string;
    gymId?: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationsResponse {
    success: boolean;
    data: {
        notifications: AppNotification[];
        unreadCount: number;
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Fetch paginated notifications for the authenticated user */
export const fetchNotifications = async (
    page = 0,
    limit = 15
): Promise<NotificationsResponse['data']> => {
    const res = await notifApi.get<NotificationsResponse>(
        `/?page=${page}&limit=${limit}`
    );
    return res.data.data;
};

/** Mark a single notification as read */
export const markOneRead = async (id: string): Promise<void> => {
    await notifApi.patch(`/${id}/read`);
};

/** Mark all notifications as read */
export const markAllRead = async (): Promise<void> => {
    await notifApi.patch('/read-all');
};

/** Delete a single notification */
export const deleteOneNotification = async (id: string): Promise<void> => {
    await notifApi.delete(`/${id}`);
};

/** Clear all notifications */
export const clearNotifications = async (): Promise<void> => {
    await notifApi.delete('/');
};

export default notifApi;
