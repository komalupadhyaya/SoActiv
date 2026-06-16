// src/hooks/useEnquiry.ts
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

export interface IEnquiry {
  _id: string;
  userId: { _id: string; fullname: string; email: string } | string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  assignedStaff?:
  | { _id: string; fullName: string; email: string; role: string }
  | string
  | null;
  followUpDate?: string | null;
  comments?: string;
  interests?: string;
  budget?: string;
  createdAt: string;
  updatedAt: string;
}

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

const API = axios.create({
  baseURL: `${API_URL}/enquiry`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});


type CreateEnquiryData = Omit<IEnquiry, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

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
      name: string;
      email: string;
      phone: string;
    }>;
    failed: Array<{
      row: number;
      data: any;
      reason: string;
      errors: string[];
    }>;
  };
}

// Extract user role from wherever it's stored (e.g., auth context, or localStorage)
// In real app, this should come from auth context or JWT
const getCurrentUserRole = (): string => {
  const user = localStorage.getItem('user');
  if (!user) return 'user';
  try {
    const parsed = JSON.parse(user);
    return parsed.role || 'user';
  } catch {
    return 'user';
  }
};

export const useEnquiry = () => {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [myEnquiries, setMyEnquiries] = useState<IEnquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const isAdmin = getCurrentUserRole() === 'admin';

  // Fetch all enquiries
  const refreshEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/');
      if (res.data.success) {
        setEnquiries(res.data.data || []);
      } else {
        const msg = res.data.message || 'Failed to fetch enquiries';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch enquiries';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch my enquiries
  const fetchMyEnquiries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/my-enquiries');
      if (res.data.success) {
        setMyEnquiries(res.data.data || []);
      } else {
        const msg = res.data.message || 'Failed to fetch your enquiries';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch your enquiries';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Create enquiry
  const createEnquiry = useCallback(async (data: CreateEnquiryData): Promise<IEnquiry | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/', data);
      if (res.data.success) {
        const newEnquiry = res.data.data;
        setEnquiries((prev) => [newEnquiry, ...prev]);
        setMyEnquiries((prev) => [newEnquiry, ...prev]);
        addToast('Enquiry created successfully', 'success');
        return newEnquiry;
      } else {
        const msg = res.data.message || 'Failed to create enquiry';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create enquiry';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const createPublicEnquiry = useCallback(async (data: { name: string; phone: string; email?: string; interests?: string; comments?: string }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/public', data);
      if (res.data.success) {
        addToast('Enquiry submitted successfully!', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to submit enquiry';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit enquiry';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Get enquiry by ID
  const getEnquiryById = useCallback(async (id: string): Promise<IEnquiry | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/${id}`);
      if (res.data.success) {
        return res.data.data;
      } else {
        const msg = res.data.message || 'Failed to fetch enquiry';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch enquiry';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Update enquiry
  const updateEnquiry = useCallback(async (id: string, data: Partial<IEnquiry>): Promise<IEnquiry | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put(`/${id}`, data);
      if (res.data.success) {
        const updatedEnquiry = res.data.data;
        setEnquiries((prev) =>
          prev.map((enq) => (enq._id === id ? updatedEnquiry : enq))
        );
        setMyEnquiries((prev) =>
          prev.map((enq) => (enq._id === id ? updatedEnquiry : enq))
        );
        addToast('Enquiry updated successfully', 'success');
        return updatedEnquiry;
      } else {
        const msg = res.data.message || 'Failed to update enquiry';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update enquiry';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Delete enquiry
  const deleteEnquiry = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.delete(`/${id}`);
      if (res.data.success) {
        setEnquiries((prev) => prev.filter((enq) => enq._id !== id));
        setMyEnquiries((prev) => prev.filter((enq) => enq._id !== id));
        addToast('Enquiry deleted successfully', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to delete enquiry';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete enquiry';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Assign staff to enquiry
  const assignStaff = useCallback(async (enquiryId: string, staffId: string): Promise<IEnquiry | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put(`/${enquiryId}/assign`, { staffId });
      if (res.data.success) {
        const updatedEnquiry = res.data.data;
        setEnquiries((prev) =>
          prev.map((enq) => (enq._id === enquiryId ? updatedEnquiry : enq))
        );
        addToast('Staff assigned successfully', 'success');
        return updatedEnquiry;
      } else {
        const msg = res.data.message || 'Failed to assign staff';
        setError(msg);
        addToast(msg, 'error');
        return null;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign staff';
      setError(msg);
      addToast(msg, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Bulk upload
  const bulkUpload = useCallback(async (file: File): Promise<BulkUploadResult | null> => {
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
        await refreshEnquiries();
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
  }, [addToast, refreshEnquiries]);


  useEffect(() => {
    if (isAdmin) {
      refreshEnquiries();
    } else {
      fetchMyEnquiries();
    }
  }, [isAdmin, refreshEnquiries, fetchMyEnquiries]);

  return {
    enquiries,
    myEnquiries,
    loading,
    error,
    createEnquiry,
    createPublicEnquiry,
    getEnquiryById,
    updateEnquiry,
    deleteEnquiry,
    assignStaff,
    bulkUpload,
    refreshEnquiries,
    fetchMyEnquiries,
    isAdmin,
  };
};