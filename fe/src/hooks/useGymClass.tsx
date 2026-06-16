import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GymClass {
    _id: string;
    adminId: string;
    gymId: string;
    name: string;
    description?: string;
    notes?: string;
    trainerId?: {
        _id: string;
        fullName: string;
        position: string;
        email: string;
        avatar?: string;
    };
    trainerUserId?: string;
    capacity: number;
    durationMinutes: number;
    time: string;
    color: string;
    recurrence: {
        type: 'none' | 'weekly';
        days: number[];
    };
    status: 'active' | 'inactive' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}

export interface ClassSession {
    _id: string;
    classId: GymClass | string;
    adminId: string;
    gymId: string;
    trainerId?: {
        _id: string;
        fullName: string;
        email: string;
        avatar?: string;
    };
    trainerUserId?: string;
    date: string;
    time: string;
    endTime: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    capacity: number;
    bookedCount: number;
    notes?: string;
    cancelReason?: string;
    cancelledAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClassBooking {
    _id: string;
    sessionId: ClassSession | string;
    classId: GymClass | string;
    memberId: {
        _id: string;
        fullName: string;
        email: string;
        contactNumber: string;
    };
    userId: {
        _id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    status: 'booked' | 'cancelled' | 'attended' | 'no_show' | 'checked_in';
    bookedAt: string;
    cancelledAt?: string;
    checkInAt?: string;
    createdAt: string;
}

export interface ClassAttendanceRecord {
    _id: string;
    sessionId: string;
    memberId: {
        _id: string;
        fullName: string;
        email: string;
    };
    userId: string;
    status: 'present' | 'absent';
    markedBy: string;
    markedAt: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useGymClass = () => {
    const [classes, setClasses] = useState<GymClass[]>([]);
    const [sessions, setSessions] = useState<ClassSession[]>([]);
    const [bookings, setBookings] = useState<ClassBooking[]>([]);
    const [attendance, setAttendance] = useState<ClassAttendanceRecord[]>([]);
    const [sessionBookings, setSessionBookings] = useState<ClassBooking[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    const handleError = (err: any, fallback = 'Something went wrong') => {
        const msg = err?.message || fallback;
        setError(msg);
        addToast(msg, 'error');
        return { success: false as const, message: msg };
    };

    // ─── Classes ──────────────────────────────────────────────────────────────

    const fetchClasses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/classes`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(data.data);
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createClass = async (payload: {
        name: string;
        description?: string;
        notes?: string;
        trainerId?: string;
        capacity: number;
        durationMinutes: number;
        time: string;
        color?: string;
        recurrence?: { type: 'none' | 'weekly'; days: number[] };
    }) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/classes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(prev => [data.data, ...prev]);
                addToast('Class created successfully 🎉', 'success');
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const updateClass = async (id: string, payload: Partial<GymClass>) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/classes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(prev => prev.map(c => c._id === id ? data.data : c));
                addToast('Class updated successfully', 'success');
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const deleteClass = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/classes/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setClasses(prev => prev.filter(c => c._id !== id));
                addToast('Class cancelled', 'success');
                return { success: true };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Sessions ─────────────────────────────────────────────────────────────

    const generateSessions = async (classId: string, startDate: string, endDate: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-sessions/generate/${classId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate, endDate }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast(data.message || 'Sessions generated successfully', 'success');
                return { success: true, data: data.data, count: data.data.length };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionsByClass = useCallback(async (classId: string, filters?: { from?: string; to?: string; status?: string }) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (filters?.from) q.append('from', filters.from);
            if (filters?.to) q.append('to', filters.to);
            if (filters?.status) q.append('status', filters.status);
            const res = await fetch(`${API_URL}/class-sessions/by-class/${classId}?${q}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessions(data.data);
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchUpcomingSessions = useCallback(async (classId?: string, days = 30) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (classId) q.append('classId', classId);
            q.append('days', String(days));
            const res = await fetch(`${API_URL}/class-sessions/upcoming?${q}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessions(data.data);
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelSession = async (sessionId: string, cancelReason?: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-sessions/${sessionId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelReason }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, status: 'cancelled' } : s));
                addToast('Session cancelled. Members notified.', 'success');
                return { success: true };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const updateSessionNotes = async (sessionId: string, notes: string) => {
        try {
            const res = await fetch(`${API_URL}/class-sessions/${sessionId}/notes`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, notes } : s));
                addToast('Notes saved', 'success');
                return { success: true };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        }
    };

    // ─── Bookings ─────────────────────────────────────────────────────────────

    const bookSession = async (sessionId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast('Slot booked! 🎉', 'success');
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyBookings = useCallback(async (filters?: { status?: string; upcoming?: boolean }) => {
        setLoading(true);
        setError(null);
        try {
            const q = new URLSearchParams();
            if (filters?.status) q.append('status', filters.status);
            if (filters?.upcoming) q.append('upcoming', 'true');
            const res = await fetch(`${API_URL}/class-bookings/my-bookings?${q}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setBookings(data.data);
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelBooking = async (bookingId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
                addToast('Booking cancelled', 'success');
                return { success: true };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const selfCheckIn = async (bookingId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-bookings/${bookingId}/check-in`, {
                method: 'PATCH',
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'checked_in' } : b));
                addToast('Checked in successfully! ✅', 'success');
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionBookings = useCallback(async (sessionId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-bookings/session/${sessionId}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setSessionBookings(data.data);
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Attendance ───────────────────────────────────────────────────────────

    const markAttendance = async (sessionId: string, records: { memberId: string; userId: string; status: 'present' | 'absent' }[]) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-attendance/session/${sessionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendanceRecords: records }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setAttendance(data.data);
                addToast(data.message || 'Attendance marked', 'success');
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionAttendance = useCallback(async (sessionId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-attendance/session/${sessionId}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setAttendance(data.data.attendance);
                setSessionBookings(data.data.bookings);
                return { success: true as const, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const staffBookSession = async (sessionId: string, memberId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/class-bookings/staff-book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, memberId }),
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast(data.message || 'Slot booked for member! 🎉', 'success');
                return { success: true, data: data.data };
            }
            return handleError({ message: data.message });
        } catch (err: any) {
            return handleError(err);
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
        classes, sessions, bookings, attendance, sessionBookings,
        loading, error,
        // Class actions
        fetchClasses, createClass, updateClass, deleteClass,
        // Session actions
        generateSessions, fetchSessionsByClass, fetchUpcomingSessions,
        cancelSession, updateSessionNotes,
        // Booking actions
        bookSession, fetchMyBookings, cancelBooking, selfCheckIn, fetchSessionBookings, staffBookSession,
        // Attendance actions
        markAttendance, fetchSessionAttendance,
    };
};
