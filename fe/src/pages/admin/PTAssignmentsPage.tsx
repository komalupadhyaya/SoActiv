import React, { useEffect, useState } from 'react';
import { usePT } from '../../hooks/usePT';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PTAssignModal } from '../../components/pt/PTAssignModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    valid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

export const PTAssignmentsPage: React.FC = () => {
    const { assignments, loading, fetchAssignments } = usePT();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const filteredAssignments = assignments.filter(a =>
        (a.memberId?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.trainerId?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAssignClick = () => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        setIsAssignModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PT Assignments</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and manage member personal training subscriptions</p>
                </div>
                <Button onClick={handleAssignClick}>
                    <Plus size={16} className="mr-2" />
                    Assign PT
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search Member or Trainer..."
                            leftIcon={<Search size={16} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter size={16} className="mr-2" />
                        Filter
                    </Button>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Assignments</h3>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trainer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiry</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAssignments.map((assignment) => (
                                <tr key={assignment._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{assignment.memberId?.fullName || 'Unknown Member'}</div>
                                        <div className="text-xs text-gray-500">{assignment.memberId?.contactNumber || '--'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{assignment.planId?.name || 'Unknown Plan'}</div>
                                        <div className="text-xs text-gray-500">{assignment.planId?.totalSessions || 0} Sessions</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">{assignment.trainerId?.fullName || 'Unknown Trainer'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-[100px]">
                                            <div
                                                className="bg-orange-600 h-2.5 rounded-full"
                                                style={{ width: `${(assignment.usedSessions / assignment.totalSessions) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {assignment.usedSessions} / {assignment.totalSessions} used
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {new Date(assignment.expiryDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge className={statusColors[assignment.status as keyof typeof statusColors]}>
                                            {assignment.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            {filteredAssignments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No assignments found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <PTAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSuccess={() => fetchAssignments()}
            />
        </div>
    );
};
