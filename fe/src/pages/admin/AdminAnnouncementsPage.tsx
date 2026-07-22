import React, { useEffect, useState } from 'react';
import { useAnnouncement } from '../../hooks/useAnnouncement';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';
import { Plus, Trash2, AlertTriangle, Megaphone, Edit } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
// import { Select } from '../../components/ui/Select';

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const AdminAnnouncementsPage: React.FC = () => {
    const { announcements, loading, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncement();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetAudience: 'all',
        priority: 'normal',
        expiresAt: '',
        visibleRoles: '' // CSV string for UI simplicity
    });

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleNewClick = () => {
        setEditingAnnouncement(null);
        setFormData({
            title: '',
            message: '',
            targetAudience: 'all',
            priority: 'normal',
            expiresAt: '',
            visibleRoles: ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleEditClick = (ann: any) => {
        setEditingAnnouncement(ann);
        setFormData({
            title: ann.title,
            message: ann.message,
            targetAudience: ann.targetAudience,
            priority: ann.priority,
            expiresAt: ann.expiresAt ? new Date(ann.expiresAt).toISOString().slice(0, 10) : '',
            visibleRoles: ann.visibleRoles ? ann.visibleRoles.join(', ') : ''
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
            if (wordCount > 15) {
                formErrors.title = 'Title cannot exceed 15 words';
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

        // Parse roles
        const roles = formData.visibleRoles
            ? formData.visibleRoles.split(',').map(r => r.trim().toLowerCase()).filter(Boolean)
            : [];

        // Validate future date
        const expiry = formData.expiresAt ? new Date(formData.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

        const payload = {
            ...formData,
            visibleRoles: roles,
            expiresAt: expiry.toISOString()
        };

        let success = false;
        if (editingAnnouncement) {
            success = await updateAnnouncement(editingAnnouncement._id, payload as any);
        } else {
            success = await createAnnouncement(payload as any);
        }

        if (success) {
            setIsModalOpen(false);
            setEditingAnnouncement(null);
            setErrors({});
            // Reset form
            setFormData({
                title: '',
                message: '',
                targetAudience: 'all',
                priority: 'normal',
                expiresAt: '',
                visibleRoles: ''
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (await confirm('Are you sure you want to delete this announcement?', { title: 'Delete Announcement' })) {
            await deleteAnnouncement(id);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="text-orange-500" /> Announcements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Broadcast updates to staff and members</p>
                </div>
                <Button onClick={handleNewClick}>
                    <Plus size={16} className="mr-2" />
                    New Announcement
                </Button>
            </div>

            <div className="grid gap-4">
                {announcements.map((ann) => (
                    <Card 
                        key={ann._id} 
                        className={`border-l-4 ${
                            ann.isPlatformWide
                                ? 'border-l-purple-500 bg-purple-50/10'
                                : ann.priority === 'urgent' 
                                    ? 'border-l-red-500' 
                                    : 'border-l-blue-500'
                        }`}
                    >
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-lg dark:text-white">{ann.title}</h3>
                                    {ann.priority === 'urgent' && (
                                        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                            <AlertTriangle size={12} /> Urgent
                                        </Badge>
                                    )}
                                    {ann.isPlatformWide ? (
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-850/30">
                                            Platform Broadcast
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">{ann.targetAudience.toUpperCase()}</Badge>
                                    )}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{ann.message}</p>
                                <div className="mt-2 text-xs text-gray-400">
                                    Expires: {new Date(ann.expiresAt).toLocaleDateString()}
                                    {ann.visibleRoles.length > 0 && ` • Roles: ${ann.visibleRoles.join(', ')}`}
                                </div>
                            </div>
                            {!ann.isPlatformWide && (
                                <div className="flex items-start gap-1">
                                    <Button size="sm" variant="ghost" className="text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => handleEditClick(ann)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDelete(ann._id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {!loading && announcements.length === 0 && (
                    <div className="text-center py-10 text-gray-500">No active announcements.</div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Announcement"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={e => {
                            setFormData({ ...formData, title: e.target.value });
                            if (errors.title) {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.title;
                                    return newErrors;
                                });
                            }
                        }}
                        required
                        placeholder="e.g. System Maintenance"
                        error={errors.title}
                    />

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                        <textarea
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                                errors.message
                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-orange-500 focus:border-orange-500'
                            }`}
                            rows={4}
                            value={formData.message}
                            onChange={e => {
                                setFormData({ ...formData, message: e.target.value });
                                if (errors.message) {
                                    setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors.message;
                                        return newErrors;
                                    });
                                }
                            }}
                            required
                        />
                        {errors.message && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Audience</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg mt-1 dark:bg-gray-700 dark:text-white"
                                value={formData.targetAudience}
                                onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                            >
                                <option value="all">All</option>
                                <option value="staff">Staff Only</option>
                                <option value="members">Members Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg mt-1 dark:bg-gray-700 dark:text-white"
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {formData.targetAudience === 'staff' && (
                        <Input
                            label="Limit to Roles (Optional, comma separated)"
                            placeholder="e.g. trainer, sales"
                            value={formData.visibleRoles}
                            onChange={e => setFormData({ ...formData, visibleRoles: e.target.value })}
                        />
                    )}

                    <Input
                        label="Expiry Date"
                        type="date"
                        value={formData.expiresAt}
                        min={getLocalDateString()}
                        onChange={e => {
                            setFormData({ ...formData, expiresAt: e.target.value });
                            if (errors.expiresAt) {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.expiresAt;
                                    return newErrors;
                                });
                            }
                        }}
                        required
                        error={errors.expiresAt}
                    />

                     <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{editingAnnouncement ? 'Save Changes' : 'Post Announcement'}</Button>
                    </div>
                </form>
            </Modal>

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
        </div >
    );
};
