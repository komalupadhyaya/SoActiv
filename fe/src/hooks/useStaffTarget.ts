// hooks/useStaffTarget.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

export interface MonthlyTargets {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export interface StaffTarget {
  _id: string;
  gym: string;
  createdBy: string;
  staffId: string;
  staffName: string;
  targetType: string;
  salesType: string;
  year: number;
  monthlyTargets: MonthlyTargets;
  createdAt: string;
  updatedAt: string;
}

export interface TargetFilterParams {
  staffId?: string;
  targetType?: string;
  salesType?: string;
  year?: number | string;
}

export type CreateTargetData = {
  staffId: string;
  targetType: string;
  salesType: string;
  year: number;
  monthlyTargets: MonthlyTargets;
};

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

const API = axios.create({
  baseURL: `${API_URL}/staff-targets`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const useStaffTarget = () => {
  const [targets, setTargets] = useState<StaffTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchTargets = useCallback(async (filters?: TargetFilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.staffId && filters.staffId !== 'All') params.append('staffId', filters.staffId);
      if (filters?.targetType && filters.targetType !== 'All') params.append('targetType', filters.targetType);
      if (filters?.salesType && filters.salesType !== 'All') params.append('salesType', filters.salesType);
      if (filters?.year && filters.year !== 'All') params.append('year', String(filters.year));

      const res = await API.get(`/?${params.toString()}`);
      if (res.data.success) {
        setTargets(res.data.data || []);
      } else {
        const msg = res.data.message || 'Failed to fetch targets';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch targets';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createTarget = async (data: CreateTargetData): Promise<StaffTarget | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/', data);
      if (res.data.success) {
        const newTarget = res.data.data;
        setTargets((prev) => [newTarget, ...prev]);
        addToast(res.data.message || 'Staff target created successfully', 'success');
        return newTarget;
      } else {
        const msg = res.data.message || 'Failed to create target';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create target';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = async (id: string, data: Partial<CreateTargetData>): Promise<StaffTarget | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put(`/${id}`, data);
      if (res.data.success) {
        const updated = res.data.data;
        setTargets((prev) => prev.map((t) => (t._id === id ? updated : t)));
        addToast(res.data.message || 'Staff target updated successfully', 'success');
        return updated;
      } else {
        const msg = res.data.message || 'Failed to update target';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update target';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTarget = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.delete(`/${id}`);
      if (res.data.success) {
        setTargets((prev) => prev.filter((t) => t._id !== id));
        addToast(res.data.message || 'Staff target deleted successfully', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to delete target';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete target';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    targets,
    loading,
    error,
    fetchTargets,
    createTarget,
    updateTarget,
    deleteTarget,
  };
};
