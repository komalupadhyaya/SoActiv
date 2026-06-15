import React, { useEffect, useState } from 'react';
import {
    Calendar, Clock, Users, CheckCircle, BookOpen,
    X, QrCode, Tag, ChevronDown, AlertCircle, Dumbbell
} from 'lucide-react';
import { useGymClass, ClassSession, ClassBooking } from '../../hooks/useGymClass';

function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short'
    });
}

function isCheckInOpen(dateStr: string, time: string): boolean {
    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const sessionStart = new Date(dateStr);
    sessionStart.setHours(h, m, 0, 0);
    const diff = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
    return diff <= 60 && diff >= -30; // 60 min before to 30 min after
}

type Tab = 'browse' | 'my-bookings';

export const MemberClassesPage: React.FC = () => {
    const {
        sessions, bookings, loading,
        fetchUpcomingSessions, fetchMyBookings,
        bookSession, cancelBooking, selfCheckIn,
    } = useGymClass();

    const [activeTab, setActiveTab] = useState<Tab>('browse');
    const [bookingInProgress, setBookingInProgress] = useState<string | null>(null);
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
    const [bookedSessionIds, setBookedSessionIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchUpcomingSessions(undefined, 30);
        fetchMyBookings({ upcoming: true });
    }, [fetchUpcomingSessions, fetchMyBookings]);

    // Track which sessions the member has already booked
    useEffect(() => {
        const ids = new Set<string>();
        bookings.forEach(b => {
            if (b.status === 'booked' || b.status === 'checked_in') {
                const sid = typeof b.sessionId === 'string' ? b.sessionId : (b.sessionId as ClassSession)._id;
                ids.add(sid);
            }
        });
        setBookedSessionIds(ids);
    }, [bookings]);

    const handleBook = async (sessionId: string) => {
        setBookingInProgress(sessionId);
        await bookSession(sessionId);
        setBookingInProgress(null);
        // Refresh both lists
        fetchUpcomingSessions(undefined, 30);
        fetchMyBookings({ upcoming: true });
    };

    const handleCancel = async (bookingId: string) => {
        setCancelling(bookingId);
        await cancelBooking(bookingId);
        setCancelling(null);
        fetchUpcomingSessions(undefined, 30);
        fetchMyBookings({ upcoming: true });
    };

    const handleCheckIn = async (bookingId: string) => {
        setCheckingIn(bookingId);
        await selfCheckIn(bookingId);
        setCheckingIn(null);
        fetchMyBookings({ upcoming: true });
    };

    // Get unique classes from sessions for filter
    const classOptions = Array.from(new Map(
        sessions.map(s => {
            const cls = typeof s.classId === 'string' ? null : s.classId as any;
            return cls ? [cls._id, cls.name] : null;
        }).filter(Boolean) as [string, string][]
    ).entries());

    const filteredSessions = selectedClassFilter === 'all'
        ? sessions
        : sessions.filter(s => {
            const cls = s.classId && typeof s.classId === 'object' ? (s.classId as any)._id : s.classId;
            return cls === selectedClassFilter;
        });

    const SessionCard = ({ session }: { session: ClassSession }) => {
        const cls = session.classId && typeof session.classId === 'object' ? (session.classId as any) : null;
        const trainer = session.trainerId && typeof session.trainerId === 'object' ? (session.trainerId as any) : null;
        const isFull = session.bookedCount >= session.capacity;
        const available = session.capacity - session.bookedCount;
        const isBooked = bookedSessionIds.has(session._id);
        const isBooking = bookingInProgress === session._id;
        const canCheckIn = isCheckInOpen(session.date, session.time);

        const fillPct = Math.round((session.bookedCount / session.capacity) * 100);

        return (
            <div className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
                session.status === 'cancelled'
                    ? 'border-gray-100 dark:border-gray-700 opacity-60'
                    : 'border-gray-100 dark:border-gray-700'
            }`}>
                {cls && <div className="h-1.5" style={{ backgroundColor: cls.color || '#F97316' }} />}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{cls?.name || 'Class'}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {formatDate(session.date)} · {formatTime(session.time)} – {formatTime(session.endTime)}
                            </p>
                        </div>
                        {session.status === 'cancelled' ? (
                            <span className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-medium whitespace-nowrap flex-shrink-0">Cancelled</span>
                        ) : isFull && !isBooked ? (
                            <span className="text-xs px-2.5 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium whitespace-nowrap flex-shrink-0">Full</span>
                        ) : isBooked ? (
                            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                                <CheckCircle className="w-3 h-3" /> Booked
                            </span>
                        ) : (
                            <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                                <Users className="w-3 h-3" /> {available} left
                            </span>
                        )}
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>{session.bookedCount} booked</span>
                            <span>{session.capacity} capacity</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    fillPct >= 90 ? 'bg-red-500' : fillPct >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${fillPct}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-sm text-gray-500 dark:text-gray-400">
                        {trainer && (
                            <span className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                                    {trainer.fullName?.charAt(0)}
                                </div>
                                {trainer.fullName}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {cls?.durationMinutes ? `${cls.durationMinutes} min` : ''}
                        </span>
                    </div>

                    {cls?.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 mb-3 line-clamp-2">
                            📝 {cls.notes}
                        </p>
                    )}

                    {/* Action button */}
                    {session.status !== 'cancelled' && (
                        isBooked ? (
                            <button
                                disabled
                                className="w-full py-2 rounded-xl text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 cursor-default text-center"
                            >
                                ✓ Already Booked
                            </button>
                        ) : isFull ? (
                            <button
                                disabled
                                className="w-full py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed text-center"
                            >
                                Class Full
                            </button>
                        ) : (
                            <button
                                onClick={() => handleBook(session._id)}
                                disabled={bookingInProgress === session._id}
                                className="w-full py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all text-center"
                            >
                                {bookingInProgress === session._id ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                                        Booking...
                                    </span>
                                ) : (
                                    'Book Slot'
                                )}
                            </button>
                        )
                    )}
                </div>
            </div>
        );
    };

    const BookingCard = ({ booking }: { booking: ClassBooking }) => {
        const session = typeof booking.sessionId === 'object' ? booking.sessionId as ClassSession : null;
        const cls = booking.classId && typeof booking.classId === 'object' ? booking.classId as any : null;
        if (!session) return null;

        const canCheckin = isCheckInOpen(session.date, session.time);
        const isActive = booking.status === 'booked';
        const isCheckedIn = booking.status === 'checked_in';

        return (
            <div className={`bg-white dark:bg-gray-800 rounded-xl border p-4 transition-shadow ${
                booking.status === 'cancelled' ? 'opacity-50 border-gray-100 dark:border-gray-700' : 'border-gray-100 dark:border-gray-700 hover:shadow-sm'
            }`}>
                {cls && <div className="w-full h-1 rounded-full mb-3" style={{ backgroundColor: cls.color || '#F97316' }} />}
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{cls?.name || 'Class'}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(session.date)} · {formatTime(session.time)}
                        </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        booking.status === 'booked' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : booking.status === 'checked_in' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : booking.status === 'attended' ? 'bg-purple-100 text-purple-700'
                        : booking.status === 'cancelled' ? 'bg-gray-100 text-gray-500'
                        : 'bg-red-100 text-red-600'
                    }`}>
                        {booking.status === 'checked_in' ? '✓ Checked In'
                            : booking.status === 'attended' ? '✓ Attended'
                            : booking.status}
                    </span>
                </div>

                {session.notes && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                        📝 {session.notes}
                    </p>
                )}

                <div className="flex gap-2 mt-3 flex-wrap">
                    {isActive && canCheckin && (
                        <button
                            onClick={() => handleCheckIn(booking._id)}
                            disabled={checkingIn === booking._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                            <QrCode className="w-3.5 h-3.5" />
                            {checkingIn === booking._id ? 'Checking in...' : 'Check In Now'}
                        </button>
                    )}
                    {isActive && (
                        <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={cancelling === booking._id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            {cancelling === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                    )}
                    {isCheckedIn && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> You're checked in!
                        </p>
                    )}
                    {isActive && !canCheckin && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Check-in opens 60 min before class
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse and book gym classes</p>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
                    {(['browse', 'my-bookings'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400'
                            }`}
                        >
                            {tab === 'browse' ? '🔍 Browse Classes' : '📅 My Bookings'}
                            {tab === 'my-bookings' && bookings.filter(b => b.status === 'booked' || b.status === 'checked_in').length > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[10px] font-bold">
                                    {bookings.filter(b => b.status === 'booked' || b.status === 'checked_in').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                {/* ─── Browse Tab ─────────────────────────────────────────────────── */}
                {activeTab === 'browse' && (
                    <>
                        {/* Filter */}
                        {classOptions.length > 1 && (
                            <div className="flex gap-2 mb-4 flex-wrap">
                                <button
                                    onClick={() => setSelectedClassFilter('all')}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        selectedClassFilter === 'all'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    All Classes
                                </button>
                                {classOptions.map(([id, name]) => (
                                    <button
                                        key={id}
                                        onClick={() => setSelectedClassFilter(id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            selectedClassFilter === id
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Upcoming Classes</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for new class schedules</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredSessions.map(session => (
                                    <SessionCard key={session._id} session={session} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ─── My Bookings Tab ────────────────────────────────────────────── */}
                {activeTab === 'my-bookings' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Bookings Yet</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Browse upcoming classes and book your slot!
                                </p>
                                <button
                                    onClick={() => setActiveTab('browse')}
                                    className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                                >
                                    Browse Classes
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 max-w-2xl">
                                {bookings.map(b => <BookingCard key={b._id} booking={b} />)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MemberClassesPage;
