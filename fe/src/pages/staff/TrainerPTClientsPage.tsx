import React, { useEffect, useState } from 'react';
import { usePT, PTAssignment } from '../../hooks/usePT';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { CheckCircle, Clock } from 'lucide-react';
import { SessionLogModal } from '../../components/pt/SessionLogModal';
import { Badge } from '../../components/ui/Badge';

export const TrainerPTClientsPage: React.FC = () => {
    const { assignments, loading, fetchAssignments, logSession } = usePT();
    const [selectedAssignment, setSelectedAssignment] = useState<PTAssignment | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Fetch assignments for this trainer
        // Backend handles filtering based on role mostly, but good to be explicit if needed.
        // For Trainer role, the backend automatically scopes to their ID.
        fetchAssignments();
    }, [fetchAssignments]);

    const handleLogClick = (assignment: PTAssignment) => {
        setSelectedAssignment(assignment);
        setIsLogModalOpen(true);
    };

    const handleLogSubmit = async (data: { date: string; notes?: string }) => {
        if (!selectedAssignment) return;
        setIsSubmitting(true);
        const success = await logSession(selectedAssignment._id, data);
        setIsSubmitting(false);
        if (success) {
            setIsLogModalOpen(false);
        }
    };

    if (loading && assignments.length === 0) {
        return <div className="p-8 text-center">Loading your clients...</div>;
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My PT Clients</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your personal training sessions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                    <Card key={assignment._id} className="border-l-4 border-l-orange-500">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{assignment.memberId.fullName}</h3>
                                    <p className="text-sm text-gray-500">{assignment.planId.name}</p>
                                </div>
                                <Badge className={assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                    {assignment.status}
                                </Badge>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500">Progress</span>
                                        <span className="font-medium dark:text-gray-200">{assignment.usedSessions} / {assignment.totalSessions} Sessions</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                        <div
                                            className="bg-orange-600 h-2.5 rounded-full"
                                            style={{ width: `${(assignment.usedSessions / assignment.totalSessions) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex items-center text-sm text-gray-500">
                                    <Clock size={14} className="mr-2" />
                                    Expires: {new Date(assignment.expiryDate).toLocaleDateString()}
                                </div>
                            </div>

                            <Button
                                className="w-full"
                                onClick={() => handleLogClick(assignment)}
                                disabled={assignment.status !== 'active'}
                            >
                                <CheckCircle size={16} className="mr-2" />
                                Log Completed Session
                            </Button>

                            {/* Recent Logs Preview */}
                            {assignment.sessionLogs.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Last Session</p>
                                    <div className="text-sm dark:text-gray-300">
                                        {new Date(assignment.sessionLogs[assignment.sessionLogs.length - 1].date).toLocaleDateString()}
                                        {assignment.sessionLogs[assignment.sessionLogs.length - 1].notes && (
                                            <span className="text-gray-400 block text-xs mt-1 italic">
                                                "{assignment.sessionLogs[assignment.sessionLogs.length - 1].notes}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}

                {assignments.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-gray-500">No active PT clients assigned to you.</p>
                    </div>
                )}
            </div>

            {selectedAssignment && (
                <SessionLogModal
                    isOpen={isLogModalOpen}
                    onClose={() => setIsLogModalOpen(false)}
                    onSubmit={handleLogSubmit}
                    clientName={selectedAssignment.memberId.fullName}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
};
