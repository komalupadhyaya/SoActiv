import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  Inbox,
  Send,
  RefreshCw,
  User,
  ShieldCheck,
  Tag,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useClient } from '../../../hooks/useClient';
import { useSupport, ISupportMessage } from '../../../hooks/useSupport';
import { useToast } from '../../../contexts/ToastContext';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  read: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  escalated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  support: 'Locker & Facility Issues',
  billing: 'Billing & Membership',
  feature_request: 'Feedback & Suggestions',
  other: 'Other Inquiry',
  sales: 'Membership Upgrade',
};

export const RegisterComplaintPage: React.FC = () => {
  const { clients, refresh: refreshClients } = useClient();
  const { sendSupportMessage, fetchGymSupportMessages, messages, loading: messagesLoading } = useSupport();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [form, setForm] = useState({
    category: 'support',
    message: '',
    customName: '',
    customEmail: '',
    customPhone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshClients(),
        fetchGymSupportMessages(),
      ]);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return [];
    return clients.filter(c =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactNumber.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let ticketName = '';
    let ticketEmail = '';
    let ticketPhone = '';

    if (selectedClient) {
      ticketName = selectedClient.fullName;
      ticketEmail = selectedClient.email;
      ticketPhone = selectedClient.contactNumber;
    } else {
      ticketName = form.customName;
      ticketEmail = form.customEmail;
      ticketPhone = form.customPhone;
    }

    if (!ticketName || !ticketEmail || !form.message) {
      addToast('Please specify a member name, email, and the complaint description.', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: ticketName,
      email: ticketEmail,
      phone: ticketPhone,
      category: form.category,
      message: form.message,
      source: 'member', // Sets source to member so it routes to Gym Admin/Manager inbox
    };

    const success = await sendSupportMessage(payload);
    setSubmitting(false);

    if (success) {
      setSubmitted(true);
      setForm({
        category: 'support',
        message: '',
        customName: '',
        customEmail: '',
        customPhone: '',
      });
      setSelectedClient(null);
      setSearchTerm('');
      // Refresh complaints list
      fetchGymSupportMessages();
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const filteredComplaints = useMemo(() => {
    return messages
      .filter(m => filterStatus === 'all' || m.status === filterStatus)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / itemsPerPage));

  const paginatedComplaints = useMemo(() => {
    const validPage = Math.min(currentPage, totalPages);
    const start = (validPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage, totalPages, itemsPerPage]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Register Member Complaint</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Log technical support tickets or locker facility complaints on behalf of members.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Main Two-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT: Complaint Form (2/5) */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                New Support Ticket
              </h2>
            </CardHeader>
            <CardContent>
              {submitted && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200/60 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                  <CheckCircle size={15} />
                  Complaint registered! It was sent to the manager.
                </div>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Member Search / Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Search Gym Member
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Type member name, email, or phone..."
                        value={searchTerm}
                        onChange={e => {
                          setSearchTerm(e.target.value);
                          setSelectedClient(null);
                        }}
                        className="w-full text-sm border border-gray-300 dark:border-gray-700/80 rounded-xl pl-9 pr-3 py-2 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
                      />
                    </div>

                    {/* Member Dropdown results */}
                    {searchTerm && filteredClients.length > 0 && !selectedClient && (
                      <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 shadow-sm bg-white dark:bg-gray-800 z-10 relative">
                        {filteredClients.map(client => (
                          <button
                            key={client._id}
                            type="button"
                            onClick={() => setSelectedClient(client)}
                            className="w-full text-left p-2.5 hover:bg-orange-50/60 dark:hover:bg-orange-950/10 flex items-center justify-between transition text-xs"
                          >
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{client.fullName}</p>
                              <p className="text-gray-500">{client.contactNumber} · {client.email}</p>
                            </div>
                            <Badge className="bg-green-150 text-green-800 text-[10px]">
                              {client.status}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Client Card */}
                  {selectedClient ? (
                    <div className="p-3 bg-orange-50/40 dark:bg-orange-950/10 rounded-xl border border-orange-200/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 font-bold text-xs">
                          {selectedClient.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-900 dark:text-white">{selectedClient.fullName}</p>
                          <p className="text-[10px] text-gray-500">{selectedClient.email} · {selectedClient.contactNumber}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedClient(null); setSearchTerm(''); }}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    /* General Walk-in Customer Fields if no member is selected */
                    !searchTerm && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700/60 space-y-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Or Register Walk-in Guest</p>
                        <div className="space-y-2">
                          <Input
                            type="text"
                            placeholder="Guest Name"
                            value={form.customName}
                            onChange={e => setForm({ ...form, customName: e.target.value })}
                            className="text-xs"
                          />
                          <Input
                            type="email"
                            placeholder="Guest Email"
                            value={form.customEmail}
                            onChange={e => setForm({ ...form, customEmail: e.target.value })}
                            className="text-xs"
                          />
                          <Input
                            type="text"
                            placeholder="Guest Phone (optional)"
                            value={form.customPhone}
                            onChange={e => setForm({ ...form, customPhone: e.target.value })}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )
                  )}

                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full text-sm border border-gray-300 dark:border-gray-700/80 rounded-xl p-2.5 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      required
                    >
                      <option value="support">Locker / Facility / Equipment Support</option>
                      <option value="billing">Billing & Subscriptions</option>
                      <option value="feature_request">Feedback & Suggestions</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                  </div>

                  {/* Complaint message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Complaint Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full text-sm border border-gray-300 dark:border-gray-700/80 rounded-xl p-3 bg-transparent text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
                      placeholder="e.g. Locker room 14 lock is broken, or member complained about treadmill alignment..."
                    />
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setSelectedClient(null);
                        setSearchTerm('');
                        setForm({
                          category: 'support',
                          message: '',
                          customName: '',
                          customEmail: '',
                          customPhone: '',
                        });
                      }}
                      className="flex-1"
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md flex items-center justify-center gap-1.5"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Registering...
                        </span>
                      ) : (
                        <>
                          <Send size={14} />
                          Log Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Recent Gym Complaints (3/5) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-orange-500" />
                  Recent Gym Complaints
                </h2>
                {/* Filter Tabs */}
                <div className="flex gap-1 flex-wrap">
                  {['all', 'new', 'read', 'escalated', 'closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize transition ${
                        filterStatus === s
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {messagesLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-2">
                  <AlertCircle className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold">No complaints logged yet.</p>
                  <p className="text-xs font-normal">Use the form on the left to register a new complaint.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedComplaints.map((ticket: ISupportMessage) => (
                      <div key={ticket._id} className="p-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                {ticket.name}
                              </h3>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[ticket.status] || ''}`}>
                                {ticket.status}
                              </span>
                            </div>

                            <p className="text-xs text-gray-800 dark:text-gray-200 italic font-medium">
                              "{ticket.message}"
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 flex-wrap pt-0.5">
                              <span className="flex items-center gap-1">
                                <Tag size={10} className="text-orange-500" />
                                {CATEGORY_LABELS[ticket.category] || ticket.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {formatDate(ticket.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <User size={10} />
                                {ticket.email}
                              </span>
                            </div>

                            {/* Escalated Notification */}
                            {ticket.status === 'escalated' && (
                              <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 rounded-lg p-2 mt-1 text-[9px]">
                                <ShieldCheck size={11} className="shrink-0" />
                                <span>Escalated to gym administrator for action.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {filteredComplaints.length > itemsPerPage && (
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/20">
                      <span>
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredComplaints.length)} - {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
                          title="Previous Page"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="px-2 font-semibold text-gray-700 dark:text-gray-300">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
                          title="Next Page"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterComplaintPage;
