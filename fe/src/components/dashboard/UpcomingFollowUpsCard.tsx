import React, { useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useNavigate } from 'react-router-dom';

export const UpcomingFollowUpsCard: React.FC = () => {
  const { upcomingFollowUps, loading, fetchUpcomingFollowUps, completeFollowUp } = useFollowUp();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUpcomingFollowUps();
  }, [fetchUpcomingFollowUps]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const total = upcomingFollowUps.length;
  const today = new Date().toISOString().split('T')[0];
  const todayFollowUps = upcomingFollowUps.filter(
    (f) => f.scheduledDate.split('T')[0] === today
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Follow-Ups</h3>
          <Bell className="text-blue-500" size={24} />
        </div>

        <div className="space-y-3">
          {/* Total Upcoming */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-white">Next 7 Days</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
          </div>

          {/* Today's Follow-ups */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell className="text-blue-600" size={18} />
              <span className="text-sm font-medium text-blue-700">Today</span>
            </div>
            <span className="text-lg font-bold text-blue-700 dark:text-white">{todayFollowUps.length}</span>
          </div>

          {/* Recent Follow-ups List */}
          {todayFollowUps.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase">Today's Tasks</p>
              {todayFollowUps.slice(0, 3).map((followUp) => (
                <div
                  key={followUp._id}
                  className="flex items-start justify-between p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{followUp.relatedName}</p>
                    <p className="text-xs text-gray-600 mt-1">{followUp.note}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {followUp.scheduledTime} • {followUp.type}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await completeFollowUp(followUp._id);
                      fetchUpcomingFollowUps();
                    }}
                    className="ml-2 p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Mark as complete"
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View More Button */}
        <button
          onClick={() => navigate('/admin/follow-ups')}
          className="mt-4 w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          View All Follow-Ups
        </button>
      </div>
    </div>
  );
};

