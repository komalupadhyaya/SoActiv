import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ISupportMessage {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    gymId?: { _id: string; name: string } | string;
    category: 'sales' | 'support' | 'billing' | 'feature_request' | 'other';
    message: string;
    source: 'public' | 'admin';
    status: 'new' | 'read' | 'closed';
    createdAt: string;
}

export const useSupport = () => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ISupportMessage[]>([]);
    const [stats, setStats] = useState({ unreadCount: 0 });
    const { addToast } = useToast();

    const sendSupportMessage = async (data: {
        name: string;
        email: string;
        phone?: string;
        category: string;
        message: string;
        gymId?: string;
    }) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/contact`, data, { withCredentials: true });
            if (res.data.success) {
                addToast('Message sent to our support team!', 'success');
                return true;
            }
            return false;
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to send message', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const fetchSupportMessages = useCallback(async (filters: { status?: string; category?: string; page?: number } = {}) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/contact/superadmin/list`, {
                params: filters,
                withCredentials: true
            });
            if (res.data.success) {
                setMessages(res.data.data);
                return res.data;
            }
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to fetch messages', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    const updateSupportStatus = async (id: string, status: string) => {
        setLoading(true);
        try {
            const res = await axios.patch(`${API_URL}/contact/superadmin/${id}/status`, { status }, { withCredentials: true });
            if (res.data.success) {
                addToast(`Message marked as ${status}`, 'success');
                setMessages((prev: ISupportMessage[]) => prev.map(m => m._id === id ? { ...m, status } as ISupportMessage : m));
                return true;
            }
        } catch (error: any) {
            addToast(error.response?.data?.message || 'Failed to update status', 'error');
        } finally {
            setLoading(false);
        }
        return false;
    };

    const fetchSupportStats = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/contact/superadmin/stats`, { withCredentials: true });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch support stats:', error);
        }
    }, []);

    return {
        loading,
        messages,
        stats,
        sendSupportMessage,
        fetchSupportMessages,
        updateSupportStatus,
        fetchSupportStats
    };
};
