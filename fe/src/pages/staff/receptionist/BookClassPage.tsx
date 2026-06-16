import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Users,
  Clock,
  Dumbbell
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { useGymClass } from '../../../hooks/useGymClass';
import { useClient } from '../../../hooks/useClient';
import { useToast } from '../../../contexts/ToastContext';

function formatTime(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

const BookClassPage: React.FC = () => {
  const { sessions, fetchUpcomingSessions, staffBookSession } = useGymClass();
  const { clients, refresh: refreshClients } = useClient();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingMemberId, setBookingMemberId] = useState('');
  const [booking, setBooking] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUpcomingSessions(undefined, 30),
        refreshClients(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!bookingMemberId || !selectedSession) return;
    setBooking(true);
    const res = await staffBookSession(selectedSession._id, bookingMemberId);
    setBooking(false);
    if (res.success) {
      addToast('Class booked successfully!', 'success');
      setIsBookingOpen(false);
      setBookingMemberId('');
      setSelectedSession(null);
      fetchUpcomingSessions(undefined, 30);
    }
  };

  const openBooking = (session: any) => {
    setSelectedSession(session);
    setBookingMemberId('');
    setIsBookingOpen(true);
  };

  const availSessions = useMemo(() => sessions.filter(s => s.status !== 'cancelled'), [sessions]);

  // Get unique classes from availSessions for filter
  const classOptions = useMemo(() => {
    return Array.from(new Map(
      availSessions.map(s => {
        const cls = typeof s.classId === 'string' ? null : s.classId as any;
        return cls ? [cls._id, cls.name] : null;
      }).filter(Boolean) as [string, string][]
    ).entries());
  }, [availSessions]);

  const filteredSessions = useMemo(() => {
    return selectedClassFilter === 'all'
      ? availSessions
      : availSessions.filter(s => {
          const cls = s.classId && typeof s.classId === 'object' ? (s.classId as any)._id : s.classId;
          return cls === selectedClassFilter;
        });
  }, [availSessions, selectedClassFilter]);

  const SessionCard = ({ session }: { session: any }) => {
    const cls = session.classId && typeof session.classId === 'object' ? (session.classId as any) : null;
    const trainer = session.trainerId && typeof session.trainerId === 'object' ? (session.trainerId as any) : null;
    const isFull = session.bookedCount >= session.capacity;
    const available = session.capacity - session.bookedCount;
    const fillPct = Math.round((session.bookedCount / session.capacity) * 100);

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
        session.status === 'cancelled'
          ? 'border-gray-100 dark:border-gray-700 opacity-60'
          : 'border-gray-100 dark:border-gray-700 shadow-sm'
      }`}>
        {cls && <div className="h-1.5" style={{ backgroundColor: cls.color || '#F97316' }} />}
        <div className="p-4 flex flex-col justify-between h-full min-h-[260px]">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{cls?.name || 'Class'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatDate(session.date)} · {formatTime(session.time)} – {formatTime(session.endTime)}
                </p>
              </div>
              {session.status === 'cancelled' ? (
                <span className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-medium whitespace-nowrap flex-shrink-0">Cancelled</span>
              ) : isFull ? (
                <span className="text-xs px-2.5 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium whitespace-nowrap flex-shrink-0">Full</span>
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
          </div>

          {/* Action button */}
          {session.status !== 'cancelled' && (
            isFull ? (
              <button
                disabled
                className="w-full py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed text-center"
              >
                Class Full
              </button>
            ) : (
              <button
                onClick={() => openBooking(session)}
                className="w-full py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all text-center flex items-center justify-center gap-1"
              >
                Book Member <ChevronRight size={14} />
              </button>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 -m-6 p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Classes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Browse and book gym classes</p>
          </div>
          <button
            onClick={loadData}
            className="text-sm text-orange-500 hover:text-orange-600 font-medium transition flex items-center gap-1"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
          >
            🔍 Browse Classes
          </button>
        </div>
      </div>

      <div className="flex-1 py-6 overflow-auto">
        {/* Category Filters */}
        {classOptions.length > 0 && (
          <div className="flex gap-2 mb-5 flex-wrap">
            <button
              onClick={() => setSelectedClassFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedClassFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              All Classes
            </button>
            {classOptions.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setSelectedClassFilter(id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedClassFilter === id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Upcoming Classes</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back soon for new class schedules</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session: any) => (
              <SessionCard key={session._id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Booking Confirmation Modal */}
      <Modal
        isOpen={isBookingOpen}
        onClose={() => { setIsBookingOpen(false); setSelectedSession(null); setBookingMemberId(''); }}
        title={`Book Class: ${selectedSession?.classId?.name || 'Session'}`}
      >
        <div className="space-y-5">
          {/* Session summary */}
          <div className="bg-orange-50/60 dark:bg-orange-950/10 border border-orange-200/40 rounded-xl p-4 space-y-1.5 text-sm">
            <p><span className="font-bold text-gray-600 dark:text-gray-400">Date:</span> {selectedSession ? new Date(selectedSession.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
            <p><span className="font-bold text-gray-600 dark:text-gray-400">Time:</span> {selectedSession ? `${formatTime(selectedSession.time)} – ${formatTime(selectedSession.endTime)}` : ''}</p>
            <p><span className="font-bold text-gray-600 dark:text-gray-400">Trainer:</span> {selectedSession?.trainerId?.fullName || 'Not assigned'}</p>
            <p><span className="font-bold text-gray-600 dark:text-gray-400">Remaining Slots:</span> {selectedSession ? (selectedSession.capacity - selectedSession.bookedCount) : 0}</p>
          </div>

          {/* Member selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Choose Member to Book *</label>
            <Select
              value={bookingMemberId}
              onChange={(v) => setBookingMemberId(v)}
              options={[
                { value: '', label: 'Select Active Gym Member' },
                ...clients.filter(c => c.status === 'active').map(c => ({
                  value: c._id,
                  label: `${c.fullName} (${c.contactNumber})`
                }))
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => { setIsBookingOpen(false); setSelectedSession(null); setBookingMemberId(''); }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBook}
              disabled={!bookingMemberId || booking}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md animate-in fade-in zoom-in-95 duration-150"
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookClassPage;
