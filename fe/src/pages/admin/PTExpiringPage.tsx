import React, { useEffect, useState } from 'react';
import { usePTExpiry } from '../../hooks/usePTExpiry';
import { Dumbbell, Clock, XCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PTExpiringPage: React.FC = () => {
  const { expiringPT, loading, fetchExpiringPT } = usePTExpiry();
  const [selectedTab, setSelectedTab] = useState<'all' | 'expired' | 'expiring'>('all');
  const [daysFilter, setDaysFilter] = useState(7);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiringPT(daysFilter);
  }, [daysFilter, fetchExpiringPT]);

  const getDisplayedPT = () => {
    if (!expiringPT) return [];
    
    switch (selectedTab) {
      case 'expired':
        return expiringPT.categories.expired;
      case 'expiring':
        return expiringPT.categories.expiringSoon;
      default:
        return expiringPT.ptPackages;
    }
  };

  const displayedPT = getDisplayedPT();

  return (
    <div className="space-y-6 px-4 py-6 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between dark:text-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PT Packages Expiring</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">Track and manage Personal Training packages that are expiring soon</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700   dark:text-white">Show PT packages expiring within:</label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      {expiringPT && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Total Expiring</p>
                <p className="text-3xl font-bold text-gray-900 mt-1 dark:text-white">{expiringPT.total}</p>
              </div>
              <Dumbbell className="text-purple-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Expired</p>
                <p className="text-3xl font-bold text-red-600 mt-1   dark:text-white">{expiringPT.expired}</p>
              </div>
              <XCircle className="text-red-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Expiring Soon</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1 dark:text-white">{expiringPT.expiringSoon}</p>
              </div>
              <Clock className="text-yellow-500" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="border-b border-gray-200 ">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'all'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              All ({expiringPT?.total || 0})
            </button>
            <button
              onClick={() => setSelectedTab('expired')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'expired'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              Expired ({expiringPT?.expired || 0})
            </button>
            <button
              onClick={() => setSelectedTab('expiring')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'expiring'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              Expiring Soon ({expiringPT?.expiringSoon || 0})
            </button>
          </nav>
        </div>

        {/* PT Packages List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Loading PT packages...</p>
            </div>
          ) : displayedPT.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 dark:text-gray-400 mt-4">No PT packages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedPT.map((client) => (
                <div
                  key={client._id}
                  className={`border rounded-lg p-4 ${
                    client.ptIsExpired
                      ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                      : client.ptRemainingDays <= 3
                      ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{client.fullName}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            client.ptIsExpired
                              ? 'bg-red-100 text-red-700'
                              : client.ptRemainingDays <= 3
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {client.ptIsExpired
                            ? 'Expired'
                            : `${client.ptRemainingDays} days left`}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <span className="ml-2 text-gray-900">{client.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <span className="ml-2 text-gray-900">{client.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">PT Duration:</span>
                          <span className="ml-2 text-gray-900">
                            {client.personalTrainingDurationWeeks} weeks
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">PT Price:</span>
                          <span className="ml-2 text-gray-900">
                            ₹{client.personalTrainingPrice?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trainer:</span>
                          <span className="ml-2 text-gray-900">
                            {client.trainer?.fullName || client.personalTrainer?.fullName || 'Unassigned'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(client.startDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">End Date:</span>
                          <span className="ml-2 text-gray-900">
                            {new Date(client.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/admin/client-form/${client._id}`)}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                      >
                        <User size={16} />
                        View Client
                      </button>
                      <button
                        onClick={() => {
                          // Navigate to follow-up form with pre-filled data
                          navigate('/admin/follow-ups/new', {
                            state: {
                              type: 'pt',
                              relatedId: client._id,
                              relatedName: client.fullName,
                            },
                          });
                        }}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Add Follow-Up
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

