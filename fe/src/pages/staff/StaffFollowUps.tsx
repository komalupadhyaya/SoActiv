import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, Filter } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useFollowUp } from '../../hooks/useFollowUp';
import type { FollowUp } from '../../types';

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    rescheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const typeIcons: Record<string, string> = {
    call: '📞',
    message: '💬',
    visit: '🏠',
    enquiry: '❓',
    client: '👤',
    pt: '💪',
    other: '📋',
};

export const StaffFollowUps: React.FC = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const { addToast } = useToast();
    const { followUps, loading, getMyFollowUps, completeFollowUpWithNotes, failFollowUp } = useFollowUp();

    const [statusFilter, setStatusFilter] = useState<string>('');

    // Modal states
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [isFailModalOpen, setIsFailModalOpen] = useState(false);
    const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
    const [completionNotes, setCompletionNotes] = useState('');
    const [failureReason, setFailureReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // NEW: mobile filter dropdown
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

    // ============================================================
    // ACCESS CONTROL GUARD
    // ============================================================
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        // STRICT: Only staff role can access this page
        if (user.role !== 'staff') {
            navigate('/');
            return;
        }
    }, [user, authLoading, navigate]);

    const fetchMyFollowUps = async () => {
        const filters: any = {};
        if (statusFilter) filters.status = statusFilter;
        await getMyFollowUps(filters);
    };

    // Fetch follow-ups
    useEffect(() => {
        if (user?.role === 'staff') {
            fetchMyFollowUps();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, statusFilter]);

    const handleCompleteClick = (followUp: FollowUp) => {
        setSelectedFollowUp(followUp);
        setCompletionNotes('');
        setIsCompleteModalOpen(true);
    };

    const handleFailClick = (followUp: FollowUp) => {
        setSelectedFollowUp(followUp);
        setFailureReason('');
        setIsFailModalOpen(true);
    };

    const handleCompleteSubmit = async () => {
        if (!selectedFollowUp) return;

        try {
            setSubmitting(true);
            const result = await completeFollowUpWithNotes(selectedFollowUp._id, completionNotes);
            if (result.success) {
                setIsCompleteModalOpen(false);
                fetchMyFollowUps();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleFailSubmit = async () => {
        if (!selectedFollowUp || !failureReason.trim()) {
            addToast('Please provide a reason for failure', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const result = await failFollowUp(selectedFollowUp._id, failureReason);
            if (result.success) {
                setIsFailModalOpen(false);
                fetchMyFollowUps();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isToday = (dateString: string) => {
        const today = new Date();
        const date = new Date(dateString);
        return date.toDateString() === today.toDateString();
    };

    const filteredFollowUps = followUps.filter(f => !statusFilter || f.status === statusFilter);
    const pendingCount = followUps.filter(f => f.status === 'pending').length;
    const todayFollowUps = followUps.filter(f => isToday(f.scheduledDate) && f.status === 'pending');

    if (loading && followUps.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3 px-2 py-3 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Follow-Ups</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your assigned follow-up tasks
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{pendingCount}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Tasks</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{todayFollowUps.length}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{followUps.length}</p>
                            </div>
                            <MessageSquare className="w-8 h-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    {/* Desktop: inline buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <Filter size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant={statusFilter === '' ? 'primary' : 'outline'}
                                onClick={() => setStatusFilter('')}
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant={statusFilter === 'pending' ? 'primary' : 'outline'}
                                onClick={() => setStatusFilter('pending')}
                            >
                                Pending
                            </Button>
                            <Button
                                size="sm"
                                variant={statusFilter === 'completed' ? 'primary' : 'outline'}
                                onClick={() => setStatusFilter('completed')}
                            >
                                Completed
                            </Button>
                            <Button
                                size="sm"
                                variant={statusFilter === 'failed' ? 'primary' : 'outline'}
                                onClick={() => setStatusFilter('failed')}
                            >
                                Failed
                            </Button>
                        </div>
                    </div>

                    {/* Mobile / tablet: dropdown */}
                    <div className="md:hidden">
                        <button
                            type="button"
                            className="inline-flex items-center justify-between w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm"
                            onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                        >
                            <span className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-500" />
                                <span>
                                    {statusFilter === ''
                                        ? 'All'
                                        : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                </span>
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                                {isFilterDropdownOpen ? 'Close' : 'Open'}
                            </span>
                        </button>

                        {isFilterDropdownOpen && (
                            <div className="mt-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-2 space-y-1">
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-2 rounded text-sm ${statusFilter === ''
                                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => {
                                        setStatusFilter('');
                                        setIsFilterDropdownOpen(false);
                                    }}
                                >
                                    All
                                </button>
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-2 rounded text-sm ${statusFilter === 'pending'
                                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => {
                                        setStatusFilter('pending');
                                        setIsFilterDropdownOpen(false);
                                    }}
                                >
                                    Pending
                                </button>
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-2 rounded text-sm ${statusFilter === 'completed'
                                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => {
                                        setStatusFilter('completed');
                                        setIsFilterDropdownOpen(false);
                                    }}
                                >
                                    Completed
                                </button>
                                <button
                                    type="button"
                                    className={`w-full text-left px-3 py-2 rounded text-sm ${statusFilter === 'failed'
                                            ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                    onClick={() => {
                                        setStatusFilter('failed');
                                        setIsFilterDropdownOpen(false);
                                    }}
                                >
                                    Failed
                                </button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Follow-Ups List */}
            <div className="space-y-4">
                {filteredFollowUps.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 dark:text-gray-400">
                                {statusFilter
                                    ? `No ${statusFilter} follow-ups found`
                                    : 'No follow-ups assigned to you'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredFollowUps.map((followUp) => (
                        <Card
                            key={followUp._id}
                            className={
                                isToday(followUp.scheduledDate) && followUp.status === 'pending'
                                    ? 'border-2 border-orange-500'
                                    : ''
                            }
                        >
                            <CardContent className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    {/* Left: Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-2xl">{typeIcons[followUp.type] || '📋'}</span>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {followUp.relatedName}
                                            </h3>
                                            <Badge className={statusColors[followUp.status]}>
                                                {followUp.status}
                                            </Badge>
                                            {isToday(followUp.scheduledDate) && followUp.status === 'pending' && (
                                                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                                                    Today
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>{formatDate(followUp.scheduledDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} />
                                                <span>{followUp.scheduledTime}</span>
                                            </div>
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                                {followUp.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                            <strong>Note:</strong> {followUp.note}
                                        </p>
                                        {followUp.completionNotes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                                <strong>Completion Notes:</strong> {followUp.completionNotes}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    {followUp.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleCompleteClick(followUp)}
                                            >
                                                <CheckCircle size={16} className="mr-1" />
                                                Complete
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                                                onClick={() => handleFailClick(followUp)}
                                            >
                                                <XCircle size={16} className="mr-1" />
                                                Mark Failed
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Complete Modal */}
            <Modal
                isOpen={isCompleteModalOpen}
                onClose={() => setIsCompleteModalOpen(false)}
                title="Complete Follow-Up"
                size="md"
            >
                <div className="p-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Mark this follow-up as completed for <strong>{selectedFollowUp?.relatedName}</strong>?
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Completion Notes (Optional)
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={3}
                            value={completionNotes}
                            onChange={(e) => setCompletionNotes(e.target.value)}
                            placeholder="Add any notes about this follow-up..."
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleCompleteSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Completing...' : 'Mark Complete'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Fail Modal */}
            <Modal
                isOpen={isFailModalOpen}
                onClose={() => setIsFailModalOpen(false)}
                title="Mark Follow-Up as Failed"
                size="md"
            >
                <div className="p-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Mark this follow-up as failed for <strong>{selectedFollowUp?.relatedName}</strong>?
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason for Failure <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            rows={3}
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            placeholder="e.g., Client not reachable, Wrong number, etc."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsFailModalOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleFailSubmit}
                            disabled={submitting || !failureReason.trim()}
                        >
                            {submitting ? 'Updating...' : 'Mark as Failed'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
