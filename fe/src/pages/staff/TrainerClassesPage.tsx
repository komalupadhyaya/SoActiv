import React, { useEffect, useState, useCallback } from 'react';
import {
    Calendar, Clock, Users, CheckCircle, XCircle, FileText,
    X, ChevronRight, BookOpen, Save, AlertCircle
} from 'lucide-react';
import { useGymClass, ClassSession, ClassBooking } from '../../hooks/useGymClass';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function isAttendanceOpen(dateStr: string, time: string): boolean {
    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const sessionStart = new Date(dateStr);
    sessionStart.setHours(h, m, 0, 0);
    const diff = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
    return diff <= 15; // Opens 15 min before class
}

type AttendanceMap = Record<string, 'present' | 'absent'>;

export const TrainerClassesPage: React.FC = () => {
    const {
        classes, sessions, sessionBookings, attendance,
        loading, fetchClasses, fetchSessionsByClass,
        cancelSession, updateSessionNotes,
        fetchSessionAttendance, markAttendance,
    } = useGymClass();

    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
    const [view, setView] = useState<'classes' | 'sessions' | 'attendance'>('classes');
    const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    const openSessions = async (cls: any) => {
        setSelectedClass(cls);
        setView('sessions');
        const today = new Date().toISOString().slice(0, 10);
        await fetchSessionsByClass(cls._id, { from: today });
    };

    const openAttendance = async (session: ClassSession) => {
        setSelectedSession(session);
        setNotes(session.notes || '');
        setView('attendance');
        const result = await fetchSessionAttendance(session._id);
        if (result.success) {
            // Build attendance map from existing records
            const map: AttendanceMap = {};
            result.data.attendance?.forEach((a: any) => {
                map[a.memberId._id || a.memberId] = a.status;
            });
            // Default unset bookings to 'present' pre-checked
            result.data.bookings?.forEach((b: any) => {
                const mid = b.memberId._id || b.memberId;
                if (!map[mid]) map[mid] = 'present';
            });
            setAttendanceMap(map);
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedSession) return;
        setIsSavingNotes(true);
        await updateSessionNotes(selectedSession._id, notes);
        setIsSavingNotes(false);
    };

    const handleSubmitAttendance = async () => {
        if (!selectedSession) return;
        setIsSubmittingAttendance(true);
        const records = sessionBookings
            .filter(b => b.status !== 'cancelled')
            .map(b => ({
                memberId: (b.memberId as any)._id || (b.memberId as any),
                userId: (b.userId as any)._id || (b.userId as any),
                status: attendanceMap[(b.memberId as any)._id] || 'absent',
            }));
        await markAttendance(selectedSession._id, records);
        setIsSubmittingAttendance(false);
    };

    const handleCancelSession = async () => {
        if (!selectedSession) return;
        setIsCancelling(true);
        const result = await cancelSession(selectedSession._id, cancelReason);
        setIsCancelling(false);
        setIsCancelOpen(false);
        if (result.success && selectedClass) {
            setView('sessions');
            await fetchSessionsByClass(selectedClass._id, { from: new Date().toISOString().slice(0, 10) });
        }
    };

    const toggleAttendance = (memberId: string) => {
        setAttendanceMap(prev => ({
            ...prev,
            [memberId]: prev[memberId] === 'present' ? 'absent' : 'present',
        }));
    };

    const markAll = (status: 'present' | 'absent') => {
        const newMap: AttendanceMap = {};
        sessionBookings.filter(b => b.status !== 'cancelled').forEach(b => {
            const mid = (b.memberId as any)._id;
            newMap[mid] = status;
        });
        setAttendanceMap(newMap);
    };

    const presentCount = Object.values(attendanceMap).filter(v => v === 'present').length;
    const absentCount = Object.values(attendanceMap).filter(v => v === 'absent').length;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                    {view !== 'classes' && (
                        <button
                            onClick={() => {
                                if (view === 'attendance') setView('sessions');
                                else setView('classes');
                            }}
                            className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                        >
                            ← Back
                        </button>
                    )}
                    {view === 'classes' && (
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Classes</h1>
                    )}
                    {view === 'sessions' && selectedClass && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClass.name} — Sessions</h1>
                        </div>
                    )}
                    {view === 'attendance' && selectedSession && (
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                            Attendance — {formatDate((selectedSession as any).date)}
                        </h1>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                {/* ─── Classes View ───────────────────────────────────────────── */}
                {view === 'classes' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Classes Assigned</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Your manager will assign you to classes
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map(cls => (
                                    <div key={cls._id}
                                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => openSessions(cls)}>
                                        <div className="h-2" style={{ backgroundColor: cls.color }} />
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{cls.name}</h3>
                                            {cls.description && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{cls.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-500" /> {formatTime(cls.time)}</span>
                                                <span className="flex items-center gap-1"><Users className="w-4 h-4 text-orange-500" /> {cls.capacity}</span>
                                                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-orange-500" /> {cls.durationMinutes}m</span>
                                            </div>
                                            {cls.recurrence.type === 'weekly' && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {[0,1,2,3,4,5,6].map(d => (
                                                        <span key={d} className={`text-xs px-2 py-0.5 rounded-full ${
                                                            cls.recurrence.days.includes(d)
                                                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                                                        }`}>
                                                            {DAY_NAMES[d]}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>{cls.status}</span>
                                                <span className="text-sm text-orange-500 font-medium flex items-center gap-1">
                                                    View Sessions <ChevronRight className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ─── Sessions View ──────────────────────────────────────────── */}
                {view === 'sessions' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Upcoming Sessions</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Sessions will appear here once generated</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map(session => {
                                    const isCancelled = session.status === 'cancelled';
                                    const fillPct = Math.round((session.bookedCount / session.capacity) * 100);
                                    return (
                                        <div key={session._id}
                                            className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-colors ${
                                                isCancelled
                                                    ? 'border-gray-100 dark:border-gray-700 opacity-60'
                                                    : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center w-14">
                                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {new Date(session.date).getDate()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(session.date).toLocaleDateString('en-IN', { month: 'short' })}
                                                        </p>
                                                        <p className="text-xs text-orange-500 font-semibold">
                                                            {DAY_NAMES[new Date(session.date).getDay()]}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white">
                                                            {formatTime(session.time)} – {formatTime(session.endTime)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {session.bookedCount}/{session.capacity} booked
                                                            </span>
                                                        </div>
                                                        {/* Capacity bar */}
                                                        <div className="w-40 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${fillPct >= 90 ? 'bg-red-500' : fillPct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                                style={{ width: `${fillPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : session.status === 'completed' ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {session.status}
                                                    </span>

                                                    {!isCancelled && (
                                                        <>
                                                            <button
                                                                onClick={() => openAttendance(session)}
                                                                disabled={!isAttendanceOpen(session.date, session.time)}
                                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                                    isAttendanceOpen(session.date, session.time)
                                                                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                                                                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                                                                }`}
                                                                title={!isAttendanceOpen(session.date, session.time) ? "Attendance opens 15 minutes before the class starts" : undefined}
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5" /> Attendance
                                                            </button>
                                                            <button
                                                                onClick={() => { setSelectedSession(session); setIsCancelOpen(true); }}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Cancel session"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {session.notes && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">📝 {session.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ─── Attendance View ────────────────────────────────────────── */}
                {view === 'attendance' && selectedSession && (
                    <div className="max-w-2xl mx-auto space-y-4">
                        {/* Session info card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Session</p>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        {formatDate(selectedSession.date)} · {formatTime(selectedSession.time)} – {formatTime(selectedSession.endTime)}
                                    </p>
                                </div>
                                <div className="flex gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-green-500">{presentCount}</p>
                                        <p className="text-xs text-gray-500">Present</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-red-500">{absentCount}</p>
                                        <p className="text-xs text-gray-500">Absent</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bulk actions */}
                        <div className="flex gap-2">
                            <button onClick={() => markAll('present')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> All Present
                            </button>
                            <button onClick={() => markAll('absent')}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> All Absent
                            </button>
                        </div>

                        {/* Member attendance list */}
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : sessionBookings.filter(b => b.status !== 'cancelled').length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">No members booked this session yet</p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {sessionBookings.filter(b => b.status !== 'cancelled').map((booking, idx) => {
                                    const memberId = (booking.memberId as any)._id;
                                    const isPresent = attendanceMap[memberId] === 'present';
                                    const memberName = (booking.memberId as any).fullName || 'Member';

                                    return (
                                        <div key={booking._id}
                                            className={`flex items-center justify-between px-4 py-3 ${idx !== 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
                                                    {memberName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">{memberName}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{(booking.memberId as any).email}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleAttendance(memberId)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                                    isPresent
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                }`}
                                            >
                                                {isPresent
                                                    ? <><CheckCircle className="w-4 h-4" /> Present</>
                                                    : <><XCircle className="w-4 h-4" /> Absent</>
                                                }
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Session Notes */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <FileText className="inline w-4 h-4 mr-1" /> Session Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                placeholder="e.g. Focus on flexibility. Bring yoga mat."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                                onClick={handleSaveNotes} disabled={isSavingNotes}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-3.5 h-3.5" /> {isSavingNotes ? 'Saving...' : 'Save Notes'}
                            </button>
                        </div>

                        {/* Submit attendance button */}
                        <button
                            onClick={handleSubmitAttendance} disabled={isSubmittingAttendance || sessionBookings.filter(b => b.status !== 'cancelled').length === 0}
                            className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-base hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <CheckCircle className="w-5 h-5" />
                            {isSubmittingAttendance ? 'Submitting...' : 'Submit Attendance'}
                        </button>
                    </div>
                )}
            </div>

            {/* Cancel Session Modal */}
            {isCancelOpen && selectedSession && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Session</h2>
                            <button onClick={() => setIsCancelOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    <AlertCircle className="inline w-4 h-4 mr-1" />
                                    Booked members will receive a cancellation notification.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                                    rows={2} placeholder="e.g. Trainer unwell"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsCancelOpen(false)}
                                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                                    Keep Session
                                </button>
                                <button onClick={handleCancelSession} disabled={isCancelling}
                                    className="px-5 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50">
                                    {isCancelling ? 'Cancelling...' : 'Cancel Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainerClassesPage;
