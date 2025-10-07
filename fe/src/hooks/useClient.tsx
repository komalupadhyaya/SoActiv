import { useState, useEffect, useMemo } from 'react';

// === Client Interface ===
export interface Client {
  _id: string;
  userId: string;
  fullName: string;
  email?: string;
  contactNumber?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'expired' | 'pending';
  packagePrice: number;
  hasPersonalTraining: boolean;
  personalTrainingPrice?: number;
  plan: 'basic' | 'premium';
  timing: string;
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

// === Hook Return Type ===
interface UseClientResult {
  clients: Client[];
  loading: boolean;
  error: string | null;
  createClient: (data: CreateClientData) => Promise<{ success: boolean; message?: string }>;
  deleteClient: (id: string) => Promise<void>;
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

  const deleteClient = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

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
    deleteClient,
    refresh: fetchClients,
    recentActivities,
  };
};