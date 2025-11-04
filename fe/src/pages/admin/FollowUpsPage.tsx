import React, { useEffect, useState } from 'react';
import { useFollowUp } from '../../hooks/useFollowUp';
import { Bell, CheckCircle, XCircle, Plus, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FollowUpsPage: React.FC = () => {
  const { followUps, loading, fetchFollowUps, completeFollowUp, deleteFollowUp } = useFollowUp();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'enquiry' | 'client' | 'pt'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const filters: any = {};
    if (selectedStatus !== 'all') filters.status = selectedStatus;
    if (selectedType !== 'all') filters.type = selectedType;
    fetchFollowUps(filters);
  }, [selectedStatus, selectedType, fetchFollowUps]);

  const handleComplete = async (id: string) => {
    const result = await completeFollowUp(id);
    if (result.success) {
      alert('Follow-up marked as completed');
      fetchFollowUps();
    } else {
      alert(`Failed to complete follow-up: ${result.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this follow-up?')) {
      const result = await deleteFollowUp(id);
      if (result.success) {
        alert('Follow-up deleted successfully');
      } else {
        alert(`Failed to delete follow-up: ${result.message}`);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enquiry':
        return 'bg-blue-100 text-blue-700';
      case 'client':
        return 'bg-purple-100 text-purple-700';
      case 'pt':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900   dark:text-white">Follow-Ups</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">Manage and track all follow-up tasks</p>
        </div>
        <button
          onClick={() => navigate('/admin/follow-ups/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={20} />
          New Follow-Up
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="enquiry">Enquiry</option>
              <option value="client">Client</option>
              <option value="pt">PT Package</option>
            </select>
          </div>
        </div>
      </div>

      {/* Follow-Ups List */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 dark:text-gray-500">Loading follow-ups...</p>
            </div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto text-gray-400" size={48} />
              <p className="text-gray-600 mt-4">No follow-ups found</p>
              <button
                onClick={() => navigate('/admin/follow-ups/new')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Your First Follow-Up
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {followUps.map((followUp) => (
                <div
                  key={followUp._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{followUp.relatedName}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(followUp.status)}`}>
                          {followUp.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(followUp.type)}`}>
                          {followUp.type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{followUp.note}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-500" size={16} />
                          <span className="text-gray-600">Date:</span>
                          <span className="text-gray-900">
                            {new Date(followUp.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={16} />
                          <span className="text-gray-600">Time:</span>
                          <span className="text-gray-900">{followUp.scheduledTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Assigned to:</span>
                          <span className="ml-2 text-gray-900">{followUp.assignedTo.fullName}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Position:</span>
                          <span className="ml-2 text-gray-900">{followUp.assignedTo.position}</span>
                        </div>
                      </div>

                      {followUp.completedAt && (
                        <div className="mt-2 text-sm text-green-600">
                          Completed on {new Date(followUp.completedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      {followUp.status === 'pending' && (
                        <button
                          onClick={() => handleComplete(followUp._id)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          <CheckCircle size={16} />
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(followUp._id)}
                        className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <XCircle size={16} />
                        Delete
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

