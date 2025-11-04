import React, { useEffect, useState } from 'react';
import { useEnquiryExpiry } from '../../hooks/useEnquiryExpiry';
import { usePTExpiry } from '../../hooks/usePTExpiry';
import { useFollowUp } from '../../hooks/useFollowUp';
import { 
  // Calendar,
   AlertCircle, Dumbbell, Bell, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { expiringEnquiries, fetchExpiringEnquiries } = useEnquiryExpiry();
  const { expiringPT, fetchExpiringPT } = usePTExpiry();
  const { upcomingFollowUps, fetchUpcomingFollowUps } = useFollowUp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchExpiringEnquiries(30);
    fetchExpiringPT(30);
    fetchUpcomingFollowUps();
  }, [fetchExpiringEnquiries, fetchExpiringPT, fetchUpcomingFollowUps]);

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];

    const events: any[] = [];

    // Enquiries expiring on this date
    expiringEnquiries?.enquiries.forEach((enquiry) => {
      if (!enquiry.expiryDate) return; // Skip if no expiry date

      try {
        const expiryDate = new Date(enquiry.expiryDate);
        if (isNaN(expiryDate.getTime())) return; // Skip if invalid date

        const expiryDateStr = expiryDate.toISOString().split('T')[0];
        if (expiryDateStr === dateStr) {
          events.push({
            type: 'enquiry',
            title: `Enquiry: ${enquiry.name}`,
            isExpired: enquiry.isExpired,
            color: enquiry.isExpired ? 'bg-red-500' : 'bg-orange-500',
          });
        }
      } catch (error) {
        console.warn('Invalid enquiry expiry date:', enquiry.expiryDate);
      }
    });

    // PT packages expiring on this date
    expiringPT?.ptPackages.forEach((client) => {
      if (!client.endDate) return; // Skip if no end date

      try {
        const endDate = new Date(client.endDate);
        if (isNaN(endDate.getTime())) return; // Skip if invalid date

        const endDateStr = endDate.toISOString().split('T')[0];
        if (endDateStr === dateStr) {
          events.push({
            type: 'pt',
            title: `PT: ${client.fullName}`,
            isExpired: client.ptIsExpired,
            color: client.ptIsExpired ? 'bg-red-500' : 'bg-purple-500',
          });
        }
      } catch (error) {
        console.warn('Invalid PT end date:', client.endDate);
      }
    });

    // Follow-ups scheduled on this date
    upcomingFollowUps.forEach((followUp) => {
      if (!followUp.scheduledDate) return; // Skip if no scheduled date

      try {
        const scheduledDate = new Date(followUp.scheduledDate);
        if (isNaN(scheduledDate.getTime())) return; // Skip if invalid date

        const scheduledDateStr = scheduledDate.toISOString().split('T')[0];
        if (scheduledDateStr === dateStr) {
          events.push({
            type: 'followup',
            title: `Follow-up: ${followUp.relatedName}`,
            time: followUp.scheduledTime,
            color: 'bg-blue-500',
          });
        }
      } catch (error) {
        console.warn('Invalid follow-up scheduled date:', followUp.scheduledDate);
      }
    });

    return events;
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const day = i - startingDayOfWeek + 1;
      const isValidDay = day > 0 && day <= daysInMonth;
      const events = isValidDay ? getEventsForDate(day) : [];
      const isToday =
        isValidDay &&
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={i}
          className={`min-h-[120px] border border-gray-200 dark:border-gray-600 p-2 cursor-pointer ${
            !isValidDay ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          } ${isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
          onClick={() => isValidDay && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
        >
          {isValidDay && (
            <>
              <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map((event, idx) => (
                  <div
                    key={idx}
                    className={`text-xs text-white px-2 py-1 rounded truncate ${event.color}`}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 px-2">+{events.length - 3} more</div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar View</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View all expiring items and follow-ups</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-lg font-semibold px-4 text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Enquiry Expiring</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">PT Expiring</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Follow-Up</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Expired</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enquiries Expiring</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {expiringEnquiries?.total || 0}
              </p>
            </div>
            <AlertCircle className="text-orange-500 dark:text-orange-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">PT Packages Expiring</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {expiringPT?.total || 0}
              </p>
            </div>
            <Dumbbell className="text-purple-500 dark:text-purple-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Follow-Ups</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {upcomingFollowUps.length}
              </p>
            </div>
            <Bell className="text-blue-500 dark:text-blue-400" size={32} />
          </div>
        </div>
      </div>
    </div>
  );
};

