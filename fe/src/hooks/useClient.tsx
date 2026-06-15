import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import axios from 'axios';

// === Client Interface ===
export interface Client {
  _id: string;
  userId: string;
  fullName: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  email: string;
  contactNumber: string;
  address?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: 'parent' | 'spouse' | 'sibling' | 'friend' | 'child' | 'other';

  // Staff Assignment
  salesRep?: string;
  memberManager?: string;
  trainer?: string;

  // Club & Membership
  attendanceId?: string;
  clubId?: string;
  gstNo?: string;

  // Membership Dates
  startDate: string;
  endDate: string;
  remainingDays?: number;
  status: 'active' | 'expired' | 'pending';

  // Package & Add-ons
  packagePrice: number;
  hasPersonalTraining: boolean;
  personalTrainer?: string;
  personalTrainingDurationWeeks?: number;
  personalTrainingPrice?: number;

  // Plan Type
  plan: 'basic' | 'premium';

  // Timing
  timing: string;

  // Notifications
  notifications?: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

// === Type for creating a client ===
export type CreateClientData = Omit<
  Client,
  '_id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'
>;

// === Activity Type ===
export interface ClientActivity {
  type: 'create';
  clientName: string;
  timestamp: string; // ISO string
}

// === Bulk Upload Result Type ===
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
      contactNumber: string;
    }>;
    failed: Array<{
      row: number;
      data: any;
      reason: string;
      errors: string[];
    }>;
  };
}

const API_URL = 'http://localhost:8000/api/v1';

const API = axios.create({
  baseURL: `${API_URL}/client`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export const useClient = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch all clients
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/');
      if (res.data.success) {
        setClients(res.data.data || []);
      } else {
        const msg = res.data.message || 'Failed to fetch clients';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch clients';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Create client
  const createClient = async (data: CreateClientData): Promise<{ success: boolean; message?: string; data?: any }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/', data);
      if (res.data.success) {
        setClients((prev) => [res.data.data, ...prev]);
        addToast('Client created successfully', 'success');
        return { success: true, data: res.data.data };
      } else {
        const msg = res.data.message || 'Failed to create client';
        setError(msg);
        addToast(msg, 'error');
        return { success: false, message: msg };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create client';
      setError(msg);
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Update client
  const updateClient = async (id: string, data: Partial<CreateClientData>): Promise<{ success: boolean; message?: string; data?: any }> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.put(`/${id}`, data);
      if (res.data.success) {
        setClients((prev) =>
          prev.map((client) => (client._id === id ? res.data.data : client))
        );
        addToast('Client updated successfully', 'success');
        return { success: true, data: res.data.data };
      } else {
        const msg = res.data.message || 'Failed to update client';
        setError(msg);
        addToast(msg, 'error');
        return { success: false, message: msg };
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update client';
      setError(msg);
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Delete client
  const deleteClient = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.delete(`/${id}`);
      if (res.data.success) {
        if (res.data.requested) {
          // Manager requested delete: update client in state
          setClients((prev) =>
            prev.map((client) => (client._id === id ? res.data.data : client))
          );
        } else {
          // Admin deleted: remove from state
          setClients((prev) => prev.filter((client) => client._id !== id));
        }
        return true;
      } else {
        const msg = res.data.message || 'Failed to delete client';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete client';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reject deletion request
  const rejectDelete = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.patch(`/${id}/reject-delete`);
      if (res.data.success) {
        setClients((prev) =>
          prev.map((client) => (client._id === id ? res.data.data : client))
        );
        addToast('Client deletion request rejected', 'success');
        return true;
      } else {
        const msg = res.data.message || 'Failed to reject deletion request';
        setError(msg);
        addToast(msg, 'error');
        return false;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to reject deletion request';
      setError(msg);
      addToast(msg, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
        await fetchClients(); // Refresh the list
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

  // Recent activities (clients created in last 24 hours)
  const recentActivities = useMemo<ClientActivity[]>(() => {
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;

    return clients
      .filter((client) => {
        const createdAt = new Date(client.createdAt).getTime();
        return now - createdAt <= hours24;
      })
      .map((client) => ({
        type: 'create' as const,
        clientName: client.fullName,
        timestamp: client.createdAt,
      }));
  }, [clients]);

  useEffect(() => {
    let isCleaner = false;
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser.role === 'staff' && savedUser.position === 'cleaner') {
          isCleaner = true;
        }
      }
    } catch (e) {
      // Ignore
    }

    if (!isCleaner) {
      fetchClients();
    }
  }, [fetchClients]);

  const notifyRenewal = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await API.post(`/${id}/notify-renewal`);
      if (res.data.success) {
        addToast(res.data.message || 'Renewal notification sent', 'success');
        return true;
      } else {
        addToast(res.data.message || 'Failed to send renewal notification', 'error');
        return false;
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || err.message || 'Failed to send renewal notification', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const forwardRenewal = async (id: string, salesStaffId: string, note?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await API.post(`/${id}/forward-renewal`, { salesStaffId, note });
      if (res.data.success) {
        addToast(res.data.message || 'Renewal forwarded to sales rep', 'success');
        return true;
      } else {
        addToast(res.data.message || 'Failed to forward renewal', 'error');
        return false;
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || err.message || 'Failed to forward renewal', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    bulkUpload,
    deleteClient,
    rejectDelete,
    refresh: fetchClients,
    fetchClients,
    recentActivities,
    notifyRenewal,
    forwardRenewal,
  };
};