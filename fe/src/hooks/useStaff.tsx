// hooks/useStaff.ts

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

// Define Staff Types
export interface Staff {
  _id: string;
  userId?: string;
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
  approvalStatus?: 'approved' | 'pending_create' | 'pending_update' | 'pending_delete';
  pendingUpdates?: Record<string, any> | null;
  requestedBy?: string | null;
  requestedAt?: string | null;
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

type FilterParams = {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
};

type CreateStaffData = Omit<Staff, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

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
        // Backend now returns { data: { staff: ..., user: ... } }
        const newStaff = res.data.data.staff;
        setStaff((prev) => [newStaff, ...prev]);
        addToast(res.data.message || 'Staff member created successfully', 'success');
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
        addToast(res.data.message || 'Staff member updated successfully', 'success');
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
        if (res.data.requested) {
          // If it was a request, replace staff member to show updated approvalStatus
          const updatedStaff = res.data.data;
          setStaff((prev) =>
            prev.map((s) => (s._id === id ? updatedStaff : s))
          );
        } else {
          // Direct deletion
          setStaff((prev) => prev.filter((s) => s._id !== id));
        }
        addToast(res.data.message || 'Staff member deleted successfully', 'success');
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

  // Approve staff request
  const approveStaff = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.patch(`/${id}/approve`);
      if (res.data.success) {
        const approvedStaff = res.data.data;
        if (approvedStaff) {
          setStaff((prev) =>
            prev.map((s) => (s._id === id ? approvedStaff : s))
          );
        } else {
          // If it was pending deletion approved, it is deleted from DB
          setStaff((prev) => prev.filter((s) => s._id !== id));
        }
        addToast(res.data.message || 'Staff request approved successfully', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to approve staff request';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to approve staff request';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reject staff request
  const rejectStaff = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.patch(`/${id}/reject`);
      if (res.data.success) {
        const rejectedStaff = res.data.data;
        if (rejectedStaff) {
          setStaff((prev) =>
            prev.map((s) => (s._id === id ? rejectedStaff : s))
          );
        } else {
          // If creation request is rejected, the document was deleted
          setStaff((prev) => prev.filter((s) => s._id !== id));
        }
        addToast(res.data.message || 'Staff request rejected successfully', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to reject staff request';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to reject staff request';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update logged-in staff profile
  const updateProfile = async (formData: FormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.patch('/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        addToast(res.data.message || 'Profile updated successfully', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to update profile';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
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

  // Removed auto-fetch useEffect to prevent "Access denied" errors when hook is used by unauthorized roles (e.g. Schedule page)
  // Components must explicitly call fetchAllStaff() if they need the list.

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
    approveStaff,
    rejectStaff,
    updateProfile,
    bulkUpload,
    refetch: fetchAllStaff,
  };
};