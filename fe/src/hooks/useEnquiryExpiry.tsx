import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { Enquiry } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface ExpiringEnquiriesData {
  total: number;
  expired: number;
  expiringSoon: number;
  enquiries: Enquiry[];
  categories: {
    expired: Enquiry[];
    expiringSoon: Enquiry[];
  };
}

export const useEnquiryExpiry = () => {
  const [expiringEnquiries, setExpiringEnquiries] = useState<ExpiringEnquiriesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Fetch expiring enquiries
  const fetchExpiringEnquiries = useCallback(async (days: number = 7) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/enquiry/expiring?days=${days}`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setExpiringEnquiries(data.data);
      } else {
        const msg = data.message || 'Failed to fetch expiring enquiries';
        setError(msg);
        addToast(msg, 'error');
      }
    } catch (err: any) {
      const msg = err.message || 'Network error';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Extend enquiry expiry
  const extendEnquiryExpiry = async (id: string, additionalDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/enquiry/${id}/extend-expiry`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additionalDays }),
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Refresh the expiring enquiries list
        await fetchExpiringEnquiries();
        addToast('Enquiry expiry extended successfully', 'success');
        return { success: true, data: data.data };
      } else {
        const msg = data.message || 'Failed to extend enquiry expiry';
        setError(msg);
        addToast(msg, 'error');
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Network error';
      setError(msg);
      addToast(msg, 'error');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    expiringEnquiries,
    loading,
    error,
    fetchExpiringEnquiries,
    extendEnquiryExpiry,
  };
};

