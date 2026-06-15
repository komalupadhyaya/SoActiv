
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStaffPermissions } from '../../hooks/useStaffPermissions';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useClient } from '../../hooks/useClient';
import { useAttendance } from '../../hooks/useStaffAttendance';
import { useAnnouncement } from '../../hooks/useAnnouncement';
import { useEnquiry } from '../../hooks/useEnquiry';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { ReceptionistDashboard } from './ReceptionistDashboard';
import {
    Users,
    Calendar,
    CheckCircle,
    TrendingUp,
    Bell,
    Clock,
    ClipboardList,
    Lock
} from 'lucide-react';
import { format } from 'date-fns';

export const StaffDashboard: React.FC = () => {
    const { user } = useAuth();
    const {
        canViewMembers,
        canViewSchedule,
        canMarkAttendance,
        canViewTasks,
        canViewLeads,
        isTrainer,
        isManager,
        isCleaner,
        isReceptionist,
        isSales
    } = useStaffPermissions();

    // Hooks
    const { upcomingFollowUps, fetchUpcomingFollowUps } = useFollowUp();
    const { clients, refresh: fetchClients } = useClient();
    const { getAttendanceByStaff } = useAttendance();
    const { announcements, fetchAnnouncements } = useAnnouncement();
    const { myEnquiries, fetchMyEnquiries, refreshEnquiries } = useEnquiry();

    // Local State
    const [myAttendance, setMyAttendance] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filtered Data
    const assignedMembers = clients.filter(c =>
        (c.trainer as any)?._id === user?.staffId ||
        (c.salesRep as any)?._id === user?.staffId ||
        (c.personalTrainer as any)?._id === user?.staffId
    );

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Parallel fetch
                const promises = [];

                // 1. Follow Ups
                promises.push(fetchUpcomingFollowUps());
                promises.push(fetchAnnouncements());

                // 2. Clients (if allowed)
                if (canViewMembers) {
                    promises.push(fetchClients()); // This fetches all clients, we filter in render
                }

                // 3. Enquiries (if allowed)
                if (canViewLeads) {
                    promises.push(isSales ? fetchMyEnquiries() : refreshEnquiries());
                }

                if (user?.staffId) {
                    // Create a window around "today" to account for slight timezone mismatches between client/server
                    const now = new Date();
                    const yesterday = new Date(now);
                    yesterday.setDate(now.getDate() - 1);
                    const tomorrow = new Date(now);
                    tomorrow.setDate(now.getDate() + 1);

                    const formatDate = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD

                    promises.push(
                        getAttendanceByStaff(user.staffId, formatDate(yesterday), formatDate(tomorrow)).then(res => {
                            if (res.records && res.records.length > 0) {
                                // Find the record that matches today's date in local time
                                const todayStr = formatDate(now);
                                const todayRecord = res.records.find(r => r.date === todayStr);

                                if (todayRecord) {
                                    setMyAttendance(todayRecord);
                                } else {
                                    // Fallback: If no exact string match, check if any record was created "today" 
                                    // This handles cases where backend date string might differ slightly but timestamp is correct
                                    const recordCreatedToday = res.records.find(r => {
                                        const recDate = new Date(r.date);
                                        return recDate.getDate() === now.getDate() &&
                                            recDate.getMonth() === now.getMonth() &&
                                            recDate.getFullYear() === now.getFullYear();
                                    });
                                    if (recordCreatedToday) setMyAttendance(recordCreatedToday);
                                }
                            }
                        }).catch(err => console.error("Failed to fetch attendance", err))
                    );
                }

                await Promise.all(promises);
            } catch (error) {
                console.error("Dashboard data load failed", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [fetchUpcomingFollowUps, fetchClients, getAttendanceByStaff, canViewMembers, user?.staffId, fetchAnnouncements]);

    if (isReceptionist) {
        return <ReceptionistDashboard />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            {/* Header is handled by Layout, we just insert content padding handled by Layout too */}
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.name}</p>
                </div>

                {/* Disabled Feature Alerts for Staff */}
                {user?.gymFeatures && (
                    <div className="space-y-3 mb-6">
                        {/* Manager: shows all disabled features */}
                        {isManager && Object.values(user.gymFeatures).some(val => val === false) && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl shadow-sm flex items-start gap-3">
                                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Gym Features Partially Disabled</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                        The platform administration has disabled the following features for this gym:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 text-xs text-amber-800 dark:text-amber-500/80 font-medium space-y-1">
                                        {user.gymFeatures.payments === false && <li>Billing, Payments, and Invoices</li>}
                                        {user.gymFeatures.attendance === false && <li>Member Attendance Tracking & Check-ins</li>}
                                        {user.gymFeatures.pt === false && <li>Personal Training & PT Assignments</li>}
                                        {user.gymFeatures.classes === false && <li>Group Class Scheduling</li>}
                                        {user.gymFeatures.memberPortal === false && <li>Member Portal Access (Workouts, Diet, Goals, Photos)</li>}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Trainer: shows PT & Classes disabled features */}
                        {isTrainer && !isManager && (
                            <>
                                {user.gymFeatures.pt === false && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                                        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Personal Training Disabled</h4>
                                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                                Personal Training features and trainer assignments have been disabled by platform administration.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {user.gymFeatures.classes === false && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                                        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Class Scheduling Disabled</h4>
                                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                                Class scheduling features have been disabled by platform administration.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Cleaner: shows Attendance disabled features */}
                        {isCleaner && !isManager && user.gymFeatures.attendance === false && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                                <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Attendance Tracking Disabled</h4>
                                    <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                        Attendance tracking features have been disabled for this gym by platform administration.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Other Staff (Receptionist, Sales): shows relevant disabled features */}
                        {!isManager && !isTrainer && !isCleaner && (
                            <>
                                {user.gymFeatures.payments === false && (user.position === 'receptionist' || user.position === 'sales') && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                                        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Billing Features Disabled</h4>
                                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                                Billing, payment logging, and invoices are currently disabled by platform administration.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {user.gymFeatures.attendance === false && user.position === 'receptionist' && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3 shadow-sm">
                                        <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Member Check-in Disabled</h4>
                                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                                                Member attendance tracking and check-in portals are currently disabled by platform administration.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className={`grid grid-cols-1 md:grid-cols-2 ${isCleaner ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6 mb-8`}>
                    {/* Attendance Status */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Status</p>
                                    <p className={`text-xl font-bold mt-1 ${myAttendance?.status === 'present' ? 'text-green-600' : 'text-gray-500'}`}>
                                        {myAttendance ? (
                                            <span className="capitalize">
                                                {myAttendance.status}
                                            </span>
                                        ) : (
                                            "Not Checked In"
                                        )}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${myAttendance?.status === 'present' ? 'bg-green-100 text-green-600' : 'bg-gray-400 text-white dark:bg-gray-600'}`}>
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assigned Members / Leads (Hidden for Cleaners) */}
                    {!isCleaner && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {isSales ? 'My Leads' : 'My Members'}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                            {isSales ? myEnquiries.length : assignedMembers.length}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                        {isSales ? (
                                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Tasks */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {isCleaner ? 'Pending Cleaning Tasks' : 'Pending Tasks'}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                        {upcomingFollowUps.length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance / Placeholder (Hidden for Cleaners) */}
                    {!isCleaner && (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                            --
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Tasks & Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upcoming Tasks */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-orange-500" />
                                    {isCleaner ? 'Upcoming Cleaning Tasks' : 'Upcoming Tasks / Follow-ups'}
                                </h2>
                            </CardHeader>
                            <CardContent>
                                {upcomingFollowUps.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No pending tasks. Good job!
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {upcomingFollowUps.slice(0, 5).map(task => (
                                            <div key={task._id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{task.relatedName}</p>
                                                    <p className="text-sm text-gray-500 capitalize">
                                                        {isCleaner ? 'Cleaning Task' : `${task.type} - ${format(new Date(task.scheduledDate), 'MMM d, yyyy')}`}
                                                    </p>
                                                    {task.note && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{task.note}</p>}
                                                </div>
                                                <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {canMarkAttendance && (
                                        <Link to="/staff/attendance" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:md:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition ">
                                            <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                                            <span className="text-sm font-medium">Check In/Out</span>
                                        </Link>
                                    )}
                                    {canViewMembers && (
                                        <Link to="/staff/members" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition">
                                            <Users className="w-6 h-6 text-blue-500 mb-2" />
                                            <span className="text-sm font-medium">My Members</span>
                                        </Link>
                                    )}
                                    {canViewTasks && (
                                        <Link to="/staff/follow-ups" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition">
                                            <Clock className="w-6 h-6 text-purple-500 mb-2" />
                                            <span className="text-sm font-medium">{isCleaner ? 'Cleaning Tasks' : 'Log Task'}</span>
                                        </Link>
                                    )}
                                    {canViewSchedule && (
                                        <Link to="/staff/schedule" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition">
                                            <Calendar className="w-6 h-6 text-orange-500 mb-2" />
                                            <span className="text-sm font-medium">Schedule</span>
                                        </Link>
                                    )}
                                    {isTrainer && (
                                        <Link to="/staff/my-clients" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition">
                                            <Users className="w-6 h-6 text-indigo-500 mb-2" />
                                            <span className="text-sm font-medium">My Clients</span>
                                        </Link>
                                    )}
                                    {canViewLeads && (
                                        <Link to="/staff/enquiries" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition">
                                            <TrendingUp className="w-6 h-6 text-pink-500 mb-2" />
                                            <span className="text-sm font-medium">Sales Leads</span>
                                        </Link>
                                    )}
                                    {isManager && (
                                        <Link to="/staff/team-attendance" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-600 hover:border-orange-500 hover:bg-orange-50 transition">
                                            <ClipboardList className="w-6 h-6 text-teal-500 mb-2" />
                                            <span className="text-sm font-medium">Team Attend.</span>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Announcements & Status */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Announcements Widget */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                        <Bell className="w-5 h-5 mr-2 text-yellow-500" />
                                        Announcements
                                    </h2>
                                    <Link to="/staff/announcements" className="text-sm text-orange-500 hover:text-orange-600">
                                        View All
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {announcements.length === 0 ? (
                                        <p className="text-gray-500 text-sm">No new announcements.</p>
                                    ) : (
                                        announcements.slice(0, 3).map(ann => (
                                            <div key={ann._id} className={`p-3 rounded-lg border-l-4 ${ann.priority === 'urgent' ? 'bg-red-50 dark:bg-red-900/10 border-red-500' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-500'}`}>
                                                <p className="font-medium text-gray-900 dark:text-white">{ann.title}</p>
                                                <p className="text-xs text-gray-400 mt-1 flex justify-between">
                                                    <span>{ann.targetAudience.toUpperCase()}</span>
                                                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* My Assigned Members Preview / Leads Preview (Hidden for Cleaners) */}
                        {!isCleaner && (
                            <Card>
                                <CardHeader>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {isSales ? 'Recent Leads' : 'Recent Members'}
                                    </h2>
                                </CardHeader>
                                <CardContent>
                                    {isSales ? (
                                        myEnquiries.length > 0 ? (
                                            <ul className="space-y-3">
                                                {myEnquiries.slice(0, 4).map(lead => (
                                                    <li key={lead._id} className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xs font-bold text-pink-600 dark:text-pink-400">
                                                            {lead.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{lead.status} • {lead.source}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500">No leads assigned.</p>
                                        )
                                    ) : (
                                        assignedMembers.length > 0 ? (
                                            <ul className="space-y-3">
                                                {assignedMembers.slice(0, 4).map(member => (
                                                    <li key={member._id} className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                            {member.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.fullName}</p>
                                                            <p className="text-xs text-gray-500">{member.plan} plan</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500">No members assigned.</p>
                                        )
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
