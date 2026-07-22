import React, { useEffect, useState } from 'react';
import {
    Inbox,
    Search,
    Filter,
    Clock,
    CheckCircle,
    User,
    Mail,
    Building2,
    ExternalLink,
    Tag
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSupport, ISupportMessage } from '../../hooks/useSupport';

export const ContactsInboxPage: React.FC = () => {
    const { messages, loading, fetchSupportMessages, updateSupportStatus } = useSupport();
    const [selectedMessage, setSelectedMessage] = useState<ISupportMessage | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        category: ''
    });

    useEffect(() => {
        fetchSupportMessages(filters);
    }, [fetchSupportMessages, filters]);

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        const success = await updateSupportStatus(id, newStatus);
        if (success && selectedMessage?._id === id) {
            setSelectedMessage(prev => prev ? { ...prev, status: newStatus } as ISupportMessage : null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'read': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'sales': return <Tag className="w-4 h-4" />;
            case 'billing': return <Building2 className="w-4 h-4" />;
            case 'feature_request': return <Inbox className="w-4 h-4" />;
            default: return <Filter className="w-4 h-4" />;
        }
    };

    const filteredMessages = messages.filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const gymName = typeof m.gymId === 'object' && m.gymId ? m.gymId.name : '';
        return (
            m.name?.toLowerCase().includes(q) ||
            m.email?.toLowerCase().includes(q) ||
            m.message?.toLowerCase().includes(q) ||
            gymName?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-orange-600" />
                        Support Inbox
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Respond to support requests and feature ideas from gym owners and visitors.
                    </p>
                </div>

                <div className="flex gap-2">
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">All Statuses</option>
                        <option value="new">New / Unread</option>
                        <option value="read">Read</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                        value={filters.category}
                        onChange={e => setFilters({ ...filters, category: e.target.value })}
                    >
                        <option value="">All Categories</option>
                        <option value="sales">Sales</option>
                        <option value="support">Support</option>
                        <option value="billing">Billing</option>
                        <option value="feature_request">Features</option>
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
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredMessages.length === 0 && !loading && (
                            <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                No messages found.
                            </div>
                        )}
                        {filteredMessages.map((m) => (
                            <button
                                key={m._id}
                                onClick={() => {
                                    setSelectedMessage(m);
                                    if (m.status === 'new') handleStatusUpdate(m._id, 'read');
                                }}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedMessage?._id === m._id
                                    ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 ring-1 ring-orange-200'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(m.status)}`}>
                                        {m.status}
                                    </span>
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(m.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{m.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{m.email}</p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 capitalize bg-gray-50 dark:bg-gray-900/50 w-fit px-1.5 py-0.5 rounded">
                                    {getCategoryIcon(m.category)}
                                    {m.category.replace('_', ' ')}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail Column */}
                <div className="lg:col-span-7">
                    {selectedMessage ? (
                        <Card className="h-full">
                            <CardHeader className="flex flex-row items-center justify-between border-b dark:border-gray-700 pb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-lg">
                                        {selectedMessage.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMessage.name}</h2>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className="capitalize">{selectedMessage.source} Source</span>
                                            {selectedMessage.gymId && (
                                                <>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        Gym ID: {typeof selectedMessage.gymId === 'object' ? selectedMessage.gymId.name : selectedMessage.gymId}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedMessage.status !== 'closed' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10"
                                            onClick={() => handleStatusUpdate(selectedMessage._id, 'closed')}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Closed
                                        </Button>
                                    )}
                                    {selectedMessage.status === 'closed' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                            onClick={() => handleStatusUpdate(selectedMessage._id, 'read')}
                                        >
                                            <Inbox className="w-4 h-4 mr-2" /> Reopen
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Email Address</p>
                                        <div className="flex items-center gap-3 group">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-900 dark:text-white font-medium">{selectedMessage.email}</span>
                                            <a href={`mailto:${selectedMessage.email}`} className="text-orange-500 opacity-0 group-hover:opacity-100 transition">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                    {selectedMessage.phone && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Phone Number</p>
                                            <div className="flex items-center gap-3">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 dark:text-white font-medium">{selectedMessage.phone}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Message Content</p>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap italic">
                                        "{selectedMessage.message}"
                                    </p>
                                </div>

                                <div className="border-t dark:border-gray-700 pt-6">
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-orange-900 dark:text-orange-400">Reply Policy</p>
                                            <p className="text-xs text-orange-700 dark:text-orange-500/80 mt-1">
                                                Review the request details carefully. Responses should be sent via the customer's official email address provided above. Mark the ticket as "Closed" once the resolution is confirmed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mb-4">
                                <Inbox className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select a message</h3>
                            <p className="text-gray-500 max-w-xs mt-2 text-sm text-balance">
                                Choose a support request from the list to view full details and manage its status.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContactsInboxPage;
