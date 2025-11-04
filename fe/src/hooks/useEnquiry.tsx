// src/hooks/useEnquiry.ts
import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

export interface IEnquiry {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: 'new' | 'contacted' | 'interested' | 'converted' | 'lost';
  assignedStaff?:
    | { _id: string; name: string; email: string; role: string }
    | string
    | null;
  followUpDate?: string | null;
  comments?: string;
  interests?: string;
  budget?: string;
  createdAt: string;
  updatedAt: string;
}

const API = axios.create({
  baseURL: 'http://localhost:8000/api/v1/enquiry',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

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

interface UseEnquiryReturn {
  enquiries: IEnquiry[]; // All enquiries (only for admins)
  myEnquiries: IEnquiry[]; // Enquiries created by current user
  loading: boolean;
  error: string | null;
  createEnquiry: (data: CreateEnquiryData) => Promise<IEnquiry | null>;
  getEnquiryById: (id: string) => Promise<IEnquiry | null>;
  updateEnquiry: (id: string, data: Partial<IEnquiry>) => Promise<IEnquiry | null>;
  deleteEnquiry: (id: string) => Promise<boolean>;
  assignStaff: (enquiryId: string, staffId: string) => Promise<IEnquiry | null>;
  bulkUpload: (file: File) => Promise<BulkUploadResult | null>;
  refreshEnquiries: () => Promise<void>;
  isAdmin: boolean;
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

export const useEnquiry = (): UseEnquiryReturn => {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [myEnquiries, setMyEnquiries] = useState<IEnquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = ['admin', 'manager'].includes(getCurrentUserRole());

  const handleRequest = async <T,>(request: Promise<any>): Promise<T | null> => {
    try {
      setError(null);
      const response = await request;
      return response.data as T;
    } catch (err) {
      const error = err as AxiosError<ApiResponse<unknown>>;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong';
      setError(message as string);
      console.error('Enquiry API Error:', message);
      return null;
    }
  };

  const fetchAllEnquiries = useCallback(async () => {
    if (!isAdmin) {
      setEnquiries([]); // Don't load all for non-admins
      return;
    }
    const data = await handleRequest<ApiResponse<IEnquiry[]>>(API.get(''));
    if (data?.success && Array.isArray(data.data)) {
      setEnquiries(data.data);
    }
  }, [isAdmin]);

  const fetchMyEnquiries = useCallback(async () => {
    const data = await handleRequest<ApiResponse<IEnquiry[]>>(API.get('/my'));
    if (data?.success && Array.isArray(data.data)) {
      setMyEnquiries(data.data);
    }
  }, []);

  const refreshEnquiries = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchAllEnquiries(), fetchMyEnquiries()]);
    setLoading(false);
  }, [fetchAllEnquiries, fetchMyEnquiries]);

  useEffect(() => {
    refreshEnquiries();
  }, [refreshEnquiries]);

  const createEnquiry = useCallback(
    async (data: CreateEnquiryData): Promise<IEnquiry | null> => {
      const response = await handleRequest<ApiResponse<IEnquiry>>(API.post('', data));
      if (response?.success && response.data) {
        refreshEnquiries();
        return response.data;
      }
      return null;
    },
    [refreshEnquiries]
  );

  const getEnquiryById = useCallback(
    async (id: string): Promise<IEnquiry | null> => {
      const response = await handleRequest<ApiResponse<IEnquiry>>(API.get(`/${id}`));
      return response?.success ? response.data ?? null : null;
    },
    []
  );

  const updateEnquiry = useCallback(
    async (id: string, data: Partial<IEnquiry>): Promise<IEnquiry | null> => {
      const response = await handleRequest<ApiResponse<IEnquiry>>(API.put(`/${id}`, data));
      if (response?.success && response.data) {
        refreshEnquiries();
        return response.data;
      }
      return null;
    },
    [refreshEnquiries]
  );

  const deleteEnquiry = useCallback(
    async (id: string): Promise<boolean> => {
      const response = await handleRequest<ApiResponse<unknown>>(API.delete(`/${id}`));
      if (response?.success) {
        refreshEnquiries();
        return true;
      }
      return false;
    },
    [refreshEnquiries]
  );

  const assignStaff = useCallback(
    async (enquiryId: string, staffId: string): Promise<IEnquiry | null> => {
      const response = await handleRequest<ApiResponse<IEnquiry>>(
        API.patch(`/${enquiryId}/assign`, { staffId })
      );
      if (response?.success && response.data) {
        refreshEnquiries();
        return response.data;
      }
      return null;
    },
    [refreshEnquiries]
  );

  const bulkUpload = useCallback(
    async (file: File): Promise<BulkUploadResult | null> => {
      try {
        setError(null);
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post<BulkUploadResult>(
          'http://localhost:8000/api/v1/enquiry/bulk-upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
          }
        );

        if (response.data.success) {
          refreshEnquiries();
        }

        return response.data;
      } catch (err) {
        const error = err as AxiosError<BulkUploadResult>;
        const message =
          error.response?.data?.message ||
          error.message ||
          'Failed to upload file';
        setError(message);
        console.error('Bulk Upload Error:', message);
        return null;
      }
    },
    [refreshEnquiries]
  );

  return {
    enquiries,
    myEnquiries,
    loading,
    error,
    createEnquiry,
    getEnquiryById,
    updateEnquiry,
    deleteEnquiry,
    assignStaff,
    bulkUpload,
    refreshEnquiries,
    isAdmin,
  };
};