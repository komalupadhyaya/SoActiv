import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useClientAttendance, type ClientAttendanceRecord } from '../../hooks/useClientAttendance';
import { useSchedule } from '../../hooks/useSchedule';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import {
  CalendarDays,
  Clock,
  Flame,
  MapPin,
  CheckCircle,
  Search,
  Sparkles,
  LogOut as CheckOutIcon,
  Loader2
} from 'lucide-react';

// ─── Helper: format time from ISO string ──────────────────────────────────────
const formatTime = (isoStr?: string): string => {
  if (!isoStr) return '--';
  const d = new Date(isoStr);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// ─── Helper: format duration in minutes to "Xh Ym" ──────────────────────────
const formatDuration = (minutes?: number): string => {
  if (!minutes) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const MemberAttendance: React.FC = () => {
  const { user } = useAuth();
  const {
    records,
    loading,
    hasCheckedInToday,
    hasCheckedOutToday,
    todayRecord,
    checkIn,
    checkOut,
  } = useClientAttendance();
  const { schedules, fetchSchedules } = useSchedule();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSchedules({ type: 'holiday' });
  }, [fetchSchedules]);

  // ── Handle Check-In ──────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    if (hasCheckedInToday || actionLoading || isTodayRestDay) return;
    setActionLoading(true);
    setActionMsg(null);
    const result = await checkIn();
    setActionMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setActionLoading(false);
  };

  // ── Handle Check-Out ─────────────────────────────────────────────────────
  const handleCheckOut = async () => {
    if (!hasCheckedInToday || hasCheckedOutToday || actionLoading) return;
    setActionLoading(true);
    setActionMsg(null);
    const result = await checkOut();
    setActionMsg({ type: result.success ? 'success' : 'error', text: result.message });
    setActionLoading(false);
  };

  // ── Derive Last Visit ────────────────────────────────────────────────────
  const lastVisit = useMemo(() => {
    if (records.length === 0) return '--';
    const latest = records[0];
    const d = new Date(latest.date);
    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} at ${formatTime(latest.checkInTime)}`;
  }, [records]);

  // ── Monthly Stats ────────────────────────────────────────────────────────
  const monthlyStats = useMemo(() => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    const thisMonthRecords = records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === month && d.getFullYear() === year && r.status === 'present';
    });

    let possibleDays = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      
      const isSunday = d.getDay() === 0;

      const isHoliday = schedules.some((s) => {
        if (s.type !== 'holiday') return false;

        const hDate = new Date(s.scheduledDate);
        const isSameDay =
            hDate.getFullYear() === d.getFullYear() &&
            hDate.getMonth() === d.getMonth() &&
            d.getDate() === hDate.getDate();
        if (isSameDay) return true;

        if (s.startDate && s.endDate) {
            const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const sTime = new Date(new Date(s.startDate).getFullYear(), new Date(s.startDate).getMonth(), new Date(s.startDate).getDate()).getTime();
            const eTime = new Date(new Date(s.endDate).getFullYear(), new Date(s.endDate).getMonth(), new Date(s.endDate).getDate()).getTime();
            return dTime >= sTime && dTime <= eTime;
        }
        return false;
      });

      if (!isSunday && !isHoliday) {
        possibleDays++;
      }
    }

    const rate = possibleDays > 0 ? Math.round((thisMonthRecords.length / possibleDays) * 100) : 0;
    return { present: thisMonthRecords.length, total: possibleDays, rate };
  }, [records, schedules]);

  // ── Streak ───────────────────────────────────────────────────────────────
  const currentStreak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkedInSet = new Set(
      records
        .filter(r => r.status === 'present')
        .map(r => {
          const d = new Date(r.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
    );

    let streak = 0;
    let checkDate = new Date(today);

    if (!checkedInSet.has(today.getTime())) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      if (checkDate.getDay() === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      if (checkedInSet.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [records]);

  // ── Calendar Grid ────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const checkedInDays = new Set(
      records
        .filter(r => {
          const d = new Date(r.date);
          return d.getMonth() === month && d.getFullYear() === year && r.status === 'present';
        })
        .map(r => new Date(r.date).getDate())
    );

    const days: any[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ empty: true, key: `pad-${i}` });

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);

      // Check if this date has a scheduled holiday
      const hasHoliday = schedules.some((s) => {
        if (s.type !== 'holiday') return false;

        const hDate = new Date(s.scheduledDate);
        const isSameDay =
            hDate.getFullYear() === d.getFullYear() &&
            hDate.getMonth() === d.getMonth() &&
            d.getDate() === hDate.getDate();
        if (isSameDay) return true;

        if (s.startDate && s.endDate) {
            const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            const sTime = new Date(new Date(s.startDate).getFullYear(), new Date(s.startDate).getMonth(), new Date(s.startDate).getDate()).getTime();
            const eTime = new Date(new Date(s.endDate).getFullYear(), new Date(s.endDate).getMonth(), new Date(s.endDate).getDate()).getTime();
            return dTime >= sTime && dTime <= eTime;
        }
        return false;
      });

      days.push({
        empty: false,
        day,
        isSunday: d.getDay() === 0,
        isHoliday: hasHoliday,
        isToday: day === today.getDate(),
        isFuture: d > today,
        isCheckedIn: checkedInDays.has(day),
        key: `day-${day}`,
      });
    }
    return days;
  }, [records, schedules]);

  // ── Today Rest Day Check ──────────────────────────────────────────────────
  const isTodayRestDay = useMemo(() => {
    const todayItem = calendarDays.find(d => !d.empty && d.isToday);
    if (!todayItem) {
      const today = new Date();
      if (today.getDay() === 0) return true;
      return schedules.some((s) => {
        if (s.type !== 'holiday') return false;
        const hDate = new Date(s.scheduledDate);
        const isSameDay =
            hDate.getFullYear() === today.getFullYear() &&
            hDate.getMonth() === today.getMonth() &&
            today.getDate() === hDate.getDate();
        if (isSameDay) return true;

        if (s.startDate && s.endDate) {
            const dTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            const sTime = new Date(new Date(s.startDate).getFullYear(), new Date(s.startDate).getMonth(), new Date(s.startDate).getDate()).getTime();
            const eTime = new Date(new Date(s.endDate).getFullYear(), new Date(s.endDate).getMonth(), new Date(s.endDate).getDate()).getTime();
            return dTime >= sTime && dTime <= eTime;
        }
        return false;
      });
    }
    return todayItem.isSunday || todayItem.isHoliday;
  }, [calendarDays, schedules]);

  // ── Filtered Log ─────────────────────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return records.filter(r => {
      const dateStr = new Date(r.date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric', weekday: 'long'
      });
      return (
        dateStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatTime(r.checkInTime).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDuration(r.duration).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [records, searchTerm]);

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading your attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <CalendarDays className="w-7 h-7 mr-3 text-orange-500" />
              Attendance Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your real-time gym check-in records, monthly progress, and active streak.
            </p>
          </div>

          {/* Check-In / Check-Out Buttons */}
          <div className="flex items-center gap-3">
            {/* Check-In */}
            <button
              onClick={handleCheckIn}
              disabled={hasCheckedInToday || actionLoading || isTodayRestDay}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg ${
                hasCheckedInToday
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 cursor-default'
                  : isTodayRestDay
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-700 cursor-not-allowed shadow-none'
                  : actionLoading
                  ? 'bg-orange-400 text-white cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white hover:scale-105 active:scale-95'
              }`}
            >
              {hasCheckedInToday ? (
                <><CheckCircle className="w-4 h-4" /> Checked In</>
              ) : isTodayRestDay ? (
                <><CheckCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Closed (Rest Day)</>
              ) : actionLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Checking In...</>
              ) : (
                <><MapPin className="w-4 h-4 animate-bounce" /> Check In</>
              )}
            </button>

            {/* Check-Out — only shown after check-in */}
            {hasCheckedInToday && (
              <button
                onClick={handleCheckOut}
                disabled={hasCheckedOutToday || actionLoading}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 shadow-lg ${
                  hasCheckedOutToday
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700 cursor-default'
                    : actionLoading
                    ? 'bg-gray-400 text-white cursor-wait animate-pulse'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {hasCheckedOutToday ? (
                  <><CheckCircle className="w-4 h-4" /> Checked Out</>
                ) : (
                  <><CheckOutIcon className="w-4 h-4" /> Check Out</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Feedback Message */}
        {actionMsg && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
            actionMsg.type === 'success'
              ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}>
            {actionMsg.text}
          </div>
        )}

        {/* Today's Session Info */}
        {todayRecord && (
          <div className="mb-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider">Today's Check-In</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatTime(todayRecord.checkInTime)}</p>
            </div>
            {todayRecord.checkOutTime && (
              <>
                <div>
                  <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider">Check-Out</p>
                  <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatTime(todayRecord.checkOutTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider">Session Duration</p>
                  <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatDuration(todayRecord.duration)}</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Checked Visit</p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1.5">{lastVisit}</h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-orange-500" />
                  Most recent gym session
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Attendance Rate</p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">{monthlyStats.rate}%</h3>
                  <span className="text-xs text-gray-400">({monthlyStats.present}/{monthlyStats.total} Days)</span>
                </div>
                <div className="w-36 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${monthlyStats.rate}%` }} />
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Gym Streak</p>
                <h3 className="text-2xl font-extrabold text-orange-500 mt-1.5 flex items-center">
                  {currentStreak} Days
                  <Flame className="w-6 h-6 ml-2 text-amber-500 animate-pulse fill-amber-500" />
                </h3>
                <p className="text-xs text-gray-400 mt-1">Sundays excluded</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                  Monthly Attendance Block Matrix
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5" />Present</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 mr-1.5" />Rest Day</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5" />Absent</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-2.5 text-center font-semibold text-xs text-gray-500 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2.5">
                {calendarDays.map((item) => {
                  if (item.empty) return <div key={item.key} className="h-10" />;
                  let bgClass = 'bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold shadow-sm'; // Default is Absent (red)
                  if (item.isSunday || item.isHoliday) bgClass = 'bg-gray-200 dark:bg-gray-950 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-800/40 cursor-not-allowed';
                  else if (item.isCheckedIn) bgClass = 'bg-gradient-to-br from-green-500 to-emerald-600 text-white font-bold shadow-sm';
                  else if (item.isToday) bgClass = 'bg-orange-500 text-white font-bold animate-pulse shadow-md ring-4 ring-orange-200 dark:ring-orange-950/40';
                  else if (item.isFuture) bgClass = 'bg-gray-100/30 dark:bg-gray-800/20 text-gray-300';
                  return (
                    <div key={item.key} className={`h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${bgClass}`}>
                      {item.day}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Gym Rules</h2>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm text-gray-600 dark:text-gray-400">
              {[
                'Scan your RFID card or use the Self Check-In button on this page when you arrive.',
                'Check-Out updates your session duration in real time and is saved to your permanent record.',
                'Sundays are rest days — closed for sanitization. These do not count against your streak.',
              ].map((rule, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p>{rule}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Scrollable Check-In Log */}
        <Card>
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Complete Check-in Log History</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {records.length} real records from database
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search date, check-in time, duration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {records.length === 0 ? 'No attendance records yet. Check in today to get started!' : 'No matching records found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 font-medium">
                      <th className="py-3 px-6">Date</th>
                      <th className="py-3 px-6">Day</th>
                      <th className="py-3 px-6">Check-In</th>
                      <th className="py-3 px-6">Check-Out</th>
                      <th className="py-3 px-6">Duration</th>
                      <th className="py-3 px-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => {
                      const d = new Date(item.date);
                      return (
                        <tr key={item._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-gray-900 dark:text-white">
                            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3.5 px-6 text-gray-500 dark:text-gray-400">
                            {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                          </td>
                          <td className="py-3.5 px-6 text-gray-700 dark:text-gray-300 font-medium">
                            {formatTime(item.checkInTime)}
                          </td>
                          <td className="py-3.5 px-6 text-gray-500 dark:text-gray-400">
                            {formatTime(item.checkOutTime)}
                          </td>
                          <td className="py-3.5 px-6 font-mono text-gray-900 dark:text-white font-medium">
                            {formatDuration(item.duration)}
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 inline-flex items-center">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberAttendance;
