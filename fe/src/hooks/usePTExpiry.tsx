import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { PTExpiryData } from '../types';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

interface ExpiringPTData {
  total: number;
  expired: number;
  expiringSoon: number;
  ptPackages: PTExpiryData[];
  categories: {
    expired: PTExpiryData[];
    expiringSoon: PTExpiryData[];
  };
}

interface PTByTrainerData {
  total: number;
  trainers: {
    trainerId: string;
    trainerName: string;
    clients: PTExpiryData[];
    total: number;
    expired: number;
    expiringSoon: number;
  }[];
}

export const usePTExpiry = () => {
  const [expiringPT, setExpiringPT] = useState<ExpiringPTData | null>(null);
  const [ptByTrainer, setPTByTrainer] = useState<PTByTrainerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch expiring PT packages
  const fetchExpiringPT = useCallback(async (days: number = 7) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/client/pt-expiring?days=${days}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setExpiringPT(data.data);
      } else {
        const msg = data.message || 'Failed to fetch expiring PT packages';
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

  // Fetch PT packages grouped by trainer
  const fetchPTByTrainer = useCallback(async (days: number = 7) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/client/pt-expiring/by-trainer?days=${days}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPTByTrainer(data.data);
      } else {
        const msg = data.message || 'Failed to fetch PT packages by trainer';
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

  // Get PT status for a specific client
  const getClientPTStatus = async (clientId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/client/${clientId}/pt-status`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        return { success: true, data: data.data };
      } else {
        const msg = data.message || 'Failed to fetch client PT status';
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
    expiringPT,
    ptByTrainer,
    loading,
    error,
    fetchExpiringPT,
    fetchPTByTrainer,
    getClientPTStatus,
  };
};

