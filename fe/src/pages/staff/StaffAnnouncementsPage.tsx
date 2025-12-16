import React, { useEffect } from 'react';
import { useAnnouncement } from '../../hooks/useAnnouncement';
import { Card, CardContent } from '../../components/ui/Card';
import { AlertTriangle, Megaphone, Info } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const StaffAnnouncementsPage: React.FC = () => {
    const { announcements, loading, fetchAnnouncements } = useAnnouncement();

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-2">
                <Megaphone className="text-orange-500 h-8 w-8" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
                    <p className="text-gray-500 dark:text-gray-400">Latest updates and notices</p>
                </div>
            </div>

            <div className="space-y-4">
                {announcements.map((ann) => (
                    <Card key={ann._id} className={`border-l-4 ${ann.priority === 'urgent' ? 'border-l-red-500 shadow-md' : 'border-l-blue-500'}`}>
                        <CardContent className="p-6">
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
        </div>
    );
};
