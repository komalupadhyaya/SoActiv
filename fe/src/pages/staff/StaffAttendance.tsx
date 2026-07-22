
import React, { useState, useEffect } from 'react';
import { useAttendance } from '../../hooks/useStaffAttendance';
import { useToast } from '../../contexts/ToastContext';

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

const isoToTime = (iso: string | null): string => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toTimeString().slice(0, 5); // HH:mm
};

const mergeTimeWithDate = (isoDate: string, timeStr: string): string => {
    const date = new Date(isoDate);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate.toISOString();
};

export const StaffAttendance: React.FC = () => {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [timezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [localData, setLocalData] = useState<AttendanceRow[]>([]);

    const {
        getDailyAttendanceSheet,
        markAttendance,
        updateAttendance,
        loading,
    } = useAttendance();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchSheet = async () => {
            if (!date) return;

            try {
                const data = await getDailyAttendanceSheet(date, timezone);
                if (Array.isArray(data?.report)) {
                    // Filter out managers and admins
                    const staffOnly = data.report.filter(item =>
                        !['manager', 'admin', 'superadmin'].includes(item.position)
                    );
                    setLocalData(staffOnly);
                } else {
                    setLocalData([]);
                }
            } catch (err) {
                console.error('Failed to fetch attendance sheet:', err);
                setLocalData([]);
            }
        };

        fetchSheet();
    }, [date, getDailyAttendanceSheet, timezone]);

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
            // Toast handled in hook
        }
    };

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
            // Toast handled in hook
        }
    };

    const handleCheckOutTimeChange = async (row: AttendanceRow, timeStr: string) => {
        if (!row.checkInTime || !timeStr || !date) return;
        const isoDateTime = mergeTimeWithDate(date, timeStr);

        if (new Date(isoDateTime) <= new Date(row.checkInTime)) {
            addToast('Check-out time must be after check-in time.', 'error');
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
            // Toast handled in hook
        }
    };

    const handleNotesChange = (row: AttendanceRow, notes: string) => {
        setLocalData((prev) =>
            prev.map((r) => (r.staffId === row.staffId ? { ...r, notes } : r))
        );
    };

    const handleNotesBlur = async (row: AttendanceRow) => {
        try {
            if (row.attendanceId) {
                await updateAttendance(row.attendanceId, { notes: row.notes });
            }
        } catch (err) {
            // Toast handled in hook
        }
    };

    const totalPresent = localData.filter((r) => r.status === 'present').length;
    const totalLate = localData.filter((r) => r.status === 'late').length;
    const totalAbsent = localData.filter((r) => r.status === 'absent').length;
    const totalOnLeave = localData.filter((r) => r.status === 'on-leave').length;
    const totalHalfDay = localData.filter((r) => r.status === 'half-day').length;

    return (
        <div className="p-4 mx-auto font-sans bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span role="img" aria-label="calendar" className="text-3xl">📝</span> Team Attendance
            </h2>

            <div className="mb-6 flex flex-wrap items-center gap-4">
                <label className="text-gray-700 dark:text-gray-300 font-semibold">
                    Date:
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="ml-2 px-3 py-1 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                </label>

                <div className="text-gray-600 dark:text-gray-400 text-sm flex flex-wrap gap-x-4 gap-y-1">
                    <div><strong>Present:</strong> {totalPresent}</div>
                    <div><strong>Late:</strong> {totalLate}</div>
                    <div><strong>Half-Day:</strong> {totalHalfDay}</div>
                    <div><strong>Absent:</strong> {totalAbsent}</div>
                    <div><strong>On Leave:</strong> {totalOnLeave}</div>
                    <div><strong>Total:</strong> {localData.length}</div>
                </div>
            </div>

            {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Loading attendance sheet...</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                                {['Name', 'Position', 'Status', 'Check-In', 'Check-Out', 'Notes'].map(header => (
                                    <th
                                        key={header}
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                            {localData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No relevant staff records found for this date.
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
                                        <tr key={row.staffId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{row.fullName}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 capitalize">{row.position}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <select
                                                    value={row.status}
                                                    onChange={(e) => handleStatusChange(row, e.target.value)}
                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 px-2 py-1 focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-900"
                                                >
                                                    {STATUS_OPTIONS.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt.charAt(0).toUpperCase() + opt.slice(1).replace('-', ' ')}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {showCheckInInput ? (
                                                    <input
                                                        type="time"
                                                        value={isoToTime(row.checkInTime)}
                                                        onChange={(e) => handleCheckInTimeChange(row, e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-900"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {canEditCheckOut ? (
                                                    <input
                                                        type="time"
                                                        value={isoToTime(row.checkOutTime)}
                                                        onChange={(e) => handleCheckOutTimeChange(row, e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-900"
                                                    />
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-600">—</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <textarea
                                                    value={row.notes}
                                                    onChange={(e) => handleNotesChange(row, e.target.value)}
                                                    onBlur={() => handleNotesBlur(row)}
                                                    placeholder="Add notes..."
                                                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 p-2 min-h-[40px] resize-y focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-900"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
