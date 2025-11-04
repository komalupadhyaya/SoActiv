import React, { useEffect } from 'react';
import { AlertCircle, Clock, XCircle } from 'lucide-react';
import { useEnquiryExpiry } from '../../hooks/useEnquiryExpiry';
import { useNavigate } from 'react-router-dom';

export const ExpiringEnquiriesCard: React.FC = () => {
  const { expiringEnquiries, loading, fetchExpiringEnquiries } = useEnquiryExpiry();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiringEnquiries(7); // Fetch enquiries expiring within 7 days
  }, [fetchExpiringEnquiries]);

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

  const expired = expiringEnquiries?.expired || 0;
  const expiringSoon = expiringEnquiries?.expiringSoon || 0;
  const total = expiringEnquiries?.total || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enquiries Expiring</h3>
          <AlertCircle className="text-orange-500" size={24} />
        </div>

        <div className="space-y-3">
          {/* Total Expiring */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-white">Total Expiring</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{total}</span>
          </div>

          {/* Expired */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="text-red-500" size={18} />
              <span className="text-sm font-medium text-red-700">Expired</span>
            </div>
            <span className="text-lg font-bold text-red-700">{expired}</span>
          </div>

          {/* Expiring Soon */}
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="text-yellow-600" size={18} />
              <span className="text-sm font-medium text-yellow-700">Expiring Soon</span>
            </div>
            <span className="text-lg font-bold text-yellow-700">{expiringSoon}</span>
          </div>
        </div>

        {/* View More Button */}
        <button
          onClick={() => navigate('/admin/enquiries-expiring')}
          className="mt-4 w-full py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          View All Expiring Enquiries
        </button>
      </div>
    </div>
  );
};

