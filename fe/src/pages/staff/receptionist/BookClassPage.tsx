import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Users,
  Clock,
  Dumbbell,
  Search,
  X,
  ArrowLeft,
  Calendar
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
  const { classes, fetchClasses, sessions, fetchUpcomingSessions, staffBookSession } = useGymClass();
  const { clients, refresh: refreshClients } = useClient();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingMemberId, setBookingMemberId] = useState('');
  const [booking, setBooking] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [viewingClassSessionsId, setViewingClassSessionsId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
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

  const handleSelectTab = (tabId: string) => {
    setSelectedClassFilter(tabId);
    setViewingClassSessionsId(null); // Show Class Cards view filtered by tab!
  };

  const handleOpenSessions = (classId: string) => {
    setSelectedClassFilter(classId);
    setViewingClassSessionsId(classId); // Switch to Session Cards view!
  };

  const availSessions = useMemo(() => sessions.filter(s => s.status !== 'cancelled'), [sessions]);

  // Combined Class definitions list from API classes and available sessions
  const allClassesList = useMemo(() => {
    const map = new Map<string, { gymClass: any; count: number }>();

    classes.forEach(c => {
      map.set(c._id, { gymClass: c, count: 0 });
    });

    availSessions.forEach(s => {
      const cls = s.classId && typeof s.classId === 'object' ? (s.classId as any) : null;
      const clsId = cls?._id || (typeof s.classId === 'string' ? s.classId : null);
      if (clsId) {
        if (!map.has(clsId) && cls) {
          map.set(clsId, { gymClass: cls, count: 0 });
        }
        const item = map.get(clsId);
        if (item) {
          item.count += 1;
        }
      }
    });

    return Array.from(map.values());
  }, [classes, availSessions]);

  // Unique class options for filter tabs
  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    allClassesList.forEach(({ gymClass }) => {
      if (gymClass._id && gymClass.name) {
        map.set(gymClass._id, gymClass.name);
      }
    });
    return Array.from(map.entries());
  }, [allClassesList]);

  // Filtered Class List based on tab filter & search query
  const filteredClassList = useMemo(() => {
    return allClassesList.filter(({ gymClass }) => {
      const matchesTab = selectedClassFilter === 'all' || gymClass._id === selectedClassFilter;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const classNameMatch = gymClass?.name?.toLowerCase().includes(q);
      const trainerMatch = gymClass?.trainerId?.fullName?.toLowerCase().includes(q);
      const notesMatch = (gymClass?.notes || gymClass?.description)?.toLowerCase().includes(q);
      return classNameMatch || trainerMatch || notesMatch;
    });
  }, [allClassesList, selectedClassFilter, searchQuery]);

  // Filtered Sessions when viewing specific class sessions
  const filteredSessions = useMemo(() => {
    if (!viewingClassSessionsId) return [];
    return availSessions.filter(s => {
      const cls = s.classId && typeof s.classId === 'object' ? (s.classId as any) : null;
      const trainer = s.trainerId && typeof s.trainerId === 'object' ? (s.trainerId as any) : null;
      const clsId = cls?._id || s.classId;

      const matchesCategory = clsId === viewingClassSessionsId;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const classNameMatch = cls?.name?.toLowerCase().includes(q);
      const trainerMatch = trainer?.fullName?.toLowerCase().includes(q);
      const notesMatch = cls?.notes?.toLowerCase().includes(q);

      return classNameMatch || trainerMatch || notesMatch;
    });
  }, [availSessions, viewingClassSessionsId, searchQuery]);

  // Active class name for breadcrumbs
  const activeViewingClassName = useMemo(() => {
    if (!viewingClassSessionsId) return '';
    const item = allClassesList.find(c => c.gymClass._id === viewingClassSessionsId);
    return item?.gymClass?.name || 'Class';
  }, [viewingClassSessionsId, allClassesList]);

  // Card component for Master Class
  const ClassCard = ({ gymClass, sessionCount }: { gymClass: any; sessionCount: number }) => {
    const trainer = gymClass.trainerId && typeof gymClass.trainerId === 'object' ? gymClass.trainerId : null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md flex flex-col justify-between h-full min-h-[250px]">
        {gymClass.color && <div className="h-1.5" style={{ backgroundColor: gymClass.color || '#F97316' }} />}
        <div className="p-5 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{gymClass.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-orange-500" /> {gymClass.capacity || 20} capacity
                  </span>
                  {gymClass.durationMinutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-500" /> {gymClass.durationMinutes} min
                    </span>
                  )}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
              </span>
            </div>

            {trainer && (
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {trainer.fullName?.charAt(0)}
                </div>
                <span className="font-medium text-xs truncate">{trainer.fullName}</span>
              </div>
            )}

            {(gymClass.notes || gymClass.description) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 mb-4 line-clamp-2">
                📝 {gymClass.notes || gymClass.description}
              </p>
            )}
          </div>

          <button
            onClick={() => handleOpenSessions(gymClass._id)}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-500 hover:text-white transition-all text-center flex items-center justify-center gap-1 border border-orange-200 dark:border-orange-800/50 shadow-sm"
          >
            View Sessions <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Card component for Individual Session
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

        {/* Search input for Browse Classes */}
        <div className="relative mt-4 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={viewingClassSessionsId ? "Search sessions..." : "Search classes by name, trainer, or notes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-gray-700 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 py-6 overflow-auto">
        {/* Category Filters */}
        {classOptions.length > 0 && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <button
              onClick={() => handleSelectTab('all')}
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
                onClick={() => handleSelectTab(id)}
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

        {/* Back button if currently viewing specific class sessions */}
        {viewingClassSessionsId && (
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setViewingClassSessionsId(null)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Classes ({activeViewingClassName})
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing upcoming sessions ({filteredSessions.length})
            </span>
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : !viewingClassSessionsId ? (
          /* Render Class Cards when in Class view (filtered by selected tab) */
          filteredClassList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No Matching Classes Found' : 'No Classes Available'}
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchQuery ? 'Try searching with a different term' : 'Check back soon for new gym classes'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClassList.map(({ gymClass, count }) => (
                <ClassCard key={gymClass._id} gymClass={gymClass} sessionCount={count} />
              ))}
            </div>
          )
        ) : (
          /* Render Session Cards when user clicked "View Sessions" on a specific class */
          filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                No Upcoming Sessions Found
              </h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                No sessions scheduled for this class at the moment
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSessions.map((session: any) => (
                <SessionCard key={session._id} session={session} />
              ))}
            </div>
          )
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
