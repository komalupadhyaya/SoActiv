import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../hooks/useStaffAttendance';

interface AttendanceRow {
  staffId: string;
  fullName: string;
  position: string;
  email: string;
  contactNumber: string;
  status: 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string;
  attendanceId?: string;
}

const STATUS_OPTIONS: Array<'present' | 'absent' | 'late' | 'on-leave' | 'half-day'> = [
  'present',
  'late',
  'absent',
  'on-leave',
  'half-day',
];

// ✅ Convert ISO to HH:mm for input[type="time"]
const isoToTime = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toTimeString().slice(0, 5); // HH:mm
};

// ✅ Merge time string (HH:mm) with date part of ISO
const mergeTimeWithDate = (isoDate: string, timeStr: string): string => {
  const date = new Date(isoDate);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate.toISOString();
};

export const AttendanceSheet: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone); // Auto-detect
  const [localData, setLocalData] = useState<AttendanceRow[]>([]);

  const {
    getDailyAttendanceSheet,
    markAttendance,
    updateAttendance,
    loading,
    error,
    clearError,
  } = useAttendance();

  // Fetch sheet on date change
  useEffect(() => {
    const fetchSheet = async () => {
      if (!date) return;

      try {
        const data = await getDailyAttendanceSheet(date, timezone);
        if (Array.isArray(data?.report)) {
          setLocalData(data.report);
        } else {
          console.warn('Invalid or missing report data:', data);
          setLocalData([]);
        }
      } catch (err) {
        console.error('Failed to fetch attendance sheet:', err);
        setLocalData([]);
      }
    };

    fetchSheet();
  }, [date, getDailyAttendanceSheet, timezone]);

  // ✅ Handle status change with smart time clearing
  const handleStatusChange = async (row: AttendanceRow, newStatus: string) => {
    const status = newStatus as 'present' | 'absent' | 'late' | 'on-leave' | 'half-day';
    const now = new Date().toISOString();

    const shouldAutoCheckIn = ['present', 'late'].includes(status) && !row.checkInTime;
    const shouldClearCheckTimes = ['absent', 'on-leave'].includes(status);

    const payload: any = { status };

    if (shouldAutoCheckIn) payload.checkInTime = now;
    if (shouldClearCheckTimes) {
      payload.checkInTime = undefined;
      payload.checkOutTime = undefined;
    }

    try {
      if (row.attendanceId) {
        await updateAttendance(row.attendanceId, payload);

        setLocalData((prev) =>
          prev.map((r) =>
            r.staffId === row.staffId
              ? {
                  ...r,
                  status,
                  checkInTime: shouldAutoCheckIn
                    ? now
                    : shouldClearCheckTimes
                    ? null
                    : r.checkInTime,
                  checkOutTime: shouldClearCheckTimes ? null : r.checkOutTime,
                }
              : r
          )
        );
      } else {
        const res = await markAttendance({
          staffId: row.staffId,
          status,
          checkInTime: shouldAutoCheckIn ? now : undefined,
          timezone,
        });

        const newRecord = res.attendance;
        setLocalData((prev) =>
          prev.map((r) =>
            r.staffId === row.staffId
              ? {
                  ...r,
                  status,
                  checkInTime: shouldAutoCheckIn ? now : newRecord.checkInTime || null,
                  checkOutTime: null,
                  attendanceId: newRecord._id,
                }
              : r
          )
        );
      }
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // Handle manual Check-In time edit
  const handleCheckInTimeChange = async (row: AttendanceRow, timeStr: string) => {
    if (!timeStr || !date) return;

    const isoDateTime = mergeTimeWithDate(date, timeStr);

    try {
      if (row.attendanceId) {
        await updateAttendance(row.attendanceId, {
          checkInTime: isoDateTime,
          status: ['absent', 'on-leave'].includes(row.status) ? 'present' : row.status,
        });

        setLocalData((prev) =>
          prev.map((r) =>
            r.staffId === row.staffId
              ? {
                  ...r,
                  checkInTime: isoDateTime,
                  status: ['absent', 'on-leave'].includes(r.status) ? 'present' : r.status,
                }
              : r
          )
        );
      } else {
        const res = await markAttendance({
          staffId: row.staffId,
          status: 'present',
          checkInTime: isoDateTime,
          timezone,
        });

        const newRecord = res.attendance;
        setLocalData((prev) =>
          prev.map((r) =>
            r.staffId === row.staffId
              ? {
                  ...r,
                  status: 'present',
                  checkInTime: newRecord.checkInTime,
                  attendanceId: newRecord._id,
                }
              : r
          )
        );
      }
    } catch (err) {
      alert('Failed to update check-in time.');
    }
  };

  // Handle manual Check-Out time edit
  const handleCheckOutTimeChange = async (row: AttendanceRow, timeStr: string) => {
    if (!row.checkInTime || !timeStr || !date) return;

    const isoDateTime = mergeTimeWithDate(date, timeStr);

    if (new Date(isoDateTime) <= new Date(row.checkInTime)) {
      alert('Check-out time must be after check-in time.');
      return;
    }

    try {
      if (row.attendanceId) {
        await updateAttendance(row.attendanceId, { checkOutTime: isoDateTime });
        setLocalData((prev) =>
          prev.map((r) =>
            r.staffId === row.staffId ? { ...r, checkOutTime: isoDateTime } : r
          )
        );
      }
    } catch (err) {
      alert('Failed to update check-out time.');
    }
  };

  // Handle Notes Change
  const handleNotesChange = async (row: AttendanceRow, notes: string) => {
    try {
      if (row.attendanceId) {
        await updateAttendance(row.attendanceId, { notes });
      }
      setLocalData((prev) =>
        prev.map((r) => (r.staffId === row.staffId ? { ...r, notes } : r))
      );
    } catch (err) {
      alert('Failed to save notes.');
    }
  };

  // Summary Stats
  const totalPresent = localData.filter((r) => r.status === 'present').length;
  const totalLate = localData.filter((r) => r.status === 'late').length;
  const totalAbsent = localData.filter((r) => r.status === 'absent').length;
  const totalOnLeave = localData.filter((r) => r.status === 'on-leave').length;
  const totalHalfDay = localData.filter((r) => r.status === 'half-day').length;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>📅 Daily Attendance Sheet</h2>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Date:{' '}
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clearError();
            }}
          />
        </label>
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <p>Loading attendance sheet...</p>
      ) : (
        <>
          <div style={{ marginBottom: '15px', color: '#555' }}>
            <strong>Summary:</strong>{' '}
            Present: <b>{totalPresent}</b> |{' '}
            Late: <b>{totalLate}</b> |{' '}
            Half-Day: <b>{totalHalfDay}</b> |{' '}
            Absent: <b>{totalAbsent}</b> |{' '}
            On Leave: <b>{totalOnLeave}</b> |{' '}
            Total: <b>{localData.length}</b>
          </div>

          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Name</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Position</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Status</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Check-In</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Check-Out</th>
                <th style={{ padding: '10px', border: '1px solid #ccc' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {localData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#777' }}>
                    No staff records found for this date.
                  </td>
                </tr>
              ) : (
                localData.map((row) => {
                  const showCheckInInput = ['present', 'late', 'half-day'].includes(row.status);
                  const canEditCheckOut =
                    row.checkInTime &&
                    ['present', 'late', 'half-day'].includes(row.status) &&
                    !['absent', 'on-leave'].includes(row.status);

                  return (
                    <tr key={row.staffId} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                        <div>
                          <strong>{row.fullName}</strong>
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>{row.email}</div>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>{row.position}</td>

                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                        <select
                          value={row.status}
                          onChange={(e) => handleStatusChange(row, e.target.value)}
                          style={{ width: '100%', padding: '5px' }}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                        {showCheckInInput ? (
                          <input
                            type="time"
                            value={isoToTime(row.checkInTime)}
                            onChange={(e) => handleCheckInTimeChange(row, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px',
                              fontSize: '0.9em',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.9em' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'center' }}>
                        {canEditCheckOut ? (
                          <input
                            type="time"
                            value={isoToTime(row.checkOutTime)}
                            onChange={(e) => handleCheckOutTimeChange(row, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px',
                              fontSize: '0.9em',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                            }}
                          />
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.9em' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                        <textarea
                          value={row.notes}
                          onChange={(e) => handleNotesChange(row, e.target.value)}
                          placeholder="Add notes..."
                          style={{
                            width: '100%',
                            fontSize: '0.9em',
                            padding: '5px',
                            minHeight: '40px',
                            resize: 'vertical',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};