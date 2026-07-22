import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck2,
  User,
  CheckCircle,
  ClipboardList,
  Clock,
  RefreshCw,
  Calendar,
  Tag,
  AlertCircle,
  Edit,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useSchedule, Schedule } from '../../../hooks/useSchedule';
import { useClient } from '../../../hooks/useClient';
import { useStaff } from '../../../hooks/useStaff';
import { useToast } from '../../../contexts/ToastContext';

const TYPE_LABELS: Record<string, string> = {
  'member-session': 'Assessment / Consultation',
  'task': 'Gym Tour',
  'followup': 'Follow-up',
  'class': 'Class',
  'self-reminder': 'Reminder',
  'admin_task': 'Admin Task',
  'manager_task': 'Manager Task',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  rescheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const BookAppointmentPage: React.FC = () => {
  const { createScheduleEvent, updateScheduleEvent, schedules, fetchSchedules, loading: schedulesLoading } = useSchedule();
  const { clients, refresh: refreshClients } = useClient();
  const { staff, fetchAllStaff } = useStaff();
  const { addToast } = useToast();

  const getLocalDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const ITEMS_PER_PAGE = 4;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAppointment, setEditingAppointment] = useState<Schedule | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'member-session',
    scheduledDate: '',
    scheduledTime: '',
    assignedStaff: '',
    relatedMember: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshClients(),
        fetchAllStaff(),
        fetchSchedules({ filter: 'upcoming' }),
      ]);
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  };

  const trainers = useMemo(() => staff.filter(s => s.position === 'trainer' && s.status === 'active'), [staff]);
  const salesStaff = useMemo(() => staff.filter(s => s.position === 'sales' && s.status === 'active'), [staff]);

  // Filter to only appointment-type events (exclude holidays/classes)
  const appointments = useMemo(() => {
    const apptTypes = ['member-session', 'task', 'followup', 'self-reminder', 'admin_task', 'manager_task'];
    return schedules
      .filter(s => apptTypes.includes(s.type))
      .filter(s => filterStatus === 'all' || s.status === filterStatus)
      .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [schedules, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(appointments.length / ITEMS_PER_PAGE));
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return appointments.slice(start, start + ITEMS_PER_PAGE);
  }, [appointments, currentPage]);

  const handleEditClick = (appt: Schedule) => {
    setEditingAppointment(appt);
    
    // Format date correctly to YYYY-MM-DD
    let formattedDate = '';
    if (appt.scheduledDate) {
      const d = new Date(appt.scheduledDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }

    setForm({
      title: appt.title || '',
      description: appt.description || '',
      type: appt.type || 'member-session',
      scheduledDate: formattedDate,
      scheduledTime: appt.scheduledTime || appt.startTime || '',
      assignedStaff: appt.assignedTo?.[0]?._id || '',
      relatedMember: typeof appt.relatedMember === 'object' ? appt.relatedMember?._id : (appt.relatedMember || ''),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledDate || !form.scheduledTime) {
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    if (form.scheduledDate < getLocalDateString()) {
      addToast('Scheduled date cannot be in the past', 'warning');
      return;
    }

    const titleWordCount = form.title.trim().split(/\s+/).filter(Boolean).length;
    if (titleWordCount > 15) {
      addToast('Title cannot exceed 15 words', 'warning');
      return;
    }
    if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(form.title)) {
      addToast('Title can only contain letters, numbers, spaces, and basic punctuation', 'warning');
      return;
    }

    if (form.description) {
      const notesWordCount = form.description.trim().split(/\s+/).filter(Boolean).length;
      if (notesWordCount > 15) {
        addToast('no more than 15 words to be entered in Notes', 'warning');
        return;
      }
    }

    setSubmitting(true);
    const payload = {
      title: form.title,
      description: form.description,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      type: form.type,
      assignedTo: form.assignedStaff ? [form.assignedStaff] : [],
      relatedMember: form.relatedMember || undefined,
      isEditable: true,
    };

    if (editingAppointment) {
      const res = await updateScheduleEvent(editingAppointment._id, payload);
      setSubmitting(false);
      if (res.success) {
        setSubmitted(true);
        setEditingAppointment(null);
        setForm({
          title: '',
          description: '',
          type: 'member-session',
          scheduledDate: '',
          scheduledTime: '',
          assignedStaff: '',
          relatedMember: '',
        });
        // Refresh appointments list
        fetchSchedules({ filter: 'upcoming' });
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        addToast(res.message || 'Failed to update appointment', 'error');
      }
    } else {
      const res = await createScheduleEvent(payload);
      setSubmitting(false);
      if (res.success) {
        setSubmitted(true);
        setForm({
          title: '',
          description: '',
          type: 'member-session',
          scheduledDate: '',
          scheduledTime: '',
          assignedStaff: '',
          relatedMember: '',
        });
        // Refresh appointments list
        fetchSchedules({ filter: 'upcoming' });
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        addToast(res.message || 'Failed to book appointment', 'error');
      }
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Book Appointment</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Schedule PT consultations, gym tours, or assessment sessions.
          </p>
        </div>
        <button
          onClick={() => fetchSchedules({ filter: 'upcoming' })}
          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <CalendarCheck2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Upcoming</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {appointments.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {appointments.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Trainers</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{trainers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Booking Form (2/5) */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-orange-500" />
                {editingAppointment ? 'Edit Appointment' : 'New Appointment'}
              </h2>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200/60 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                  <CheckCircle size={15} />
                  Appointment saved successfully!
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      required
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. PT Assessment for John"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={form.type}
                      onChange={v => setForm({ ...form, type: v })}
                      options={[
                        { value: 'member-session', label: 'Trainer Assessment / Consultation' },
                        { value: 'task', label: 'Gym Walk-in Tour' },
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Related Member</label>
                    <Select
                      value={form.relatedMember}
                      onChange={v => setForm({ ...form, relatedMember: v })}
                      options={[
                        { value: '', label: 'No Member (General Guest)' },
                        ...clients.map(c => ({ value: c._id, label: `${c.fullName} (${c.contactNumber})` }))
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        required
                        min={getLocalDateString()}
                        value={form.scheduledDate}
                        onChange={e => setForm({ ...form, scheduledDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="time"
                        required
                        value={form.scheduledTime}
                        onChange={e => setForm({ ...form, scheduledTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Assign Trainer / Staff</label>
                    <Select
                      value={form.assignedStaff}
                      onChange={v => setForm({ ...form, assignedStaff: v })}
                      options={[
                        { value: '', label: 'Select (optional)' },
                        ...trainers.map(t => ({ value: t._id, label: `${t.fullName} (Trainer)` })),
                        ...salesStaff.map(s => ({ value: s._id, label: `${s.fullName} (Sales)` })),
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Notes</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-700/80 rounded-xl p-3 bg-transparent text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
                      placeholder="Any special notes..."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingAppointment(null);
                        setForm({
                          title: '', description: '', type: 'member-session',
                          scheduledDate: '', scheduledTime: '', assignedStaff: '', relatedMember: '',
                        });
                      }}
                      className="flex-1"
                    >
                      {editingAppointment ? 'Cancel' : 'Clear'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          {editingAppointment ? 'Saving...' : 'Booking...'}
                        </span>
                      ) : (
                        editingAppointment ? 'Save Changes' : 'Book Appointment'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Booked Appointments List (3/5) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-orange-500" />
                  Booked Appointments
                </h2>
                {/* Status Filter */}
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'pending', 'completed', 'cancelled'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                        filterStatus === s
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {schedulesLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold">No appointments found.</p>
                  <p className="text-xs">Book one using the form on the left.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedAppointments.map((appt: Schedule) => (
                      <div key={appt._id} className="p-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition">
                        <div className="flex items-start justify-between gap-3">
                          {/* Left info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                {appt.title}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${STATUS_STYLES[appt.status] || ''}`}>
                                {appt.status}
                              </span>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {formatDate(appt.scheduledDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatTime(appt.scheduledTime || appt.startTime || '')}
                              </span>
                            </div>

                            {/* Type badge */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full">
                                <Tag size={9} />
                                {TYPE_LABELS[appt.type] || appt.type}
                              </span>

                              {/* Related member */}
                              {appt.relatedMember && typeof appt.relatedMember === 'object' && (
                                <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                  <User size={9} />
                                  {(appt.relatedMember as any).fullName}
                                </span>
                              )}
                            </div>

                            {/* Assigned staff */}
                            {appt.assignedTo && appt.assignedTo.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                                <User size={9} className="shrink-0" />
                                Assigned to: {appt.assignedTo.map(s => s.fullName).join(', ')}
                              </div>
                            )}

                            {/* Description */}
                            {appt.description && (
                              <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 italic">
                                📝 {appt.description}
                              </p>
                            )}
                          </div>

                          {/* Edit Button */}
                          {appt.status === 'pending' && (
                            <button
                              onClick={() => handleEditClick(appt)}
                              className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl transition shrink-0 self-center"
                              title="Edit Appointment"
                            >
                              <Edit size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {appointments.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, appointments.length)}–{Math.min(currentPage * ITEMS_PER_PAGE, appointments.length)} of {appointments.length}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Previous page"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                              currentPage === page
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Next page"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
