import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface CleaningTemplate {
  _id?: string;
  adminId?: string;
  assignedTo: string;
  items: string[];
}

export interface ChecklistItem {
  _id: string;
  taskName: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface CleaningChecklist {
  _id: string;
  adminId: string;
  assignedTo: string | { _id: string; fullName: string; position: string; email: string };
  dateStr: string;
  items: ChecklistItem[];
  status: 'pending' | 'completed';
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useCleaning = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const getTemplate = useCallback(async (cleanerId: string): Promise<CleaningTemplate | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cleaning/template/${cleanerId}`, {
        credentials: 'include'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        return result.data;
      } else {
        console.error(result.message || 'Failed to fetch cleaning template');
        return null;
      }
    } catch (err: any) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTemplate = useCallback(async (cleanerId: string, items: string[]): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cleaning/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanerId, items }),
        credentials: 'include'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        addToast(result.message || 'Template saved successfully', 'success');
        return true;
      } else {
        addToast(result.message || 'Failed to save template', 'error');
        return false;
      }
    } catch (err: any) {
      addToast(err.message || 'An error occurred while saving', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getTodayChecklist = useCallback(async (dateStr: string): Promise<CleaningChecklist | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cleaning/today?dateStr=${dateStr}`, {
        credentials: 'include'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        return result.data;
      } else {
        console.error(result.message || 'Failed to fetch checklist');
        return null;
      }
    } catch (err: any) {
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleItem = useCallback(async (itemId: string, completed: boolean): Promise<CleaningChecklist | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cleaning/today/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
        credentials: 'include'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        return result.data;
      } else {
        addToast(result.message || 'Failed to toggle item', 'error');
        return null;
      }
    } catch (err: any) {
      addToast(err.message || 'An error occurred', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const completeChecklist = useCallback(async (dateStr: string): Promise<CleaningChecklist | null> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/cleaning/today/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateStr }),
        credentials: 'include'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        addToast(result.message || 'All items marked as completed', 'success');
        return result.data;
      } else {
        addToast(result.message || 'Failed to complete checklist', 'error');
        return null;
      }
    } catch (err: any) {
      addToast(err.message || 'An error occurred', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const getLogs = useCallback(async (cleanerId?: string, dateStr?: string): Promise<CleaningChecklist[]> => {
    setLoading(true);
    try {
      let url = `${API_URL}/cleaning/logs?`;
      if (cleanerId) url += `cleanerId=${cleanerId}&`;
      if (dateStr) url += `dateStr=${dateStr}&`;

      const res = await fetch(url, { credentials: 'include' });
      const result = await res.json();
      if (res.ok && result.success) {
        return result.data || [];
      } else {
        console.error(result.message || 'Failed to fetch historical cleaning logs');
        return [];
      }
    } catch (err: any) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getTemplate,
    saveTemplate,
    getTodayChecklist,
    toggleItem,
    completeChecklist,
    getLogs
  };
};
