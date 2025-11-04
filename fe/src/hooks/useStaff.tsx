// hooks/useStaff.ts

import { useState, useCallback, useEffect, useMemo } from 'react';

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
  createdAt: string; // ← Must come from backend
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

// Get API URL (works everywhere)
const API_URL = 'http://localhost:8000/api/v1';

// Custom Hook
export const useStaff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Utility to make API calls
  const apiCall = useCallback(
    async <T,>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
      setLoading(true);
      setError(null);

      const config: RequestInit = {
        ...options,
        credentials: 'include' as const,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      try {
        const response = await fetch(`${API_URL}/staff${endpoint}`, config);

        // Handle non-JSON response (e.g., empty body on delete)
        if (!response.ok) {
          const text = await response.text();
          return {
            success: false,
            message: text || `Error: ${response.status}`,
          } as ApiResponse<T>;
        }

        // Only parse JSON if content exists
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return { success: true } as ApiResponse<T>;
        }

        const data: ApiResponse<T> = await response.json();
        return data;
      } catch (err: any) {
        const message = err.message || 'Network error or failed to reach server';
        setError(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get all staff (with filters)
  const fetchAllStaff = useCallback(
    async (filters?: FilterParams): Promise<ApiResponse<Staff[]>> => {
      let queryString = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.status === 'active' || filters.status === 'inactive') {
          params.append('status', filters.status);
        }
        queryString = `?${params.toString()}`;
      }

      const response = await apiCall<Staff[]>(queryString);
      if (response.success && Array.isArray(response.data)) {
        // Sort by createdAt descending
        const sorted = response.data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setStaff(sorted);
      }
      return response;
    },
    [apiCall]
  );

  // Get staff by ID
  const fetchStaffById = useCallback(
    async (id: string): Promise<ApiResponse<Staff>> => {
      return await apiCall<Staff>(`/${id}`);
    },
    [apiCall]
  );

  // Create new staff
  const createStaff = useCallback(
    async (staffData: Omit<Staff, '_id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Staff>> => {
      const response = await apiCall<Staff>('', {
        method: 'POST',
        body: JSON.stringify(staffData),
      });

      if (response.success && response.data) {
        // Add new staff at the top
        setStaff((prev) => [response.data!, ...prev]);
      }
      return response;
    },
    [apiCall]
  );

  // Update staff by ID
  const updateStaff = useCallback(
    async (id: string, updates: Partial<Staff>): Promise<ApiResponse<Staff>> => {
      const response = await apiCall<Staff>(`/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response.success && response.data) {
        setStaff((prev) =>
          prev.map((s) => (s._id === id ? response.data! : s))
        );
      }
      return response;
    },
    [apiCall]
  );

  // Delete staff by ID
  const deleteStaff = useCallback(
    async (id: string): Promise<ApiResponse<Staff>> => {
      const response = await apiCall<Staff>(`/${id}`, {
        method: 'DELETE',
      });
      if (response.success) {
        setStaff((prev) => prev.filter((s) => s._id !== id));
      }
      return response;
    },
    [apiCall]
  );

  // Auto-load all staff on mount
  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  // ✅ Compute recent staff actions from real `createdAt`
  const recentStaffActions = useMemo(() => {
    const hours24 = 24 * 60 * 60 * 1000;
    const now = Date.now();

    return staff
      .filter((s) => {
        const createdTime = new Date(s.createdAt).getTime();
        return now - createdTime <= hours24;
      })
      .map((s) => ({
        type: 'create' as const,
        staffName: s.fullName,
        timestamp: s.createdAt,
      }));
  }, [staff]); // ← Recompute only when staff changes

  // Bulk upload staff
  const bulkUpload = useCallback(
    async (file: File): Promise<BulkUploadResult | null> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/staff/bulk-upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Refresh the staff list after successful upload
          await fetchAllStaff();
        }

        return result;
      } catch (error: any) {
        console.error('Bulk upload error:', error);
        return {
          success: false,
          message: 'Network error. Check connection and login status.',
          summary: { total: 0, successful: 0, failed: 0, duplicates: 0 },
          details: { successful: [], failed: [] },
        };
      }
    },
    [fetchAllStaff]
  );

  return {
    staff,
    loading,
    error,
    recentStaffActions, // ← Export real backend-based actions
    fetchAllStaff,
    fetchStaffById,
    createStaff,
    updateStaff,
    deleteStaff,
    bulkUpload,
    refetch: fetchAllStaff,
  };
};