import React, { useEffect, useState } from 'react';
import { useAnnouncement, Announcement } from '../../hooks/useAnnouncement';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Plus, Trash2, AlertTriangle, Info, Megaphone } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';

export const AdminAnnouncementsPage: React.FC = () => {
    const { announcements, loading, fetchAnnouncements, createAnnouncement, deleteAnnouncement } = useAnnouncement();
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse roles
        const roles = formData.visibleRoles
            ? formData.visibleRoles.split(',').map(r => r.trim().toLowerCase()).filter(Boolean)
            : [];

        // Validate future date
        const expiry = formData.expiresAt ? new Date(formData.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

        await createAnnouncement({
            ...formData,
            visibleRoles: roles,
            expiresAt: expiry.toISOString()
        } as any);

        setIsModalOpen(false);
        // Reset form
        setFormData({
            title: '',
            message: '',
            targetAudience: 'all',
            priority: 'normal',
            expiresAt: '',
            visibleRoles: ''
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
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
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    New Announcement
                </Button>
            </div>

            <div className="grid gap-4">
                {announcements.map((ann) => (
                    <Card key={ann._id} className={`border-l-4 ${ann.priority === 'urgent' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-bold text-lg dark:text-white">{ann.title}</h3>
                                    {ann.priority === 'urgent' && (
                                        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                                            <AlertTriangle size={12} /> Urgent
                                        </Badge>
                                    )}
                                    <Badge variant="outline">{ann.targetAudience.toUpperCase()}</Badge>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{ann.message}</p>
                                <div className="mt-2 text-xs text-gray-400">
                                    Expires: {new Date(ann.expiresAt).toLocaleDateString()}
                                    {ann.visibleRoles.length > 0 && ` • Roles: ${ann.visibleRoles.join(', ')}`}
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(ann._id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
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
                        <Button type="submit">Post Announcement</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
