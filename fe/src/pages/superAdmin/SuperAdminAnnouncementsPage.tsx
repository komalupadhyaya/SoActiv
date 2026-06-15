import React, { useEffect, useState } from 'react';
import { useAnnouncement } from '../../hooks/useAnnouncement';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';
import { Plus, Trash2, AlertTriangle, Megaphone, Clock, Calendar, ShieldAlert } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';

export const SuperAdminAnnouncementsPage: React.FC = () => {
    const { announcements, loading, fetchAnnouncements, createAnnouncement, deleteAnnouncement } = useAnnouncement();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        priority: 'normal',
        expiresAt: ''
    });

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Super Admin announcements target admins platform-wide
        const data = {
            title: formData.title,
            message: formData.message,
            priority: formData.priority as 'normal' | 'urgent',
            targetAudience: 'admin' as const,
            expiresAt: formData.expiresAt 
                ? new Date(formData.expiresAt).toISOString() 
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 7 days
        };

        const success = await createAnnouncement(data);
        if (success) {
            setIsModalOpen(false);
            setFormData({
                title: '',
                message: '',
                priority: 'normal',
                expiresAt: ''
            });
            fetchAnnouncements(); // Refresh list to get new items
        }
    };

    const handleDelete = async (id: string) => {
        if (await confirm('Are you sure you want to delete this platform announcement? This will remove it for all gym admins.', { 
            title: 'Delete Platform Announcement',
            confirmText: 'Delete',
            type: 'danger'
        })) {
            const success = await deleteAnnouncement(id);
            if (success) {
                fetchAnnouncements(); // Refresh list
            }
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-indigo-950/40 to-purple-950/30 p-6 rounded-2xl border border-indigo-500/20 shadow-sm backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center gap-3">
                        <Megaphone className="text-indigo-400 animate-pulse" size={32} /> Platform Announcements
                    </h1>
                    <p className="text-indigo-950/70 dark:text-indigo-200/80 mt-2 text-sm max-w-xl font-medium">
                        Create and publish platform-wide alerts and updates (such as scheduled maintenance). These are delivered directly to all Gym Admins and do not broadcast to regular members.
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="sm:self-center flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Plus size={20} />
                    New Announcement
                </button>
            </div>

            {/* List */}
            <div className="space-y-4">
                {announcements.map((ann) => (
                    <Card 
                        key={ann._id} 
                        className={`overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-800 ${
                            ann.priority === 'urgent' 
                                ? 'border-l-rose-500 border border-gray-100 dark:border-rose-950/20' 
                                : 'border-l-indigo-500 border border-gray-100 dark:border-indigo-950/20'
                        }`}
                    >
                        <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{ann.title}</h3>
                                    {ann.priority === 'urgent' && (
                                        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-1 border border-rose-200 dark:border-rose-900/30">
                                            <AlertTriangle size={12} /> Urgent
                                        </Badge>
                                    )}
                                    <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/30">
                                        <ShieldAlert size={12} /> Platform Wide
                                    </Badge>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{ann.message}</p>
                                <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={13} /> Posted: {new Date(ann.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={13} /> Expires: {new Date(ann.expiresAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex self-end md:self-center gap-2">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 rounded-lg p-2"
                                    onClick={() => handleDelete(ann._id)}
                                    title="Delete Announcement"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {loading && announcements.length === 0 && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {!loading && announcements.length === 0 && (
                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                        <Megaphone className="mx-auto mb-3 opacity-30 text-gray-400" size={48} />
                        <p className="font-semibold text-lg">No platform announcements</p>
                        <p className="text-sm opacity-80 mt-1">Announcements you post will appear here and reach all Gym Admins.</p>
                    </div>
                )}
            </div>

            {/* Create Announcement Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Platform Announcement"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g., Scheduled Maintenance Notification"
                        className="w-full"
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Message Content</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed"
                            rows={5}
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            required
                            placeholder="Type announcement message here..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Priority Level</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expiry Date (Optional)</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={formData.expiresAt}
                                onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2"
                        >
                            Cancel
                        </Button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md shadow-indigo-500/10 transition-colors"
                        >
                            Publish Announcement
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Deletion Confirm Modal */}
            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                type={confirmState.type}
            />
        </div>
    );
};
