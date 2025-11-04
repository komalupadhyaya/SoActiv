import React, { useEffect, useState } from 'react';
import { useEnquiryExpiry } from '../../hooks/useEnquiryExpiry';
import { AlertCircle, Clock, XCircle, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EnquiriesExpiringPage: React.FC = () => {
  const { expiringEnquiries, loading, fetchExpiringEnquiries, extendEnquiryExpiry } = useEnquiryExpiry();
  const [selectedTab, setSelectedTab] = useState<'all' | 'expired' | 'expiring'>('all');
  const [daysFilter, setDaysFilter] = useState(7);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiringEnquiries(daysFilter);
  }, [daysFilter, fetchExpiringEnquiries]);

  const handleExtendExpiry = async (id: string, days: number) => {
    const result = await extendEnquiryExpiry(id, days);
    if (result.success) {
      alert(`Enquiry expiry extended by ${days} days`);
    } else {
      alert(`Failed to extend expiry: ${result.message}`);
    }
  };

  const getDisplayedEnquiries = () => {
    if (!expiringEnquiries) return [];
    
    switch (selectedTab) {
      case 'expired':
        return expiringEnquiries.categories.expired;
      case 'expiring':
        return expiringEnquiries.categories.expiringSoon;
      default:
        return expiringEnquiries.enquiries;
    }
  };

  const displayedEnquiries = getDisplayedEnquiries();

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enquiries Expiring</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">Track and manage enquiries that are expiring soon</p>
        </div>
        <button
          onClick={() => navigate('/admin/enquiry-form')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
          New Enquiry
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-white">Show enquiries expiring within:</label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      {expiringEnquiries && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Total Expiring</p>
                <p className="text-3xl font-bold text-gray-900 mt-1  dark:text-white">{expiringEnquiries.total}</p>
              </div>
              <AlertCircle className="text-orange-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Expired</p>
                <p className="text-3xl font-bold text-red-600 mt-1 dark:text-white">{expiringEnquiries.expired}</p>
              </div>
              <XCircle className="text-red-500" size={40} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600   dark:text-white">Expiring Soon</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1   dark:text-white">{expiringEnquiries.expiringSoon}</p>
              </div>
              <Clock className="text-yellow-500" size={40} />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'all'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              All ({expiringEnquiries?.total || 0})
            </button>
            <button
              onClick={() => setSelectedTab('expired')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'expired'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              Expired ({expiringEnquiries?.expired || 0})
            </button>
            <button
              onClick={() => setSelectedTab('expiring')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'expiring'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-white dark:hover:text-gray-300'
              }`}
            >
              Expiring Soon ({expiringEnquiries?.expiringSoon || 0})
            </button>
          </nav>
        </div>

        {/* Enquiries List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 dark:text-white">Loading enquiries...</p>
            </div>
          ) : displayedEnquiries.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 dark:text-gray-400 mt-4 dark:text-white">No enquiries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedEnquiries.map((enquiry) => (
                <div
                  key={enquiry._id}
                  className={`border rounded-lg p-4 ${
                    enquiry.isExpired
                      ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                      : enquiry.remainingDays <= 3
                      ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{enquiry.name}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            enquiry.isExpired
                              ? 'bg-red-100 text-red-700'
                              : enquiry.remainingDays <= 3
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {enquiry.isExpired
                            ? 'Expired'
                            : `${enquiry.remainingDays} days left`}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-white">Phone:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{enquiry.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-white">Email:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{enquiry.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600  dark:text-white dark:text-white">Status:</span>
                          <span className="ml-2 text-gray-900 capitalize dark:text-white">{enquiry.status}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-white">Source:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">{enquiry.source}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-white">Created:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(enquiry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-white">Expires:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(enquiry.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {enquiry.comments && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600  dark:text-white">Comments:</span>
                          <p className="text-sm text-gray-900 mt-1 dark:text-white">{enquiry.comments}</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleExtendExpiry(enquiry._id, 7)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Calendar size={16} />
                        Extend +7 days
                      </button>
                      <button
                        onClick={() => navigate(`/admin/enquiry-form/${enquiry._id}`)}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        View Details
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

