import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

export interface Announcement {
    _id: string;
    title: string;
    message: string;
    targetAudience: 'staff' | 'members' | 'admin' | 'all';
    visibleRoles: string[];
    priority: 'normal' | 'urgent';
    expiresAt: string;
    isActive: boolean;
    isPlatformWide?: boolean;
    createdAt: string;
}

export const useAnnouncement = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/announcements`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setAnnouncements(data.data);
            } else {
                // Silently fail or minimal error to avoid spamming toast on dashboard
                console.error(data.message);
            }
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createAnnouncement = async (data: Partial<Announcement>) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setAnnouncements(prev => [result.data, ...prev]);
                addToast('Announcement posted', 'success');
                return true;
            } else {
                addToast(result.message || 'Failed to post', 'error');
                return false;
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteAnnouncement = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (res.ok) {
                setAnnouncements(prev => prev.filter(a => a._id !== id));
                addToast('Announcement deleted', 'success');
                return true;
            } else {
                addToast('Failed to delete', 'error');
                return false;
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        announcements,
        loading,
        fetchAnnouncements,
        createAnnouncement,
        deleteAnnouncement
    };
};
