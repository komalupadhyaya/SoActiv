import React, { useEffect, useState } from 'react';
import { useFollowUp } from '../../hooks/useFollowUp';
import { Bell, CheckCircle, XCircle, Plus, Calendar, Clock } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';

export const FollowUpsPage: React.FC = () => {
  const { followUps, loading, fetchFollowUps, completeFollowUp, deleteFollowUp, approveReschedule, rejectReschedule } = useFollowUp();
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('id');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'failed' | 'reschedule_pending'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'enquiry' | 'client' | 'pt'>('all');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectComments, setRejectComments] = useState('');
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const filters: any = {};
    if (selectedStatus !== 'all') filters.status = selectedStatus;
    if (selectedType !== 'all') filters.type = selectedType;
    fetchFollowUps(filters);
  }, [selectedStatus, selectedType, fetchFollowUps]);

  // Adjust status/type filters if a specific follow-up ID is requested
  useEffect(() => {
    if (targetId && followUps.length > 0) {
      const targetFollowUp = followUps.find(f => f._id === targetId);
      if (targetFollowUp) {
        if (selectedStatus !== 'all' && targetFollowUp.status !== selectedStatus) {
          setSelectedStatus('all');
        }
        if (selectedType !== 'all' && targetFollowUp.type !== (selectedType as any)) {
          setSelectedType('all');
        }
      }
    }
  }, [targetId, followUps, selectedStatus, selectedType]);

  // Handle scroll and highlight for target follow-up
  useEffect(() => {
    if (!loading && targetId && followUps.some(f => f._id === targetId)) {
      setHighlightedId(targetId);

      const timer = setTimeout(() => {
        const element = document.getElementById(`followup-${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);

      const clearTimer = setTimeout(() => {
        setHighlightedId(null);
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [loading, targetId, followUps]);

  const handleComplete = async (id: string) => {
    const result = await completeFollowUp(id);
    if (result.success) {
      fetchFollowUps();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this follow-up?')) {
      await deleteFollowUp(id);
      fetchFollowUps();
    }
  };

  const handleApproveReschedule = async (id: string) => {
    if (confirm('Are you sure you want to approve this reschedule request?')) {
      const result = await approveReschedule(id);
      if (result.success) {
        const filters: any = {};
        if (selectedStatus !== 'all') filters.status = selectedStatus;
        if (selectedType !== 'all') filters.type = selectedType;
        fetchFollowUps(filters);
      }
    }
  };

  const handleRejectClick = (id: string) => {
    setSelectedFollowUpId(id);
    setRejectComments('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFollowUpId || !rejectComments.trim()) return;

    try {
      setSubmitting(true);
      const result = await rejectReschedule(selectedFollowUpId, rejectComments);
      if (result.success) {
        setIsRejectModalOpen(false);
        const filters: any = {};
        if (selectedStatus !== 'all') filters.status = selectedStatus;
        if (selectedType !== 'all') filters.type = selectedType;
        fetchFollowUps(filters);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'reschedule_pending':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
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
    <div className="space-y-6 py-6 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-2 sm:px-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
          <p className="text-gray-600 mt-1 dark:text-gray-400">
            Manage and track all follow-up tasks
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/follow-ups/new')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
          Add
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 dark:bg-gray-800 dark:border dark:border-gray-700 mx-2 sm:mx-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="reschedule_pending">Reschedule Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-white">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
      <div className="bg-white rounded-lg shadow dark:bg-gray-800 dark:border dark:border-gray-700 mx-2 sm:mx-0">
        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-4 dark:text-gray-400">Loading follow-ups...</p>
            </div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto text-gray-400 dark:text-gray-500" size={48} />
              <p className="text-gray-600 dark:text-gray-400 mt-4">No follow-ups found</p>
              <button
                onClick={() => navigate('/admin/follow-ups/new')}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {followUps.map((followUp) => (
                <div
                  key={followUp._id}
                  id={`followup-${followUp._id}`}
                  className={`border rounded-lg p-4 sm:p-5 hover:shadow-md transition-all duration-500 ${
                    highlightedId === followUp._id
                      ? 'ring-2 ring-orange-500 dark:ring-orange-400 bg-orange-50/50 dark:bg-orange-950/20 border-orange-500 dark:border-orange-400 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Top row: name left, buttons right, optional center spacing */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Name + basic chips (center-ish on small, left on desktop) */}
                    <div className="flex flex-col gap-2 md:flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {followUp.relatedName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            followUp.status,
                          )}`}
                        >
                          {followUp.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                            followUp.type,
                          )}`}
                        >
                          {followUp.type}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (right on desktop, bottom on mobile) */}
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {followUp.status === 'reschedule_pending' && (
                        <>
                          <button
                            onClick={() => handleApproveReschedule(followUp._id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectClick(followUp._id)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold shadow"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {followUp.status === 'pending' && (
                        <button
                          onClick={() => handleComplete(followUp._id)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                        >
                          <CheckCircle size={16} />
                          Confirm
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

                  {/* Middle: 2-column details (date/time/assigned/position) */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-gray-500 dark:text-gray-400" size={16} />
                      <span className="text-gray-600 dark:text-gray-400">Date:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(followUp.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-500 dark:text-gray-400" size={16} />
                      <span className="text-gray-600 dark:text-gray-400">Time:</span>
                      <span className="text-gray-900 dark:text-white">
                        {followUp.scheduledTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Assigned to:</span>
                      <span className="text-gray-900 dark:text-white">
                        {followUp.assignedTo?.fullName || 'Unknown'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">Position:</span>
                      <span className="text-gray-900 dark:text-white">
                        {followUp.assignedTo?.position || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: long text fields stacked full-width */}
                  <div className="mt-4 space-y-2">
                    {followUp.note && (
                      <p className="text-sm text-gray-700 dark:text-white whitespace-pre-line break-words">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Note: </span>
                        {followUp.note}
                      </p>
                    )}

                    {followUp.status === 'reschedule_pending' && followUp.proposedDate && (
                      <div className="p-3 bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-900 rounded-lg text-sm text-orange-800 dark:text-orange-300">
                        <strong>Proposed Reschedule:</strong> {new Date(followUp.proposedDate).toLocaleDateString()} at {followUp.proposedTime}
                        {followUp.rescheduleReason && (
                          <p className="mt-1">
                            <span className="font-semibold">Reason:</span> "{followUp.rescheduleReason}"
                          </p>
                        )}
                      </div>
                    )}

                    {followUp.completedAt && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Completed on{' '}
                        {new Date(followUp.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Reschedule Request"
        size="md"
      >
        <form onSubmit={handleRejectSubmit} className="p-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Provide a reason or feedback for rejecting this reschedule request.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rejection Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
              placeholder="e.g., We cannot reschedule to this day due to high client volume..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
              disabled={submitting || !rejectComments.trim()}
            >
              {submitting ? 'Rejecting...' : 'Reject Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
