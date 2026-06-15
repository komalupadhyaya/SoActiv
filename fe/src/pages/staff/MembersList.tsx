import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Search,
    AlertTriangle,
    Calendar,
    Phone,
    Mail,
    Dumbbell,
    User,
    Plus,
    Edit,
    Trash2,
    Clock
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useClient } from '../../hooks/useClient';
import { useAuth } from '../../contexts/AuthContext';
import { useStaffPermissions } from '../../hooks/useStaffPermissions';
import { useToast } from '../../contexts/ToastContext';

const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

export const MembersList: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetId = searchParams.get('id');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const { clients, loading, deleteClient, fetchClients } = useClient();
    const { isManager } = useStaffPermissions();
    const { addToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        clientId: string;
        clientName: string;
    }>({
        isOpen: false,
        clientId: '',
        clientName: '',
    });

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Adjust status and search filters if a specific client ID is requested
    useEffect(() => {
        if (targetId && clients.length > 0) {
            const targetClient = clients.find(c => c._id === targetId || c.id === targetId);
            if (targetClient) {
                if (statusFilter !== '' && targetClient.status !== statusFilter) {
                    setStatusFilter('');
                }
                const matchesSearch =
                    targetClient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (targetClient.contactNumber?.includes(searchQuery) ?? false) ||
                    (targetClient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
                if (!matchesSearch) {
                    setSearchQuery('');
                }
            }
        }
    }, [targetId, clients, statusFilter, searchQuery]);

    // Handle scroll and highlight for target client
    useEffect(() => {
        if (!loading && targetId && clients.some(c => c._id === targetId || c.id === targetId)) {
            setHighlightedId(targetId);

            const timer = setTimeout(() => {
                const element = document.getElementById(`client-${targetId}`);
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
    }, [loading, targetId, clients]);

    const filteredClients = clients.filter((client) => {
        const matchesSearch =
            client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (client.contactNumber?.includes(searchQuery) ?? false) ||
            (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

        const matchesStatus = !statusFilter || client.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const expiringClients = clients.filter(
        (client) => (client.remainingDays ?? 0) > 0 && (client.remainingDays ?? 0) <= 30
    );
    const expiredClients = clients.filter((client) => (client.remainingDays ?? 0) <= 0);

    const handleDeleteClick = (id: string, clientName: string) => {
        setDeleteConfirmation({
            isOpen: true,
            clientId: id,
            clientName: clientName,
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.clientId) return;

        const success = await deleteClient(deleteConfirmation.clientId);
        if (success) {
            addToast('Client deletion request submitted to Admin for approval', 'success');
        }
        setDeleteConfirmation({ isOpen: false, clientId: '', clientName: '' });
    };

    if (loading && clients.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Members List</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isManager 
                            ? 'Manage your gym members, update credentials, or request deletions.'
                            : 'View all members and their membership status.'}
                    </p>
                </div>
                {isManager && (
                    <Button
                        onClick={() => navigate('/staff/members/new')}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none shadow-md"
                    >
                        <Plus size={16} />
                        Add New Member
                    </Button>
                )}
            </div>

            {/* Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-l-4 border-l-yellow-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {expiringClients.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <Calendar className="text-red-600 dark:text-red-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {expiredClients.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={18}
                            />
                            <Input
                                type="text"
                                placeholder="Search by name, phone, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="sm:w-48">
                            <Select
                                value={statusFilter}
                                onChange={(value) => setStatusFilter(value)}
                                options={[
                                    { value: '', label: 'All Status' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'expired', label: 'Expired' },
                                    { value: 'pending', label: 'Pending' }
                                ]}
                                placeholder="All Status"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Clients Card Grid */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        All Members ({filteredClients.length})
                    </h2>
                </CardHeader>
                <CardContent className="p-4">
                    {filteredClients.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No members found</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredClients.map((client) => (
                                <Card 
                                    key={client._id} 
                                    id={`client-${client._id}`}
                                    className={`h-full border shadow-sm relative transition-all duration-500 ${
                                        highlightedId === client._id
                                            ? 'ring-2 ring-orange-500 dark:ring-orange-450 bg-orange-50/50 dark:bg-orange-950/20 border-orange-500'
                                            : 'border-gray-100 dark:border-gray-800'
                                    }`}
                                >
                                    {client.deleteRequested && (
                                        <div className="absolute top-2 right-2 z-10">
                                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-1">
                                                <Clock size={12} /> Pending Delete
                                            </Badge>
                                        </div>
                                    )}
                                    <CardContent className="p-4 flex flex-col h-full justify-between">
                                        <div>
                                            {/* Header: Logo/Avatar + Name + Status */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 rounded-full flex items-center justify-center shadow-md">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                                                            {client.fullName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                            {client.gender || 'Not Defined'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {!client.deleteRequested && (
                                                    <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                                                        {client.status}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Contact Info */}
                                            <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span>{client.contactNumber || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Mail size={14} className="text-gray-400" />
                                                    <span className="truncate">{client.email || 'N/A'}</span>
                                                </div>
                                            </div>

                                            {/* Membership Details */}
                                            <div className="space-y-2 mb-4">
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {client.startDate
                                                            ? new Date(client.startDate).toLocaleDateString()
                                                            : 'N/A'}
                                                        {' - '}
                                                        {client.endDate
                                                            ? new Date(client.endDate).toLocaleDateString()
                                                            : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                                    {client.plan && (
                                                        <>
                                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs border border-gray-200 dark:border-gray-700">
                                                                {client.plan}
                                                            </span>
                                                            <span>•</span>
                                                        </>
                                                    )}
                                                    <span className="text-xs">{client.timing || 'Flexible'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            {/* Footer Stats & Actions */}
                                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                                <span className="text-sm font-medium">
                                                    {client.remainingDays !== undefined ? (
                                                        <span
                                                            className={`${(client.remainingDays ?? 0) <= 0
                                                                ? 'text-red-600 dark:text-red-400'
                                                                : (client.remainingDays ?? 0) <= 30
                                                                    ? 'text-yellow-600 dark:text-yellow-400'
                                                                    : 'text-green-600 dark:text-green-400'
                                                                }`}
                                                        >
                                                            {(client.remainingDays ?? 0) <= 0
                                                                ? 'Expired'
                                                                : `${client.remainingDays} days left`}
                                                        </span>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </span>

                                                {client.hasPersonalTraining && (
                                                    <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 font-medium">
                                                        <Dumbbell size={14} className="mr-1" />
                                                        PT
                                                    </div>
                                                )}
                                            </div>

                                            {/* CRUD Controls for Manager */}
                                            {isManager && (
                                                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/staff/members/edit/${client._id}`)}
                                                        className="h-8 px-3"
                                                        disabled={client.deleteRequested}
                                                    >
                                                        <Edit size={14} className="mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(client._id, client.fullName)}
                                                        className="h-8 px-3 text-red-650 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                        disabled={client.deleteRequested}
                                                    >
                                                        <Trash2 size={14} className="mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Deletion Request Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                title="Request Client Deletion"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Are you sure you want to delete <strong>{deleteConfirmation.clientName}</strong>?
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-400 flex items-start gap-2">
                        <AlertTriangle className="shrink-0 text-amber-500" size={16} />
                        <span>
                            As a Manager, you do not have direct deletion privileges. Submitting this request will send a pending deletion request to the Gym Admin for final approval.
                        </span>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={confirmDelete}
                        >
                            Submit Request
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MembersList;
