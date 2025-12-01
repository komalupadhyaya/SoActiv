// hooks/useStaff.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

// Define Staff Types
export interface Staff {
  _id: string;
  userId: string;
  fullName: string;
  position: string;
  email: string;
  contactNumber: string;
  joiningDate: string | Date;
  salary: number;
  status: 'active' | 'inactive';
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// Bulk Upload Result Type
export interface BulkUploadResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
  details: {
    successful: Array<{
      row: number;
      fullName: string;
      email: string;
      position: string;
    }>;
    failed: Array<{
      row: number;
      data: any;
      reason: string;
      errors: string[];
    }>;
  };
}

// 🔔 Action type for recent staff creation
export interface StaffAction {
  type: 'create';
  staffName: string;
  timestamp: string; // ISO string
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

type FilterParams = {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
};

type CreateStaffData = Omit<Staff, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

const API_URL = 'http://localhost:8000/api/v1';

const API = axios.create({
  baseURL: `${API_URL}/staff`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const useStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch all staff
  const fetchAllStaff = useCallback(async (filters?: FilterParams) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.search) queryParams.append('search', filters.search);
      if (filters?.role) queryParams.append('role', filters.role);
      if (filters?.status) queryParams.append('status', filters.status);

      const res = await API.get(`/?${queryParams.toString()}`);
      if (res.data.success) {
        setStaff(res.data.data || []);
      } else {
        const msg = res.data.message || 'Failed to fetch staff';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch staff';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch staff by ID
  const fetchStaffById = async (id: string): Promise<Staff | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/${id}`);
      if (res.data.success) {
        return res.data.data;
      } else {
        const msg = res.data.message || 'Failed to fetch staff member';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch staff member';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create staff
  const createStaff = async (data: CreateStaffData): Promise<Staff | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/', data);
      if (res.data.success) {
        const newStaff = res.data.data;
        setStaff((prev) => [newStaff, ...prev]);
        addToast('Staff member created successfully', 'success');
        return newStaff;
      } else {
        const msg = res.data.message || 'Failed to create staff member';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create staff member';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update staff
  const updateStaff = async (id: string, data: Partial<CreateStaffData>): Promise<Staff | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put(`/${id}`, data);
      if (res.data.success) {
        const updatedStaff = res.data.data;
        setStaff((prev) =>
          prev.map((s) => (s._id === id ? updatedStaff : s))
        );
        addToast('Staff member updated successfully', 'success');
        return updatedStaff;
      } else {
        const msg = res.data.message || 'Failed to update staff member';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update staff member';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete staff
  const deleteStaff = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.delete(`/${id}`);
      if (res.data.success) {
        setStaff((prev) => prev.filter((s) => s._id !== id));
        addToast('Staff member deleted successfully', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to delete staff member';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete staff member';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Bulk upload
  const bulkUpload = async (file: File): Promise<BulkUploadResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await API.post('/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        addToast(res.data.message || 'Bulk upload completed', 'success');
        await fetchAllStaff();
        return res.data;
      } else {
        const msg = res.data.message || 'Bulk upload failed';
        setError(msg);
        addToast(msg, 'error');
        return res.data;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Bulk upload failed';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Recent staff actions (staff created in last 24 hours)
  const recentStaffActions = useMemo<StaffAction[]>(() => {
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;

    return staff
      .filter((s) => {
        const createdAt = new Date(s.createdAt).getTime();
        return now - createdAt <= hours24;
      })
      .map((s) => ({
        type: 'create' as const,
        staffName: s.fullName,
        timestamp: s.createdAt,
      }));
  }, [staff]);

  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  return {
    staff,
    loading,
    error,
    recentStaffActions,
    fetchAllStaff,
    fetchStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    bulkUpload,
    refetch: fetchAllStaff,
  };
};