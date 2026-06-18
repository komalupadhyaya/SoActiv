import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Phone,
    Mail,
    Edit2,
    TrendingUp,
    User,
    Clock,
    Plus
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useEnquiry, IEnquiry } from '../../hooks/useEnquiry';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

// Status colors
const statusColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    interested: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusOptions = ['new', 'contacted', 'interested', 'converted', 'lost'];

export const SalesLeads: React.FC = () => {
    // Hooks
    const { myEnquiries, loading, updateEnquiry } = useEnquiry();
    const { addToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetId = searchParams.get('id');

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<IEnquiry | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Adjust search query if a specific lead ID is requested
    useEffect(() => {
        if (targetId && myEnquiries.length > 0) {
            const targetLead = myEnquiries.find(l => l._id === targetId);
            if (targetLead) {
                const matchesSearch =
                    targetLead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    targetLead.phone.includes(searchQuery) ||
                    (targetLead.email && targetLead.email.toLowerCase().includes(searchQuery.toLowerCase()));
                if (!matchesSearch) {
                    setSearchQuery('');
                }
            }
        }
    }, [targetId, myEnquiries, searchQuery]);

    // Handle scroll and highlight for target lead
    useEffect(() => {
        if (!loading && targetId && myEnquiries.some(l => l._id === targetId)) {
            setHighlightedId(targetId);

            const timer = setTimeout(() => {
                const element = document.getElementById(`lead-${targetId}`);
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
    }, [loading, targetId, myEnquiries]);

    // Edit Form State
    const [editStatus, setEditStatus] = useState<string>('');
    const [editComments, setEditComments] = useState<string>('');

    // Filter Logic
    const filteredLeads = myEnquiries.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Handlers
    const handleOpenEdit = (lead: IEnquiry) => {
        setSelectedLead(lead);
        setEditStatus(lead.status);
        setEditComments(lead.comments || '');
        setIsEditModalOpen(true);
    };

    const handleSaveUpdate = async () => {
        if (!selectedLead) return;

        try {
            await updateEnquiry(selectedLead._id, {
                status: editStatus as any,
                comments: editComments
            });
            setIsEditModalOpen(false);
            addToast('Lead updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update lead', 'error');
        }
    };

    if (loading && myEnquiries.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <TrendingUp className="mr-2 text-orange-500" />
                        {user?.position === 'receptionist' || user?.position === 'manager'
                            ? 'Sales Enquiries & Leads'
                            : 'My Sales Leads'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {user?.position === 'receptionist' || user?.position === 'manager'
                            ? 'Track, manage, and register new customer enquiries'
                            : 'Track and manage your assigned enquiries'}
                    </p>
                </div>
                {(user?.position === 'receptionist' || user?.position === 'manager') && (
                    <Button
                        variant="primary"
                        onClick={() => navigate('/staff/enquiries/new')}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none shadow-md"
                    >
                        <Plus size={16} />
                        Add Walk-In Lead
                    </Button>
                )}
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
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
                </CardContent>
            </Card>

            {/* Leads Grid */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Active Leads ({filteredLeads.length})
                    </h2>
                </CardHeader>
                <CardContent className="p-4">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No leads found.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredLeads.map((lead) => (
                                <Card 
                                    key={lead._id} 
                                    id={`lead-${lead._id}`}
                                    className={`hover:shadow-md transition-all duration-500 ${
                                        highlightedId === lead._id
                                            ? 'ring-2 ring-orange-500 dark:ring-orange-450 bg-orange-50/50 dark:bg-orange-950/20 border-orange-500'
                                            : 'border border-gray-100 dark:border-gray-800'
                                    }`}
                                >
                                    <CardContent className="p-5 flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{lead.name}</h3>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Source: {lead.source}</span>
                                                </div>
                                            </div>
                                            <Badge className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}>
                                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                            </Badge>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 mb-4 text-sm flex-1">
                                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                <Phone size={14} className="mr-2 opacity-70" />
                                                {lead.phone}
                                            </div>
                                            {lead.email && (
                                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                    <Mail size={14} className="mr-2 opacity-70" />
                                                    <span className="truncate">{lead.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                <Clock size={14} className="mr-2 opacity-70" />
                                                <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {lead.comments && (
                                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-500 italic border border-gray-100 dark:border-gray-700">
                                                    "{lead.comments}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                            {user?.position === 'manager' ? (
                                                // Manager: can update status/notes AND edit full details
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 gap-2 text-xs py-2 px-3"
                                                        onClick={() => handleOpenEdit(lead)}
                                                    >
                                                        <Clock size={12} />
                                                        Status
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        className="flex-1 gap-2 text-xs py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 border-none hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                                                        onClick={() => navigate(`/staff/enquiries/edit/${lead._id}`)}
                                                    >
                                                        <Edit2 size={12} />
                                                        Edit
                                                    </Button>
                                                </div>
                                            ) : user?.position === 'receptionist' ? (
                                                // Receptionist: can only edit walk-in leads
                                                lead.source === 'walk-in' ? (
                                                    <Button
                                                        variant="primary"
                                                        className="w-full gap-2 text-xs py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 border-none hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                                                        onClick={() => navigate(`/staff/enquiries/edit/${lead._id}`)}
                                                    >
                                                        <Edit2 size={12} />
                                                        Edit
                                                    </Button>
                                                ) : (
                                                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 italic py-1">
                                                        View only — not a walk-in lead
                                                    </p>
                                                )
                                            ) : (
                                                // Sales staff: can only update status / note
                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-2"
                                                    onClick={() => handleOpenEdit(lead)}
                                                >
                                                    <Edit2 size={14} />
                                                    Update Status / Note
                                                </Button>
                                            )}
                                        </div>


                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Update Lead"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                        >
                            {statusOptions.map(option => (
                                <option key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes / Comments
                        </label>
                        <textarea
                            value={editComments}
                            onChange={(e) => setEditComments(e.target.value)}
                            className="w-full h-24 rounded-md border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                            placeholder="Add conversation notes..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveUpdate}>Save Changes</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};
