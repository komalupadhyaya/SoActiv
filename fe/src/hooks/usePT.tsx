import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface PTPlan {
    _id: string;
    name: string;
    description?: string;
    totalSessions: number;
    validityDays: number;
    price: number;
    isActive: boolean;
    createdAt: string;
}

export interface PTAssignment {
    _id: string;
    memberId: {
        _id: string;
        fullName: string;
        email: string;
        contactNumber: string;
    };
    planId: {
        _id: string;
        name: string;
        totalSessions: number;
    };
    trainerId: {
        _id: string;
        fullName: string;
    };
    startDate: string; // ISO
    expiryDate: string; // ISO
    totalSessions: number;
    usedSessions: number;
    status: 'active' | 'expired' | 'completed' | 'cancelled';
    sessionLogs: Array<{
        date: string;
        notes?: string;
        loggedBy: string;
    }>;
}

export const usePT = () => {
    const [plans, setPlans] = useState<PTPlan[]>([]);
    const [assignments, setAssignments] = useState<PTAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { addToast } = useToast();

    // -------------------------
    // PLAN ACTIONS
    // -------------------------

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/plans`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setPlans(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch plans');
            }
        } catch (err: any) {
            setError(err.message);
            // Don't toast on load unless critical?
            // addToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const createPlan = async (planData: Omit<PTPlan, '_id' | 'isActive' | 'createdAt'>) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/plans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planData),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPlans(prev => [data.data, ...prev]);
                addToast('Plan created successfully', 'success');
                return true;
            } else {
                throw new Error(data.message || 'Failed to create plan');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updatePlan = async (id: string, updates: Partial<PTPlan>) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/plans/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPlans(prev => prev.map(p => p._id === id ? data.data : p));
                addToast('Plan updated successfully', 'success');
                return true;
            } else {
                throw new Error(data.message || 'Failed to update plan');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const togglePlanStatus = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/plans/${id}/status`, {
                method: 'PATCH',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setPlans(prev => prev.map(p => p._id === id ? data.data : p));
                addToast('Plan status updated', 'success');
                return true;
            } else {
                throw new Error(data.message || 'Failed to update status');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    // -------------------------
    // ASSIGNMENT ACTIONS
    // -------------------------

    const fetchAssignments = useCallback(async (filters?: { memberId?: string, trainerId?: string, status?: string }) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters?.memberId) params.append('memberId', filters.memberId);
            if (filters?.trainerId) params.append('trainerId', filters.trainerId);
            if (filters?.status) params.append('status', filters.status);

            const res = await fetch(`${API_URL}/pt/assignments?${params.toString()}`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && data.success) {
                setAssignments(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch assignments');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const assignPT = async (data: { memberId: string, planId: string, trainerId: string, startDate: string }) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setAssignments(prev => [result.data, ...prev]);
                addToast('PT Assigned successfully', 'success');
                return true;
            } else {
                throw new Error(result.message || 'Failed to assign PT');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logSession = async (assignmentId: string, data: { date: string, notes?: string }) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/assignments/${assignmentId}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setAssignments(prev => prev.map(a => a._id === assignmentId ? result.data : a));
                addToast('Session logged successfully', 'success');
                return true;
            } else {
                throw new Error(result.message || 'Failed to log session');
            }
        } catch (err: any) {
            addToast(err.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const checkExpiry = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/pt/expiry-check`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                addToast(`Expiry check complete. Updated ${data.updatedCount} records.`, 'info');
                return true;
            }
            return false;
        } catch (err: any) {
            console.error(err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        plans,
        assignments,
        loading,
        error,
        fetchPlans,
        createPlan,
        updatePlan,
        togglePlanStatus,
        fetchAssignments,
        assignPT,
        logSession,
        checkExpiry
    };
};
