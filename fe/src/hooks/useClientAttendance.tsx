import { useState, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ClientAttendanceRecord {
  _id: string;
  clientId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  duration?: number;
  status: 'present' | 'absent';
  notes?: string;
  createdAt: string;
}

export const useClientAttendance = () => {
  const [records, setRecords] = useState<ClientAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [hasCheckedOutToday, setHasCheckedOutToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState<ClientAttendanceRecord | null>(null);

  const fetchMyAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/client-attendance/my`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRecords(data.records);

        // Detect today's check-in status from fetched records (comparing local browser dates)
        const today = new Date();
        const tYear = today.getFullYear();
        const tMonth = today.getMonth();
        const tDate = today.getDate();

        const todayRec = data.records.find((r: ClientAttendanceRecord) => {
          const d = new Date(r.date);
          return (
            d.getFullYear() === tYear &&
            d.getMonth() === tMonth &&
            d.getDate() === tDate
          );
        });

        if (todayRec) {
          setHasCheckedInToday(true);
          setTodayRecord(todayRec);
          setHasCheckedOutToday(!!todayRec.checkOutTime);
        } else {
          setHasCheckedInToday(false);
          setTodayRecord(null);
          setHasCheckedOutToday(false);
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchMyAttendance();
  }, [fetchMyAttendance]);

  const checkIn = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_URL}/client-attendance/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const newRecord: ClientAttendanceRecord = data.record;
        setRecords(prev => [newRecord, ...prev]);
        setHasCheckedInToday(true);
        setTodayRecord(newRecord);
        return { success: true, message: 'Checked in successfully!' };
      }

      return { success: false, message: data.message || 'Check-in failed.' };
    } catch {
      return { success: false, message: 'Network error during check-in.' };
    }
  }, []);

  const checkOut = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_URL}/client-attendance/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const updated: ClientAttendanceRecord = data.record;
        setRecords(prev => prev.map(r => (r._id === updated._id ? updated : r)));
        setTodayRecord(updated);
        setHasCheckedOutToday(true);
        return { success: true, message: 'Checked out successfully!' };
      }

      return { success: false, message: data.message || 'Check-out failed.' };
    } catch {
      return { success: false, message: 'Network error during check-out.' };
    }
  }, []);

  const markClientAttendance = useCallback(async (clientId: string, action: 'check-in' | 'check-out', notes?: string): Promise<{ success: boolean; message: string; record?: ClientAttendanceRecord }> => {
    try {
      const res = await fetch(`${API_URL}/client-attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, action, notes }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return { success: true, message: data.message, record: data.record };
      }
      return { success: false, message: data.message || 'Failed to mark attendance.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error.' };
    }
  }, []);

  const fetchTodayLogs = useCallback(async (): Promise<any[]> => {
    try {
      const res = await fetch(`${API_URL}/client-attendance/today-logs`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.records || [];
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch today attendance logs:', err);
      return [];
    }
  }, []);

  return {
    records,
    loading,
    hasCheckedInToday,
    hasCheckedOutToday,
    todayRecord,
    checkIn,
    checkOut,
    fetchMyAttendance,
    markClientAttendance,
    fetchTodayLogs,
  };
};
