import React, { useEffect, useState } from 'react';
import { useAnnouncement, Announcement } from '../../hooks/useAnnouncement';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';
import { Plus, Trash2, Edit, AlertTriangle, Megaphone, Info } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const StaffAnnouncementsPage: React.FC = () => {
    const { announcements, loading, fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncement();
    const { user } = useAuth();
    const isManager = user?.role === 'staff' && user?.position === 'manager';

    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
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

    const handleEditClick = (ann: Announcement) => {
        setEditingAnnouncement(ann);
        setFormData({
            title: ann.title,
            message: ann.message,
            targetAudience: ann.targetAudience,
            priority: ann.priority,
            expiresAt: ann.expiresAt ? getLocalDateString(new Date(ann.expiresAt)) : '',
            visibleRoles: ann.visibleRoles ? ann.visibleRoles.join(', ') : ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            setFormData({
                title: '',
                message: '',
                targetAudience: 'all',
                priority: 'normal',
                expiresAt: '',
                visibleRoles: ''
            });
            fetchAnnouncements();
        }
    };

    const handleDelete = async (id: string) => {
        if (await confirm('Are you sure you want to delete this announcement?', { title: 'Delete Announcement' })) {
            await deleteAnnouncement(id);
            fetchAnnouncements();
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Megaphone className="text-orange-500 h-8 w-8" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
                        <p className="text-gray-500 dark:text-gray-400">Latest updates and notices</p>
                    </div>
                </div>
                {isManager && (
                    <Button onClick={handleNewClick}>
                        <Plus size={16} className="mr-2" />
                        New Announcement
                    </Button>
                )}
            </div>

            <div className="space-y-4">
                {announcements.map((ann) => (
                    <Card key={ann._id} className={`border-l-4 ${ann.priority === 'urgent' ? 'border-l-red-500 shadow-md' : 'border-l-blue-500'}`}>
                        <CardContent className="p-6 flex justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    {ann.priority === 'urgent' && <AlertTriangle className="text-red-500 h-5 w-5" />}
                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">{ann.title}</h3>
                                    {ann.priority === 'urgent' && (
                                        <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto">
                                        {new Date(ann.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {ann.message}
                                </div>
                            </div>
                            {isManager && !ann.isPlatformWide && (
                                <div className="flex items-start gap-1">
                                    <Button size="sm" variant="ghost" className="text-gray-500 hover:bg-gray-50" onClick={() => handleEditClick(ann)}>
                                        <Edit size={16} />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(ann._id)}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {!loading && announcements.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <Info className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">No new announcements at this time.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g. System Maintenance"
                    />

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                            rows={4}
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            required
                        />
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
                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                        required
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
        </div>
    );
};
