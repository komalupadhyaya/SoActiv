import React, { useEffect, useState, useMemo } from 'react';
import { usePT, PTAssignment } from '../../hooks/usePT';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Plus, Search, Filter, X, TrendingUp } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
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
    const { assignments, fetchAssignments } = usePT();
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [upgradeMember, setUpgradeMember] = useState<{
        memberId: string;
        memberName: string;
        trainerId?: string;
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [trainerFilter, setTrainerFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const { user } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    const statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    const trainerOptions = useMemo(() => {
        const map = new Map<string, string>();
        assignments.forEach(a => {
            if (a.trainerId?._id && a.trainerId?.fullName) {
                map.set(a.trainerId._id, a.trainerId.fullName);
            }
        });
        return [
            { value: 'all', label: 'All Trainers' },
            ...Array.from(map.entries()).map(([id, name]) => ({ value: id, label: name }))
        ];
    }, [assignments]);

    const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (trainerFilter !== 'all' ? 1 : 0);
    const hasActiveFilters = activeFilterCount > 0;

    const clearFilters = () => {
        setStatusFilter('all');
        setTrainerFilter('all');
    };

    // Keep only the latest / upgraded active assignment per member
    const displayAssignments = useMemo(() => {
        const memberMap = new Map<string, PTAssignment>();

        const sorted = [...assignments].sort((a, b) => {
            const aActive = a.status === 'active' ? 1 : 0;
            const bActive = b.status === 'active' ? 1 : 0;
            if (aActive !== bActive) {
                return bActive - aActive;
            }
            const aDate = new Date(a.startDate || a.expiryDate || 0).getTime();
            const bDate = new Date(b.startDate || b.expiryDate || 0).getTime();
            return bDate - aDate;
        });

        sorted.forEach(a => {
            const mId = typeof a.memberId === 'object' && a.memberId ? a.memberId._id : a.memberId;
            const key = mId || a._id;
            if (!memberMap.has(key)) {
                memberMap.set(key, a);
            }
        });

        return Array.from(memberMap.values());
    }, [assignments]);

    const filteredAssignments = displayAssignments.filter(a => {
        const memberName = (a.memberId?.fullName || '').toLowerCase();
        const memberContact = a.memberId?.contactNumber || '';
        const trainerName = (a.trainerId?.fullName || '').toLowerCase();
        const planName = (a.planId?.name || '').toLowerCase();

        const query = searchQuery.toLowerCase();
        const matchesSearch =
            !query ||
            memberName.includes(query) ||
            memberContact.includes(query) ||
            trainerName.includes(query) ||
            planName.includes(query);

        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesTrainer = trainerFilter === 'all' || a.trainerId?._id === trainerFilter;

        return matchesSearch && matchesStatus && matchesTrainer;
    });

    const handleAssignClick = () => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        setUpgradeMember(null);
        setIsAssignModalOpen(true);
    };

    const handleTopUpgradeClick = () => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        setUpgradeMember({
            memberId: '',
            memberName: '',
            trainerId: ''
        });
        setIsAssignModalOpen(true);
    };

    const handleUpgradeClick = (assignment: PTAssignment) => {
        if (user?.gymFeatures?.pt === false) {
            addToast('Personal Training features have been disabled by platform administration.', 'error');
            return;
        }
        const memberId = typeof assignment.memberId === 'object' ? assignment.memberId?._id : assignment.memberId;
        const memberName = typeof assignment.memberId === 'object' ? assignment.memberId?.fullName : 'Member';
        const trainerId = typeof assignment.trainerId === 'object' ? assignment.trainerId?._id : assignment.trainerId;

        setUpgradeMember({
            memberId: memberId || '',
            memberName: memberName || 'Member',
            trainerId: trainerId || ''
        });
        setIsAssignModalOpen(true);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">PT Assignments</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and manage member personal training subscriptions</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleTopUpgradeClick}
                        className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-medium"
                    >
                        <TrendingUp size={16} className="mr-2" /> Upgrade Plan
                    </Button>
                    <Button onClick={handleAssignClick}>
                        <Plus size={16} className="mr-2" /> Assign PT
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <Input
                                placeholder="Search Member or Trainer..."
                                leftIcon={<Search size={16} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant={hasActiveFilters ? "primary" : "outline"}
                            onClick={() => setShowFilters(!showFilters)}
                            className="w-full sm:w-auto relative"
                        >
                            <Filter size={16} className="mr-2" />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-white text-orange-600 rounded-full font-bold">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                                <Select
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Trainer</label>
                                <Select
                                    options={trainerOptions}
                                    value={trainerFilter}
                                    onChange={setTrainerFilter}
                                />
                            </div>
                            {hasActiveFilters && (
                                <div>
                                    <Button
                                        variant="ghost"
                                        onClick={clearFilters}
                                        className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <X size={14} className="mr-1" /> Clear Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="w-full">
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {statusFilter === 'all' ? 'All Assignments' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Assignments`}
                    </h3>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full min-w-[750px] table-auto divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/90">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[170px]">Member</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[140px]">Plan</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[130px]">Trainer</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">Progress</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[110px]">Expiry</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[90px]">Status</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[130px]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredAssignments.map((assignment) => (
                                    <tr key={assignment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
                                        <td className="px-4 py-2.5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{assignment.memberId?.fullName || 'Unknown Member'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{assignment.memberId?.contactNumber || '--'}</div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{assignment.planId?.name || 'Unknown Plan'}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{assignment.planId?.totalSessions || 0} Sessions</div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{assignment.trainerId?.fullName || 'Unknown Trainer'}</div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 max-w-[100px]">
                                                <div
                                                    className="bg-orange-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, Math.max(0, (assignment.usedSessions / (assignment.totalSessions || 1)) * 100))}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                                {assignment.usedSessions} / {assignment.totalSessions} used
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {new Date(assignment.expiryDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <Badge className={`text-xs px-2.5 py-0.5 font-medium ${statusColors[assignment.status as keyof typeof statusColors]}`}>
                                                {assignment.status}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleUpgradeClick(assignment)}
                                                className="text-xs py-1 px-2.5 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 flex items-center gap-1 font-medium"
                                            >
                                                <TrendingUp size={13} /> Upgrade Plan
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredAssignments.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No assignments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <PTAssignModal
                isOpen={isAssignModalOpen}
                onClose={() => {
                    setIsAssignModalOpen(false);
                    setUpgradeMember(null);
                }}
                onSuccess={() => {
                    fetchAssignments();
                    setUpgradeMember(null);
                }}
                preSelectedMemberId={upgradeMember?.memberId}
                preSelectedTrainerId={upgradeMember?.trainerId}
                memberName={upgradeMember?.memberName}
                isUpgrade={!!upgradeMember}
            />
        </div>
    );
};
