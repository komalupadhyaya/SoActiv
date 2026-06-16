// hooks/useStaffAttendance.ts
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

// === Types ===
export interface StaffShort {
  id: string;
  fullName: string;
  position: string;
  email?: string;
  contactNumber?: string;
}

export interface AttendanceRecord {
  _id: string;
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
  checkInTime?: string | null;
  checkOutTime?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface DailyAttendanceSheet {
  date: string;
  totalStaff: number;
  present: number;
  absent: number;
  onLeave: number;
  halfDay: number;
  report: Array<{
    staffId: string;
    fullName: string;
    position: string;
    email: string;
    contactNumber: string;
    status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
    checkInTime: string | null;
    checkOutTime: string | null;
    notes: string;
  }>;
}

interface MonthlyReportEntry {
  staffId: string;
  fullName: string;
  position: string;
  totalDays: number;
  present: number;
  late: number;
  onLeave: number;
  absent: number;
  halfDay: number;
}

interface MonthlyAttendanceReport {
  month: number;
  year: number;
  totalStaff: number;
  report: MonthlyReportEntry[];
}

interface AttendanceByStaffResponse {
  staff: {
    id: string;
    fullName: string;
    position: string;
  };
  totalRecords: number;
  records: AttendanceRecord[];
}

// === Axios Instance ===
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: `${API_URL}/staff-attendance`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// === Hook ===
export const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleError = (err: any): string => {
    const message =
      err.response?.data?.message || err.message || 'Failed to process request';
    addToast(message, 'error');
    return message;
  };

  // === Mark Attendance ===
  const markAttendance = useCallback(
    async (data: {
      staffId: string;
      status?: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
      notes?: string;
      checkInTime?: string;
      timezone?: string;
    }) => {
      setLoading(true);
      try {
        const res = await api.post('/', data);
        return res.data;
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === Update Attendance ===
  const updateAttendance = useCallback(
    async (
      id: string,
      data: Partial<{
        status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
        checkInTime: string;
        checkOutTime: string;
        notes: string;
      }>
    ) => {
      setLoading(true);
      try {
        const res = await api.put(`/${id}`, data);
        return res.data;
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === Get Attendance by Date ===
  const getAttendanceByDate = useCallback(
    async (
      date: string,
      timezone?: string
    ): Promise<{ date: string; count: number; records: AttendanceRecord[] }> => {
      setLoading(true);
      try {
        const res = await api.get(`/date/${date}`, {
          params: { timezone },
        });
        return res.data;
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === Get Daily Attendance Sheet (Full Roster) ===
  const getDailyAttendanceSheet = useCallback(
    async (date: string, timezone?: string): Promise<DailyAttendanceSheet> => {
      setLoading(true);
      try {
        const res = await api.get(`/sheet/${date}`, {
          params: { timezone },
        });
        return res.data;
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === Get Attendance by Staff ===
  const getAttendanceByStaff = useCallback(
    async (
      staffId: string,
      startDate?: string,
      endDate?: string
    ): Promise<AttendanceByStaffResponse> => {
      setLoading(true);
      try {
        const res = await api.get(`/staff/${staffId}`, {
          params: { startDate, endDate },
        });
        return res.data;
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // === Delete Attendance ===
  const deleteAttendance = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await api.delete(`/${id}`);
      return res.data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // === Get Monthly Report ===
  const getMonthlyAttendanceReport = useCallback(
    async (
      month?: number,
      year?: number,
      timezone?: string
    ): Promise<MonthlyAttendanceReport> => {
      setLoading(true);
      try {
        const res = await api.get('/monthly', {
          params: { month, year, timezone },
        });
        return res.data;
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    markAttendance,
    updateAttendance,
    getAttendanceByDate,
    getDailyAttendanceSheet,
    getAttendanceByStaff,
    deleteAttendance,
    getMonthlyAttendanceReport,
    loading,
  };
};