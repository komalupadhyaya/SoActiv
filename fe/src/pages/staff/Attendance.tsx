import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance, AttendanceRecord } from '../../hooks/useStaffAttendance';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';

export const Attendance: React.FC = () => {
    const { user } = useAuth();
    const { getAttendanceByStaff, markAttendance, updateAttendance, loading } = useAttendance();
    const navigate = useNavigate();
    const { isToastVisible } = useToast();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

    // ====== ROLE / POSITION CHECKS ======
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isManagerStaff = user?.role === 'staff' && user?.position === 'manager';
    const canViewTeamAttendance = isAdmin || isManagerStaff;

    const now = new Date();
    const isCurrentMonth =
        currentMonth.getMonth() === now.getMonth() &&
        currentMonth.getFullYear() === now.getFullYear();

    // 1. Fetch Today's Record (remains accurate regardless of month selection)
    useEffect(() => {
        const fetchTodayRecord = async () => {
            if (!user?.staffId) return;

            const todayStr = new Date().toISOString().split('T')[0];
            try {
                const res = await getAttendanceByStaff(user.staffId, todayStr, todayStr);
                if (res.records && res.records.length > 0) {
                    setTodayRecord(res.records[0]);
                } else {
                    setTodayRecord(null);
                }
            } catch (error) {
                console.error('Failed to fetch today attendance record', error);
            }
        };

        fetchTodayRecord();
    }, [user?.staffId, getAttendanceByStaff]);

    // 2. Fetch History for Selected Month
    useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.staffId) return;

            const start = startOfMonth(currentMonth).toISOString().split('T')[0];
            const end = endOfMonth(currentMonth).toISOString().split('T')[0];

            try {
                const res = await getAttendanceByStaff(user.staffId, start, end);
                if (res.records) {
                    const uniqueRecords = res.records.reduce((acc: AttendanceRecord[], current: AttendanceRecord) => {
                        const dateKey = new Date(current.date).toISOString().split('T')[0];
                        if (!acc.some(r => new Date(r.date).toISOString().split('T')[0] === dateKey)) {
                            acc.push(current);
                        }
                        return acc;
                    }, []);

                    setHistory(
                        uniqueRecords.sort(
                            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
                        ),
                    );
                }
            } catch (error) {
                console.error('Failed to fetch attendance history', error);
            }
        };

        fetchHistory();
    }, [user?.staffId, currentMonth, getAttendanceByStaff]);

    // Handlers
    const handleCheckIn = async () => {
        if (!user?.staffId || !isCurrentMonth) return;
        try {
            const checkInNow = new Date();
            const res = await markAttendance({
                staffId: user.staffId,
                status: 'present',
                checkInTime: checkInNow.toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });
            if (res.attendance) {
                setTodayRecord(res.attendance);
                // Refresh history
                setHistory((prev) => [res.attendance, ...prev]);
            }
        } catch (error) {
            console.error('Check-in failed', error);
        }
    };

    const handleCheckOut = async () => {
        if (!todayRecord || !isCurrentMonth) return;
        try {
            const checkOutNow = new Date();
            await updateAttendance(todayRecord._id, {
                checkOutTime: checkOutNow.toISOString(),
            });

            // Update local state
            setTodayRecord((prev) =>
                prev ? { ...prev, checkOutTime: checkOutNow.toISOString() } : null,
            );
            setHistory((prev) =>
                prev.map((r) =>
                    r._id === todayRecord._id ? { ...r, checkOutTime: checkOutNow.toISOString() } : r,
                ),
            );
        } catch (error) {
            console.error('Check-out failed', error);
        }
    };

    // Derived State
    const isCheckedOut = !!todayRecord?.checkOutTime;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <CalendarIcon className="w-6 h-6 mr-2 text-orange-500" />
                            My Attendance
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Track your working hours and history.
                        </p>
                    </div>

                    {/* Actions: Team Attendance (only admin / staff manager) + self check-in/out */}
                    <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
                        {canViewTeamAttendance && (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/staff/team-attendance')}
                                disabled={isToastVisible}
                            >
                                Team Attendance
                            </Button>
                        )}

                        {/* Logic: If no record today -> Check In. If record checked in but not out -> Check Out. If checked out -> 'Completed' */}
                        {!todayRecord ? (
                            <Button
                                onClick={handleCheckIn}
                                disabled={!isCurrentMonth || loading}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!isCurrentMonth ? "Check-in is only available for the current month" : ""}
                            >
                                <CheckCircle className="w-4 h-4" /> Check In
                            </Button>
                        ) : !isCheckedOut ? (
                            <Button
                                onClick={handleCheckOut}
                                disabled={!isCurrentMonth || loading}
                                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!isCurrentMonth ? "Check-out is only available for the current month" : ""}
                            >
                                <Clock className="w-4 h-4" /> Check Out
                            </Button>
                        ) : (
                            <Button
                                disabled
                                className="bg-gray-200 text-gray-500 cursor-not-allowed flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" /> Day Completed
                            </Button>
                        )}
                    </div>
                </div>

                {/* History Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                History - {format(currentMonth, 'MMMM yyyy')}
                            </h2>
                            <input
                                type="month"
                                value={format(currentMonth, 'yyyy-MM')}
                                onChange={(e) => setCurrentMonth(new Date(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Check In
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Check Out
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Notes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {history.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-4 text-center text-sm text-gray-500"
                                        >
                                            No records found for this month.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr
                                            key={record._id}
                                            className={
                                                isToday(new Date(record.date))
                                                    ? 'bg-orange-50 dark:bg-orange-900/10'
                                                    : ''
                                            }
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {format(new Date(record.date), 'MMM d, yyyy')}{' '}
                                                {isToday(new Date(record.date)) && (
                                                    <span className="ml-2 text-xs text-orange-600 font-medium">
                                                        (Today)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${record.status === 'present'
                                                            ? 'bg-green-100 text-green-800'
                                                            : record.status === 'absent'
                                                                ? 'bg-red-100 text-red-800'
                                                                : record.status === 'late'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {record.checkInTime
                                                    ? format(new Date(record.checkInTime), 'h:mm a')
                                                    : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {record.checkOutTime
                                                    ? format(new Date(record.checkOutTime), 'h:mm a')
                                                    : '-'}
                                            </td>

                                            {/* Notes: give more width and wrap on small screens */}
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 w-1/2 sm:w-1/3 whitespace-normal break-words">
                                                {record.notes || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
