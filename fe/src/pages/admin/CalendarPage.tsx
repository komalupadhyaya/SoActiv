import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Calendar as CalendarIcon, X } from 'lucide-react';
import { useSchedule, Schedule } from '../../hooks/useSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { ScheduleFormModal } from '../../components/schedule/ScheduleFormModal';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const TYPE_COLORS: Record<string, string> = {
  followup: 'bg-blue-500 text-white',
  pt_expiry: 'bg-red-500 text-white',
  membership_expiry: 'bg-orange-500 text-white',
  task: 'bg-green-500 text-white',
  admin_task: 'bg-green-700 text-white',
  manager_task: 'bg-green-600 text-white',
  holiday: 'bg-red-500 text-white', // Red as requested
  class: 'bg-yellow-500 text-white',
  'member-session': 'bg-teal-500 text-white',
  'self-reminder': 'bg-gray-500 text-white',
  'member-checkin': 'bg-indigo-500 text-white'
};

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const { fetchSchedules, schedules, deleteScheduleEvent, completeScheduleEvent } = useSchedule();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Filters State
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Popover for selected day

  // Permissions
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isManager = user?.position === 'manager';
  const canCreate = isAdmin || isManager;

  // Fetch on mount and when date changes
  useEffect(() => {
    // We fetch "all" and filter client-side or we could pass date range to backend
    fetchSchedules({});
  }, [fetchSchedules, currentDate]);

  // Filter Logic
  const filteredEvents = schedules.filter(event => {
    // Type Filter
    if (filterType !== 'all') {
      if (filterType === 'followup') {
        if (event.type !== 'followup' && !event.relatedFollowUp) return false;
      } else if (filterType === 'expiry') {
        if (!['pt_expiry', 'membership_expiry'].includes(event.type)) return false;
      } else if (filterType === 'tasks') {
        if (!['task', 'admin_task', 'manager_task'].includes(event.type)) return false;
      } else if (filterType === 'holidays') {
        if (event.type !== 'holiday') return false;
      } else {
        if (event.type !== filterType) return false;
      }
    }

    // "My Tasks" Filter (for Admin/Manager who see all)
    // HOLIDAY: Always show regardless of assignment
    if (showOnlyMyTasks && user && event.type !== 'holiday') {
      const isAssignedToUser = event.assignedTo?.some(s => s.email === user.email); // safer check via email
      if (!isAssignedToUser) return false;
    }

    return true;
  });

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event =>
      isSameDay(new Date(event.scheduledDate), date)
    );
  };

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setIsDetailsOpen(true);
  };

  const handleCreateClick = () => {
    setSelectedEvent(null);
    setSelectedDate(null); // Clear selected date so form starts empty
    setIsFormModalOpen(true);
  };

  const handleEditClick = (event: Schedule) => {
    setSelectedEvent(event);
    setIsFormModalOpen(true);
    setIsDetailsOpen(false); // Close details
  };

  const handleEventAction = async (event: Schedule, action: 'complete' | 'delete') => {
    if (action === 'complete') {
      await completeScheduleEvent(event._id, 'Completed from Calendar');
    } else if (action === 'delete') {
      if (await confirm('Are you sure you want to delete this event?', { title: 'Delete Event' })) {
        await deleteScheduleEvent(event._id);
      }
    }
  };

  // Calendar Grid Generation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header / Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-orange-500" />
            {format(currentDate, 'MMMM yyyy')}
          </h1>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={handlePreviousMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleToday} className="px-3 py-1 text-sm font-medium">
              Today
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-sm"
          >
            <option value="all">All Events</option>
            <option value="followup">Follow-up Only</option>
            <option value="holidays">Holidays Only</option>
            <option value="tasks">Tasks Only</option>
            <option value="expiry">Expiries Only</option>
          </select>

          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyMyTasks}
              onChange={(e) => setShowOnlyMyTasks(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span>Assigned to Me</span>
          </label>

          {canCreate && (
            <Button onClick={handleCreateClick} className="bg-orange-600 text-white flex items-center gap-2">
              <Plus size={16} />
              <span>Add Event</span>
            </Button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-auto">
        {/* Week Header */}
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 flex-1 auto-rows-fr">
          {days.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`
                                    min-h-[100px] md:min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors
                                    ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-400'}
                                    ${isCurrentDay ? 'ring-2 ring-orange-500' : ''}
                                    hover:border-orange-300 dark:hover:border-orange-700
                                `}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium ${isCurrentDay ? 'text-orange-600' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-xs bg-gray-100 text-white dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event._id}
                      className={`text-white text-xs px-1.5 py-0.5 rounded truncate ${TYPE_COLORS[event.type] || 'bg-gray-500'}`}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Popup/Modal */}
      {isDetailsOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {format(selectedDate, 'EEEE, MMMM do, yyyy')}
              </h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {getEventsForDay(selectedDate).length === 0 ? (
                <p className="text-center text-gray-500 py-8">No events on this day.</p>
              ) : (
                getEventsForDay(selectedDate).map(event => {
                  const isAssignedStaff = event.assignedTo?.some(s => s.email === user?.email);
                  const canComplete = event.type !== 'followup' || isAssignedStaff;
                  const canEditEvent = event.type === 'followup' ? isAdmin : canCreate;

                  return (
                    <div key={event._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${TYPE_COLORS[event.type] || 'bg-gray-500'}`} />
                          <span className="font-medium text-gray-900 dark:text-white">{event.title}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {event.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                        {event.description || 'No description'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {event.startTime ? `${event.startTime} - ${event.endTime}` : event.scheduledTime}
                        </div>
                        {event.assignedTo && event.assignedTo.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users size={12} />
                            {event.assignedTo.length} Staff
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        {event.type !== 'holiday' && canComplete && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEventAction(event, 'complete')}
                            disabled={event.status === 'completed'}
                            className={event.status === 'completed' ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200' : ''}
                          >
                            {event.status === 'completed' ? 'Completed' : 'Complete'}
                          </Button>
                        )}
                        {canEditEvent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(event)}
                            disabled={event.status === 'completed'}
                            className={event.status === 'completed' ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200' : ''}
                          >
                            Edit
                          </Button>
                        )}
                        {canEditEvent && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30"
                            onClick={() => handleEventAction(event, 'delete')}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              {canCreate && (
                <Button onClick={() => {
                  handleCreateClick();
                  // Set date to selected date
                  // We need to pass initialData with date? 
                  // ScheduleFormModal takes populated initialData or nothing.
                  // Better to just open form, user picks date.
                  // Or we can enhance Modal to accept initialDate?
                  // For now, simple open.
                }}>
                  Add New Event
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ScheduleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          fetchSchedules({});
          setIsFormModalOpen(false);
        }}
        initialData={selectedEvent}
        defaultDate={selectedEvent ? undefined : (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined)}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </div>
  );
};
