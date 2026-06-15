import React, { useEffect, useState } from 'react';
import {
    Inbox,
    Search,
    Filter,
    Clock,
    CheckCircle,
    User,
    Mail,
    Smartphone,
    ExternalLink,
    ShieldCheck,
    MessageSquare,
    ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSupport, ISupportMessage } from '../../hooks/useSupport';
import { useAuth } from '../../contexts/AuthContext';

export const AdminSupportInboxPage: React.FC = () => {
    const { messages, loading, fetchGymSupportMessages, updateGymSupportStatus } = useSupport();
    const [selectedMessage, setSelectedMessage] = useState<ISupportMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        category: ''
    });
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'staff' && user?.position === 'manager';

    useEffect(() => {
        fetchGymSupportMessages(filters);
    }, [fetchGymSupportMessages, filters]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const success = await updateGymSupportStatus(id, newStatus);
        if (success) {
            // Update selected message state locally if it matches
            if (selectedMessage?._id === id) {
                setSelectedMessage(prev => prev ? {
                    ...prev,
                    status: newStatus,
                    isEscalated: newStatus === 'escalated' ? true : prev.isEscalated
                } as ISupportMessage : null);
            }
            // Refresh list to keep sync
            fetchGymSupportMessages(filters);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'read': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'escalated': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'support': return 'Technical Support';
            case 'billing': return 'Billing & Subscriptions';
            case 'feature_request': return 'Feedback / Suggestions';
            case 'sales': return 'Membership Upgrade';
            case 'other': return 'Other';
            default: return category;
        }
    };

    const filteredMessages = messages.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-orange-500" />
                        Member Support Inbox
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        View and manage support inquiries, billing questions, and feature requests submitted by your gym members.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-colors"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New / Unread</option>
                        <option value="read">Read</option>
                        <option value="escalated">Escalated</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-colors"
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                    >
                        <option value="">All Categories</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing & Subscriptions</option>
                        <option value="feature_request">Feedback / Suggestions</option>
                        <option value="sales">Membership Upgrade</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List Column */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-colors text-sm"
                        />
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {loading && messages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Loading member support tickets...
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                No support messages found.
                            </div>
                        ) : (
                            filteredMessages.map((m) => (
                                <button
                                    key={m._id}
                                    onClick={() => {
                                        setSelectedMessage(m);
                                        if (m.status === 'new') handleStatusUpdate(m._id, 'read');
                                    }}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                                        selectedMessage?._id === m._id
                                            ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-500 dark:border-orange-500/50 shadow-sm ring-1 ring-orange-500/30'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(m.status)}`}>
                                            {m.status}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(m.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-950 dark:text-white truncate pr-4">{m.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3">{m.email}</p>
                                    
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-300 font-medium bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-md">
                                            <MessageSquare className="w-3 h-3 text-orange-500" />
                                            {getCategoryLabel(m.category)}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-7">
                    {selectedMessage ? (
                        <Card className="h-full border border-gray-100 dark:border-gray-700 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-200 dark:border-orange-900/30">
                                        {selectedMessage.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.name}</h2>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>Member Support Request</span>
                                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                                            <span className="capitalize bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                {getCategoryLabel(selectedMessage.category)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {/* Closed tickets can be reopened by Admin or Manager (if not escalated) */}
                                    {selectedMessage.status === 'closed' && (!selectedMessage.isEscalated || isAdmin) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                            onClick={() => handleStatusUpdate(selectedMessage._id, 'read')}
                                        >
                                            <Inbox className="w-4 h-4 mr-1.5" /> Reopen Ticket
                                        </Button>
                                    )}

                                    {/* Escalated tickets that are closed show Final Decision (Closed) */}
                                    {selectedMessage.status === 'closed' && selectedMessage.isEscalated && (
                                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-900/30">
                                            Final Decision (Closed)
                                        </span>
                                    )}

                                    {/* Escalated tickets can only be resolved/closed by Admin */}
                                    {selectedMessage.status === 'escalated' && (
                                        <>
                                            {isAdmin ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 font-bold border border-green-200 dark:border-green-800/40 px-3 py-1.5"
                                                    onClick={() => handleStatusUpdate(selectedMessage._id, 'closed')}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1.5" /> Final Decision (Close)
                                                </Button>
                                            ) : (
                                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-900/30">
                                                    Escalated to Admin (Pending)
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {/* Active tickets ('new' or 'read') */}
                                    {(selectedMessage.status === 'new' || selectedMessage.status === 'read') && (
                                        <>
                                            {/* Managers can Resolve (Close) OR Escalate */}
                                            {isManager && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                                                        onClick={() => handleStatusUpdate(selectedMessage._id, 'closed')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1.5" /> Resolve (Close)
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30"
                                                        onClick={() => handleStatusUpdate(selectedMessage._id, 'escalated')}
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-1.5" /> Escalate to Admin
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Admins can Resolve (Close) */}
                                            {isAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                                                    onClick={() => handleStatusUpdate(selectedMessage._id, 'closed')}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1.5" /> Close Ticket
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">Email Address</p>
                                        <div className="flex items-center gap-2 group">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900 dark:text-white font-medium text-sm">{selectedMessage.email}</span>
                                            <a href={`mailto:${selectedMessage.email}`} className="text-orange-500 hover:text-orange-600 transition">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">Phone Number</p>
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900 dark:text-white font-medium text-sm">
                                                {selectedMessage.phone || 'Not provided'}
                                            </span>
                                            {selectedMessage.phone && (
                                                <a href={`tel:${selectedMessage.phone}`} className="text-orange-500 hover:text-orange-600 transition">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-3">Message Details</p>
                                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap italic text-sm">
                                        "{selectedMessage.message}"
                                    </p>
                                </div>

                                {selectedMessage.status === 'escalated' && (
                                    <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 flex items-start gap-3 mb-4">
                                        <ShieldCheck className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-purple-900 dark:text-purple-400">Escalated Ticket</p>
                                            <p className="text-xs text-purple-700 dark:text-purple-400/80 mt-1">
                                                This ticket was marked as complex by the Manager and has been escalated to the Gym Administrator for final decision.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t dark:border-gray-700 pt-6">
                                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                                        <ShieldCheck className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-400">Gym Administrator Reply Policy</p>
                                            <p className="text-xs text-orange-700 dark:text-orange-400/80 mt-1">
                                                Please contact the member using their email or phone number listed above. Make sure to mark this ticket as "Closed" once the issue has been resolved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-900/10 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                <Inbox className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select a support request</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mt-2 text-sm text-balance">
                                Click on a member support ticket from the list on the left to read details and update its status.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSupportInboxPage;
