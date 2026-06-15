import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Lightbulb,
  Clock,
  RefreshCw,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSupport, ISupportMessage } from '../../hooks/useSupport';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  read: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  escalated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  closed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  support: 'Locker & Gym Facilities',
  billing: 'Billing & Membership',
  feature_request: 'Feedback & Suggestions',
  sales: 'Membership Upgrade',
  other: 'Other Inquiry',
};

export const MemberSupportPage: React.FC = () => {
  const { user } = useAuth();
  const { sendSupportMessage, fetchMySupportMessages, messages, loading } = useSupport();
  const [submitted, setSubmitted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    category: 'support',
    message: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setPageLoading(true);
    try {
      await fetchMySupportMessages();
    } catch (e) {
      console.error('Failed to load support messages:', e);
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    const success = await sendSupportMessage({
      ...formData,
      gymId: user?.gym
    });
    if (success) {
      setSubmitted(true);
      setFormData(prev => ({
        ...prev,
        message: ''
      }));
      // Reload tickets list
      fetchMySupportMessages();
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contact & Support</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Log support requests, facility complaints, or feature suggestions.
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

      {/* Grid Features overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-950 dark:text-white">Gym Facilities</p>
              <p className="text-[10px] text-gray-500">Lockers, towels, machines, space.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-950 dark:text-white">Billing Queries</p>
              <p className="text-[10px] text-gray-500">Refunds, upgrades, billing terms.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-950 dark:text-white">Feedback & Ideas</p>
              <p className="text-[10px] text-gray-500">Suggestions to improve your gym.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vertical Stacking Layout */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              New Support Ticket
            </h2>
          </CardHeader>
          <CardContent>
            {submitted && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200/60 rounded-xl flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                <CheckCircle2 size={15} />
                Message sent successfully to Gym Admin!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    disabled
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Phone (Optional)</label>
                  <Input
                    type="text"
                    placeholder="+91 0000000000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Category</label>
                  <select
                    className="w-full text-sm border border-gray-300 dark:border-gray-700/80 rounded-xl p-2.5 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="feature_request">Feedback / Suggestions</option>
                    <option value="sales">Membership Upgrade</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Message <span className="text-red-500">*</span></label>
                <textarea
                  rows={4}
                  className="w-full text-sm border border-gray-300 dark:border-gray-700/80 rounded-xl p-3 bg-transparent text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 transition"
                  placeholder="Describe your issue or request in detail..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-700 dark:text-orange-300 leading-tight">
                  Your message will go directly to your gym's administrative team for review.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-md flex items-center justify-center gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Support Message
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Your Logged Tickets
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            {pageLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
              </div>
            ) : sortedMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-2">
                <AlertCircle className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-sm font-semibold">No tickets logged yet.</p>
                <p className="text-xs">Any support messages or complaints you send will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {sortedMessages.map((ticket: ISupportMessage) => (
                  <div key={ticket._id} className="p-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-full">
                            <Tag size={9} />
                            {CATEGORY_LABELS[ticket.category] || ticket.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[ticket.status] || ''}`}>
                            {ticket.status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-800 dark:text-gray-200 italic font-medium">
                          "{ticket.message}"
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            Sent on {formatDate(ticket.createdAt)}
                          </span>
                        </div>

                        {ticket.isEscalated && (
                          <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 rounded-lg p-2 mt-1 text-[9px]">
                            <ShieldCheck size={11} className="shrink-0" />
                            <span>Escalated to Gym Owner for quick action.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberSupportPage;
