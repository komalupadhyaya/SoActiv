import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { FollowUp } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useFollowUp = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch all follow-ups
  const fetchFollowUps = useCallback(async (filters?: {
    status?: string;
    type?: string;
    assignedTo?: string;
    date?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.assignedTo) queryParams.append('assignedTo', filters.assignedTo);
      if (filters?.date) queryParams.append('date', filters.date);

      const res = await fetch(`${API_URL}/follow-up?${queryParams.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFollowUps(data.data);
      } else {
        const msg = data.message || 'Failed to fetch follow-ups';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch upcoming follow-ups
  const fetchUpcomingFollowUps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/follow-up/upcoming`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUpcomingFollowUps(data.data.followUps);
      } else {
        const msg = data.message || 'Failed to fetch upcoming follow-ups';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Create a new follow-up
  const createFollowUp = async (followUpData: {
    assignedTo: string;
    type: 'enquiry' | 'client' | 'pt';
    relatedId: string;
    relatedName: string;
    scheduledDate: string;
    scheduledTime: string;
    note: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpData),
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFollowUps((prev) => [data.data, ...prev]);
        addToast('Follow-up created successfully', 'success');
        return { success: true, data: data.data };
      } else {
        const msg = data.message || 'Failed to create follow-up';
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

  // Update a follow-up
  const updateFollowUp = async (id: string, updates: Partial<FollowUp>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/follow-up/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFollowUps((prev) => prev.map((f) => (f._id === id ? data.data : f)));
        addToast('Follow-up updated successfully', 'success');
        return { success: true, data: data.data };
      } else {
        const msg = data.message || 'Failed to update follow-up';
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

  // Complete a follow-up
  const completeFollowUp = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/follow-up/${id}/complete`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFollowUps((prev) => prev.map((f) => (f._id === id ? data.data : f)));
        setUpcomingFollowUps((prev) => prev.filter((f) => f._id !== id));
        addToast('Follow-up completed successfully', 'success');
        return { success: true, data: data.data };
      } else {
        const msg = data.message || 'Failed to complete follow-up';
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

  // Delete a follow-up
  const deleteFollowUp = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/follow-up/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFollowUps((prev) => prev.filter((f) => f._id !== id));
        setUpcomingFollowUps((prev) => prev.filter((f) => f._id !== id));
        addToast('Follow-up deleted successfully', 'success');
        return { success: true };
      } else {
        const msg = data.message || 'Failed to delete follow-up';
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

  return {
    followUps,
    upcomingFollowUps,
    loading,
    error,
    fetchFollowUps,
    fetchUpcomingFollowUps,
    createFollowUp,
    updateFollowUp,
    completeFollowUp,
    deleteFollowUp,
  };
};

