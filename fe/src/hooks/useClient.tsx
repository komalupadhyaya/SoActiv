import { useState, useEffect, useMemo } from 'react';

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

// === Hook Return Type ===
interface UseClientResult {
  clients: Client[];
  loading: boolean;
  error: string | null;
  createClient: (data: CreateClientData) => Promise<{ success: boolean; message?: string }>;
  updateClient: (id: string, data: Partial<CreateClientData>) => Promise<{ success: boolean; message?: string }>;
  bulkUpload: (file: File) => Promise<BulkUploadResult | null>;
  deleteClient: (id: string, clientName?: string) => Promise<void>;
  refresh: () => void;
  recentActivities: ClientActivity[];
}

export const useClient = (): UseClientResult => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/v1/client', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const sorted = data.data.sort(
          (a: Client, b: Client) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setClients(sorted);
      } else {
        setError(data.message || 'Failed to load clients');
      }
    } catch (err: any) {
      setError('Network error. Could not connect to server.');
      console.error('Fetch clients error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (data: CreateClientData) => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const newClient = result.data as Client;
        setClients((prev) => [newClient, ...prev]);
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Failed to create client' };
      }
    } catch (err: any) {
      console.error('Create client error:', err);
      return {
        success: false,
        message: 'Network error. Check connection and login status.',
      };
    }
  };

  const updateClient = async (id: string, data: Partial<CreateClientData>) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/client/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const updatedClient = result.data as Client;
        setClients((prev) => prev.map((c) => (c._id === id ? updatedClient : c)));
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Failed to update client' };
      }
    } catch (err: any) {
      console.error('Update client error:', err);
      return {
        success: false,
        message: 'Network error. Check connection and login status.',
      };
    }
  };

  const bulkUpload = async (file: File): Promise<BulkUploadResult | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8000/api/v1/client/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await res.json();

      if (res.ok && result.success) {
        // Refresh the client list after successful upload
        await fetchClients();
      }

      return result;
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      return {
        success: false,
        message: 'Network error. Check connection and login status.',
        summary: { total: 0, successful: 0, failed: 0, duplicates: 0 },
        details: { successful: [], failed: [] },
      };
    }
  };

  const deleteClient = async (id: string, clientName?: string) => {
    const confirmMessage = clientName
      ? `Are you sure you want to delete ${clientName}?`
      : 'Are you sure you want to delete this client?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`http://localhost:8000/api/v1/client/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setClients((prev) => prev.filter((c) => c._id !== id));
        alert('Client deleted successfully');
      } else {
        alert(result.message || 'Failed to delete client');
      }
    } catch (err: any) {
      alert('Network error. Could not delete client.');
      console.error('Delete client error:', err);
    }
  };

  // ✅ Memoize recentActivities to prevent unnecessary re-creation
  const recentActivities = useMemo(() => {
    const hours24 = 24 * 60 * 60 * 1000;
    const now = Date.now();

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
  }, [clients]); // ← Only recompute when clients change

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    bulkUpload,
    deleteClient,
    refresh: fetchClients,
    recentActivities,
  };
};