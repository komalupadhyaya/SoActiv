import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

export interface Schedule {
    _id: string;
    title: string;
    description?: string;
    scheduledDate: string;
    scheduledTime: string;
    status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
    createdBy: {
        _id: string;
        fullname: string;
        email: string;
    };
    assignedTo?: Array<{
        _id: string;
        fullName: string;
        position: string;
        email: string;
    }>;
    startTime?: string;
    endTime?: string;
    roleScope: string[];
    type: 'followup' | 'member-session' | 'class' | 'task' | 'self-reminder' | 'member-checkin' | 'pt_expiry' | 'membership_expiry' | 'admin_task' | 'manager_task' | 'holiday';
    holidayType?: 'full_day' | 'first_half' | 'second_half';
    startDate?: string;
    endDate?: string;
    isEditable: boolean;
    relatedFollowUp?: string;
    relatedMember?: {
        _id: string;
        fullName: string;
        email: string;
    };
    completedAt?: string | null;
    completedBy?: {
        _id: string;
        fullName: string;
    };
    completionNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export const useSchedule = () => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    // Fetch all schedules (with RBAC filtering on backend)
    const fetchSchedules = useCallback(async (filters?: {
        status?: string;
        type?: string;
        date?: string;
        filter?: 'today' | 'upcoming';
    }) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters?.status) queryParams.append('status', filters.status);
            if (filters?.type) queryParams.append('type', filters.type);
            if (filters?.date) queryParams.append('date', filters.date);
            if (filters?.filter) queryParams.append('filter', filters.filter);

            const res = await fetch(`${API_URL}/schedule?${queryParams.toString()}`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSchedules(data.data);
                return { success: true, data: data.data };
            } else {
                const msg = data.message || 'Failed to fetch schedules';
                setError(msg);
                addToast(msg, 'error');
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            const msg = err.message || 'Network error';
            setError(msg);
            addToast(msg, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    // Fetch my schedule (staff-specific)
    const fetchMySchedule = useCallback(async (filters?: {
        status?: string;
        type?: string;
        filter?: 'today' | 'upcoming';
    }) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters?.status) queryParams.append('status', filters.status);
            if (filters?.type) queryParams.append('type', filters.type);
            if (filters?.filter) queryParams.append('filter', filters.filter);

            const res = await fetch(`${API_URL}/schedule/my-schedule?${queryParams.toString()}`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSchedules(data.data);
                return { success: true, data: data.data };
            } else {
                const msg = data.message || 'Failed to fetch my schedule';
                setError(msg);
                addToast(msg, 'error');
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            const msg = err.message || 'Network error';
            setError(msg);
            addToast(msg, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    // Create schedule event
    const createScheduleEvent = async (scheduleData: {
        title: string;
        description?: string;
        scheduledDate: string;
        scheduledTime: string;
        startTime?: string;
        endTime?: string;
        assignedTo?: string | string[];
        type: string;
        roleScope?: string[];
        relatedMember?: string;
        isEditable?: boolean;
    }) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scheduleData),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSchedules((prev) => [data.data, ...prev]);
                addToast('Schedule event created successfully', 'success');
                return { success: true, data: data.data };
            } else {
                const msg = data.message || 'Failed to create schedule event';
                setError(msg);
                addToast(msg, 'error');
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            const msg = err.message || 'Network error';
            setError(msg);
            addToast(msg, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Update schedule event
    const updateScheduleEvent = async (id: string, updates: Partial<Schedule> | { assignedTo?: string | string[]; startTime?: string; endTime?: string; scheduledTime?: string;[key: string]: any }) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/schedule/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSchedules((prev) => prev.map((s) => (s._id === id ? data.data : s)));
                addToast('Schedule event updated successfully', 'success');
                return { success: true, data: data.data };
            } else {
                const msg = data.message || 'Failed to update schedule event';
                setError(msg);
                addToast(msg, 'error');
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            const msg = err.message || 'Network error';
            setError(msg);
            addToast(msg, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Complete schedule event
    const completeScheduleEvent = async (id: string, completionNotes?: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/schedule/${id}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completionNotes }),
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSchedules((prev) => prev.map((s) => (s._id === id ? data.data : s)));
                addToast('Schedule event marked as completed', 'success');
                return { success: true, data: data.data };
            } else {
                const msg = data.message || 'Failed to complete schedule event';
                setError(msg);
                addToast(msg, 'error');
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            const msg = err.message || 'Network error';
            setError(msg);
            addToast(msg, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Delete schedule event
    const deleteScheduleEvent = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/schedule/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSchedules((prev) => prev.filter((s) => s._id !== id));
                addToast('Schedule event deleted successfully', 'success');
                return { success: true };
            } else {
                const msg = data.message || 'Failed to delete schedule event';
                setError(msg);
                addToast(msg, 'error');
                return { success: false, message: data.message };
            }
        } catch (err: any) {
            const msg = err.message || 'Network error';
            setError(msg);
            addToast(msg, 'error');
            return { success: false, message: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Check for holiday
    const checkHoliday = async (date: string) => {
        try {
            const res = await fetch(`${API_URL}/schedule/holiday-check?date=${date}`, {
                credentials: 'include',
            });
            const data = await res.json();
            return data;
        } catch (err) {
            console.error('Check holiday error:', err);
            return { hasHoliday: false };
        }
    };

    return {
        schedules,
        loading,
        error,
        fetchSchedules,
        fetchMySchedule,
        createScheduleEvent,
        updateScheduleEvent,
        completeScheduleEvent,
        deleteScheduleEvent,
        checkHoliday
    };
};
