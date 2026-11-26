import React, { useEffect, useState } from 'react';
import { useAnnouncement, Announcement } from '../../hooks/useAnnouncement';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';
import { Plus, Trash2, AlertTriangle, Megaphone, Clock, Calendar, ShieldAlert, Edit } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const SuperAdminAnnouncementsPage: React.FC = () => {
    const { announcements, loading, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncement();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        priority: 'normal',
        expiresAt: ''
    });

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleNewClick = () => {
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            message: '',
            priority: 'normal',
            expiresAt: ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleEditClick = (ann: Announcement) => {
        setEditingAnnouncement(ann);
        setFormData({
            title: ann.title,
            message: ann.message,
            priority: ann.priority,
            expiresAt: ann.expiresAt ? getLocalDateString(new Date(ann.expiresAt)) : ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors: Record<string, string> = {};

        const titleTrimmed = formData.title.trim();
        if (!titleTrimmed) {
            formErrors.title = 'Title is required';
        } else {
            const wordCount = titleTrimmed.split(/\s+/).filter(Boolean).length;
            if (wordCount > 25) {
                formErrors.title = 'Title cannot exceed 25 words';
            } else if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(titleTrimmed)) {
                formErrors.title = 'Title can only contain letters, numbers, spaces, and basic punctuation';
            }
        }

        const messageTrimmed = formData.message.trim();
        if (!messageTrimmed) {
            formErrors.message = 'Message is required';
        } else {
            const wordCount = messageTrimmed.split(/\s+/).filter(Boolean).length;
            if (wordCount > 50) {
                formErrors.message = 'Message cannot exceed 50 words';
            } else if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(messageTrimmed)) {
                formErrors.message = 'Message can only contain letters, numbers, spaces, and basic punctuation';
            }
        }

        const todayStr = getLocalDateString();
        if (formData.expiresAt && formData.expiresAt < todayStr) {
            formErrors.expiresAt = 'Expiry date cannot be in the past';
        }

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        // Expiry at end of day (23:59:59.999)
        let expiry: Date;
        if (formData.expiresAt) {
            const [year, month, day] = formData.expiresAt.split('-').map(Number);
            expiry = (year && month && day)
                ? new Date(year, month - 1, day, 23, 59, 59, 999)
                : new Date(formData.expiresAt);
        } else {
            expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            expiry.setHours(23, 59, 59, 999);
        }

        const data = {
            title: formData.title,
            message: formData.message,
            priority: formData.priority as 'normal' | 'urgent',
            targetAudience: 'admin' as const,
            expiresAt: expiry.toISOString()
        };

        let success = false;
        if (editingAnnouncement) {
            success = await updateAnnouncement(editingAnnouncement._id, data);
        } else {
            success = await createAnnouncement(data);
        }

        if (success) {
            setIsModalOpen(false);
            setEditingAnnouncement(null);
            setFormData({
                title: '',
                message: '',
                priority: 'normal',
                expiresAt: ''
            });
            setErrors({});
            fetchAnnouncements();
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
                fetchAnnouncements();
            }
        }
    };

    const titleWordCount = formData.title.trim() ? formData.title.trim().split(/\s+/).filter(Boolean).length : 0;
    const messageWordCount = formData.message.trim() ? formData.message.trim().split(/\s+/).filter(Boolean).length : 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-indigo-950/40 to-purple-950/30 p-6 rounded-2xl border border-indigo-500/20 shadow-sm backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center gap-3">
                        <Megaphone className="h-8 w-8 text-indigo-400 animate-pulse" /> Platform Announcements
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Broadcast announcements globally to all Gym Admins on the platform.</p>
                </div>
                <Button 
                    onClick={handleNewClick}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 border-none h-11 px-5 rounded-xl font-medium flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Announcement
                </Button>
            </div>

            {/* Announcements Grid */}
            <div className="grid gap-5">
                {announcements.map((ann) => (
                    <Card 
                        key={ann._id} 
                        className={`overflow-hidden border transition-all duration-300 hover:shadow-md ${
                            ann.priority === 'urgent' 
                                ? 'border-red-500/30 bg-red-950/10 dark:bg-red-950/20' 
                                : 'border-indigo-500/20 bg-card/60 backdrop-blur-sm'
                        }`}
                    >
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                            {ann.title}
                                        </h3>
                                        {ann.priority === 'urgent' && (
                                            <Badge className="bg-red-500/10 text-red-500 border border-red-500/30 flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full">
                                                <AlertTriangle size={13} />
                                                Urgent Priority
                                            </Badge>
                                        )}
                                        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-medium rounded-full">
                                            Platform Wide
                                        </Badge>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                        {ann.message}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={13} className="text-gray-500" />
                                            <span>Posted: {new Date(ann.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={13} className="text-gray-500" />
                                            <span>Expires: {new Date(ann.expiresAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 self-end sm:self-start border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-9 w-9 p-0 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10"
                                        onClick={() => handleEditClick(ann)}
                                        title="Edit Announcement"
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-9 w-9 p-0 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                        onClick={() => handleDelete(ann._id)}
                                        title="Delete Announcement"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {!loading && announcements.length === 0 && (
                    <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-700/50 bg-gray-900/20 text-gray-400">
                        <Megaphone className="mx-auto h-12 w-12 text-gray-600 mb-3 opacity-50" />
                        <h3 className="text-base font-semibold text-gray-300">No active platform announcements</h3>
                        <p className="text-sm opacity-80 mt-1">Announcements you post will appear here and reach all Gym Admins.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Announcement Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAnnouncement ? 'Edit Platform Announcement' : 'Create Platform Announcement'}
                closeOnOutsideClick={false}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <Input
                            label="Title"
                            value={formData.title}
                            onChange={e => {
                                setFormData({ ...formData, title: e.target.value });
                                if (errors.title) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.title;
                                        return next;
                                    });
                                }
                            }}
                            required
                            placeholder="e.g., Scheduled Maintenance Notification"
                            className="w-full"
                            error={errors.title}
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-xs ${
                                titleWordCount > 25 
                                    ? 'text-red-500 font-semibold' 
                                    : 'text-gray-400 dark:text-gray-500'
                            }`}>
                                {titleWordCount}/25 words
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Message Content</label>
                        <textarea
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed ${
                                errors.message ? 'border-red-500 focus:ring-red-500' : ''
                            }`}
                            rows={5}
                            value={formData.message}
                            onChange={e => {
                                setFormData({ ...formData, message: e.target.value });
                                if (errors.message) {
                                    setErrors(prev => {
                                        const next = { ...prev };
                                        delete next.message;
                                        return next;
                                    });
                                }
                            }}
                            required
                            placeholder="Type announcement message here..."
                        />
                        {errors.message && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
                        )}
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
                                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                                    errors.expiresAt ? 'border-red-500' : ''
                                }`}
                                value={formData.expiresAt}
                                onChange={e => {
                                    setFormData({ ...formData, expiresAt: e.target.value });
                                    if (errors.expiresAt) {
                                        setErrors(prev => {
                                            const next = { ...prev };
                                            delete next.expiresAt;
                                            return next;
                                        });
                                    }
                                }}
                                min={getLocalDateString()}
                            />
                            {errors.expiresAt && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.expiresAt}</p>
                            )}
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
                            {editingAnnouncement ? 'Save Changes' : 'Publish Announcement'}
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
