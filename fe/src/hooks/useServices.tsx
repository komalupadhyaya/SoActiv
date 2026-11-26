import { useState, useCallback } from 'react';
import axios from 'axios';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_BASE_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface ServiceVariation {
  _id: string;
  name: string;
  duration?: string;
  price: number;
  sessions?: string | number;
  sacCode?: string;
  description?: string;
  status?: boolean;
  serviceType?: string;
  timeHours?: number;
  timeMinutes?: number;
  daysPerWeek?: string;
  months?: number;
  validityInDays?: number;
  maxMembers?: number;
  tax?: string;
  accessType?: string;
  category?: string;
  otpVerification?: boolean;
  upgradable?: boolean;
  transferable?: boolean;
  appointmentsApplicable?: boolean;
  allowFreeze?: boolean;
  maxFreezeDays?: number;
  minFreezeDays?: number;
  registrationFee?: boolean;
  minFeeLimit?: number;
  maxFeeLimit?: number;
  eligibleForReferralBonus?: boolean;
  referralBonusFromPurchase?: boolean;
  termBatchDate?: boolean;
  promoteOnWebsite?: boolean;
}

export interface ServiceItem {
  _id: string;
  name: string;
  categoryType?: 'brand' | 'aktvity';
  sacCode?: string;
  tax?: number | string;
  description?: string;
  promote: boolean;
  status: boolean;
  order?: number;
  variations: ServiceVariation[];
  createdAt?: string;
  updatedAt?: string;
}

export const useServices = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async (search?: string, activeOnly?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | boolean> = {};
      if (search) params.search = search;
      if (activeOnly) params.activeOnly = true;

      const response = await axios.get(`${API_BASE_URL}/services`, {
        params,
        headers: getAuthHeaders(),
        withCredentials: true,
      });

      if (response.data.success) {
        setServices(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching services:', err);
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  const getServiceById = async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/services/${id}`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        return { success: true, data: response.data.data as ServiceItem };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to fetch service' };
    }
  };

  const createService = async (data: Partial<ServiceItem>) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/services`, data, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to create service' };
    }
  };

  const updateService = async (id: string, data: Partial<ServiceItem>) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/services/${id}`, data, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to update service' };
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/services/${id}`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        await fetchServices();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete service' };
    }
  };

  const togglePromote = async (id: string) => {
    try {
      // Optimistic update
      setServices((prev) =>
        prev.map((s) => (s._id === id ? { ...s, promote: !s.promote } : s))
      );

      await axios.patch(`${API_BASE_URL}/services/${id}/toggle-promote`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      return { success: true };
    } catch (err: any) {
      await fetchServices();
      return { success: false, message: err.response?.data?.message || 'Failed to toggle promote' };
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      // Optimistic update
      setServices((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: !s.status } : s))
      );

      await axios.patch(`${API_BASE_URL}/services/${id}/toggle-status`, {}, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      return { success: true };
    } catch (err: any) {
      await fetchServices();
      return { success: false, message: err.response?.data?.message || 'Failed to toggle status' };
    }
  };

  const addVariation = async (serviceId: string, data: Partial<ServiceVariation>) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/services/${serviceId}/variations`, data, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        await fetchServices();
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to add variation' };
    }
  };

  const toggleVariationStatus = async (serviceId: string, variationId: string) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/services/${serviceId}/variations/${variationId}/toggle-status`,
        {},
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        }
      );
      if (response.data.success) {
        await fetchServices();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to toggle variation status' };
    }
  };

  const deleteVariation = async (serviceId: string, variationId: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/services/${serviceId}/variations/${variationId}`, {
        headers: getAuthHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        await fetchServices();
        return { success: true };
      }
      return { success: false, message: response.data.message };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Failed to delete variation' };
    }
  };

  return {
    services,
    loading,
    error,
    fetchServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    togglePromote,
    toggleStatus,
    addVariation,
    deleteVariation,
    toggleVariationStatus,
  };
};

