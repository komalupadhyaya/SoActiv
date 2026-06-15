import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  User,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Bell,
  Phone,
  Mail,
  AlertTriangle,
  ChevronRight,
  UserPlus,
  Send,
  Smartphone,
  Info,
  MapPin,
  ClipboardList,
  Sparkles,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useClient } from '../../hooks/useClient';
import { useClientAttendance } from '../../hooks/useClientAttendance';
import { useEnquiry } from '../../hooks/useEnquiry';
import { useGymClass } from '../../hooks/useGymClass';
import { useSchedule } from '../../hooks/useSchedule';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useAttendance } from '../../hooks/useStaffAttendance';
import { useAnnouncement } from '../../hooks/useAnnouncement';

export const ReceptionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const { clients, loading: clientsLoading, notifyRenewal, forwardRenewal, refresh: refreshClients } = useClient();
  const { markClientAttendance, fetchTodayLogs } = useClientAttendance();
  const { enquiries, createEnquiry, assignStaff, refreshEnquiries } = useEnquiry();
  const { sessions, fetchUpcomingSessions, staffBookSession } = useGymClass();
  const { createScheduleEvent } = useSchedule();
  const { staff, fetchAllStaff } = useStaff();
  const { addToast } = useToast();
  const { upcomingFollowUps, fetchUpcomingFollowUps } = useFollowUp();
  const { getAttendanceByStaff } = useAttendance();
  const { announcements, fetchAnnouncements } = useAnnouncement();

  // Dashboard state & data loaders
  const [myAttendance, setMyAttendance] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // New Modal States for receptionist widgets
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isClassListModalOpen, setIsClassListModalOpen] = useState(false);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Mark Attendance State
  const [attendanceNote, setAttendanceNote] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);


  // Enquiry Form State
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'walk-in',
    interests: '',
    budget: '',
    comments: '',
    assignedStaff: '',
    followUpDate: ''
  });

  // Class Booking Modal State
  const [isClassBookingOpen, setIsClassBookingOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [bookingMemberId, setBookingMemberId] = useState('');

  // PT/Appointment Booking Form State
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [apptForm, setApptForm] = useState({
    title: '',
    description: '',
    type: 'member-session', // 'member-session' (consultation/assessment), 'task' (gym tour)
    scheduledDate: '',
    scheduledTime: '',
    assignedStaff: '',
    relatedMember: '',
  });

  // Lead Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignEnquiryId, setAssignEnquiryId] = useState('');
  const [assignStaffId, setAssignStaffId] = useState('');

  // Renewal Forward Modal State
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [forwardClientId, setForwardClientId] = useState('');
  const [forwardStaffId, setForwardStaffId] = useState('');
  const [forwardNote, setForwardNote] = useState('');

  // Load Dashboard & receptionist data in parallel
  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const promises = [];
        promises.push(fetchUpcomingFollowUps());
        promises.push(fetchAnnouncements());
        promises.push(refreshClients());
        promises.push(refreshEnquiries());
        promises.push(fetchUpcomingSessions(undefined, 30));
        promises.push(fetchAllStaff());

        if (user?.staffId) {
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          const formatDateStr = (d: Date) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD

          promises.push(
            getAttendanceByStaff(user.staffId, formatDateStr(yesterday), formatDateStr(tomorrow)).then(res => {
              if (res.records && res.records.length > 0) {
                const todayStr = formatDateStr(now);
                const todayRecord = res.records.find(r => r.date === todayStr);
                if (todayRecord) {
                  setMyAttendance(todayRecord);
                } else {
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
        setDashboardLoading(false);
      }
    };

    loadDashboardData();
    fetchTodayAttendanceLogs();
  }, [refreshClients, refreshEnquiries, fetchUpcomingSessions, fetchAllStaff, fetchUpcomingFollowUps, fetchAnnouncements, getAttendanceByStaff, user?.staffId]);

  // Fetch Today Attendance Log helper
  const fetchTodayAttendanceLogs = async () => {
    try {
      const logs = await fetchTodayLogs();
      setTodayAttendance(logs);
    } catch (e) {
      console.error('Failed to fetch today attendance logs:', e);
    }
  };

  // Filter Sales representatives and trainers
  const salesStaff = useMemo(() => staff.filter(s => s.position === 'sales' && s.status === 'active'), [staff]);
  const trainers = useMemo(() => staff.filter(s => s.position === 'trainer' && s.status === 'active'), [staff]);

  // Filter out cleaning tasks (type 'other') for receptionist dashboard
  const filteredUpcomingFollowUps = useMemo(() => {
    return upcomingFollowUps.filter(task => task.type !== 'other');
  }, [upcomingFollowUps]);

  // Clients search filtering
  const filteredClients = useMemo(() => {
    if (!searchTerm) return [];
    return clients.filter(c => 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactNumber.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clients]);

  // Renewals groupings
  const renewals = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const getDaysDiff = (dateStr: string) => {
      const end = new Date(dateStr);
      end.setHours(0,0,0,0);
      return Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    return {
      today: clients.filter(c => c.status === 'expired' || getDaysDiff(c.endDate) === 0),
      threeDays: clients.filter(c => {
        const diff = getDaysDiff(c.endDate);
        return diff > 0 && diff <= 3;
      }),
      sevenDays: clients.filter(c => {
        const diff = getDaysDiff(c.endDate);
        return diff > 3 && diff <= 7;
      })
    };
  }, [clients]);

  // Class Session Availability
  const getSessionAvailability = (session: any) => {
    const count = session.bookedCount || 0;
    const capacity = session.capacity || 15;
    return {
      booked: count,
      capacity: capacity,
      available: capacity - count,
      percent: (count / capacity) * 100
    };
  };

  // Action: Mark Attendance
  const handleMarkAttendance = async (clientId: string, action: 'check-in' | 'check-out') => {
    const res = await markClientAttendance(clientId, action, attendanceNote);
    if (res.success) {
      addToast(res.message, 'success');
      setAttendanceNote('');
      setSelectedClient(null);
      setSearchTerm('');
      fetchTodayAttendanceLogs();
      refreshClients();
    } else {
      addToast(res.message, 'error');
    }
  };



  // Action: Log Enquiry
  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await createEnquiry({
      name: enquiryForm.name,
      phone: enquiryForm.phone,
      email: enquiryForm.email || undefined,
      source: enquiryForm.source,
      status: 'new',
      assignedStaff: enquiryForm.assignedStaff || null,
      followUpDate: enquiryForm.followUpDate || null,
      comments: enquiryForm.comments,
      interests: enquiryForm.interests,
      budget: enquiryForm.budget
    });

    if (data) {
      setIsEnquiryModalOpen(false);
      setEnquiryForm({
        name: '',
        phone: '',
        email: '',
        source: 'walk-in',
        interests: '',
        budget: '',
        comments: '',
        assignedStaff: '',
        followUpDate: ''
      });
      refreshEnquiries();
    }
  };

  // Action: Assign Lead to Sales
  const handleAssignLead = async () => {
    if (!assignStaffId) return;
    const res = await assignStaff(assignEnquiryId, assignStaffId);
    if (res) {
      setIsAssignModalOpen(false);
      setAssignEnquiryId('');
      setAssignStaffId('');
      refreshEnquiries();
    }
  };

  // Action: Book Member into Class
  const handleClassBooking = async () => {
    if (!bookingMemberId || !selectedSession) return;
    const res = await staffBookSession(selectedSession._id, bookingMemberId);
    if (res.success) {
      setIsClassBookingOpen(false);
      setBookingMemberId('');
      setSelectedSession(null);
      fetchUpcomingSessions(undefined, 30);
    }
  };

  // Action: Schedule Appointment
  const handleScheduleAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptForm.title || !apptForm.scheduledDate || !apptForm.scheduledTime) {
      addToast('Please fill in required fields.', 'warning');
      return;
    }

    const payload = {
      title: apptForm.title,
      description: apptForm.description,
      scheduledDate: apptForm.scheduledDate,
      scheduledTime: apptForm.scheduledTime,
      type: apptForm.type,
      assignedTo: apptForm.assignedStaff ? [apptForm.assignedStaff] : [],
      relatedMember: apptForm.relatedMember || undefined,
      isEditable: true
    };

    const res = await createScheduleEvent(payload);
    if (res.success) {
      setIsApptModalOpen(false);
      setApptForm({
        title: '',
        description: '',
        type: 'member-session',
        scheduledDate: '',
        scheduledTime: '',
        assignedStaff: '',
        relatedMember: '',
      });
      fetchUpcomingFollowUps();
    }
  };

  // Action: Send Notification
  const handleSendNotification = async (clientId: string) => {
    const success = await notifyRenewal(clientId);
    if (success) {
      refreshClients();
    }
  };

  // Action: Forward to Sales Representative
  const handleForwardRenewal = async () => {
    if (!forwardStaffId) return;
    const success = await forwardRenewal(forwardClientId, forwardStaffId, forwardNote);
    if (success) {
      setIsForwardModalOpen(false);
      setForwardClientId('');
      setForwardStaffId('');
      setForwardNote('');
      refreshClients();
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-650 dark:text-gray-400">Welcome back, receptionist</p>
        </div>

        {/* Top Cards Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1: Today's Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Status</p>
                  <p className={`text-xl font-bold mt-1 ${myAttendance?.status === 'present' ? 'text-green-600' : 'text-gray-500'}`}>
                    {myAttendance ? (
                      <span className="capitalize">{myAttendance.status}</span>
                    ) : (
                      "Not Checked In"
                    )}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${myAttendance?.status === 'present' ? 'bg-green-100 text-green-600' : 'bg-gray-400 text-white dark:bg-gray-650'}`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: My Members */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Members</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {clients.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-105 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Pending Tasks */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {filteredUpcomingFollowUps.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: This Month */}
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
        </div>

        {/* Bottom Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Main (Tasks and Quick Actions) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Upcoming Tasks / Follow-ups
                </h2>
              </CardHeader>
              <CardContent>
                {filteredUpcomingFollowUps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pending tasks. Good job!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUpcomingFollowUps.slice(0, 5).map(task => (
                      <div key={task._id} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{task.relatedName}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {task.type} - {new Date(task.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {task.note && <p className="text-xs text-gray-450 mt-1 line-clamp-1">{task.note}</p>}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
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
                  
                  {/* Log Task Link */}
                  <Link to="/staff/follow-ups" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-800 hover:border-orange-500 hover:bg-orange-50/50 transition text-center">
                    <Clock className="w-6 h-6 text-purple-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Log Task</span>
                  </Link>

                  {/* Sales Leads Link */}
                  <Link to="/staff/enquiries" className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-800 hover:border-orange-500 hover:bg-orange-50/50 transition text-center">
                    <TrendingUp className="w-6 h-6 text-pink-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sales Leads</span>
                  </Link>

                  {/* Check-In/Out Member Modal Button */}
                  <button onClick={() => {
                    setSelectedClient(null);
                    setSearchTerm('');
                    setIsCheckInModalOpen(true);
                  }} className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-850 hover:border-orange-500 hover:bg-orange-50/30 transition text-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Check In/Out</span>
                  </button>

                  {/* Book Gym Class Modal Button */}
                  <button onClick={() => setIsClassListModalOpen(true)} className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-850 hover:border-orange-500 hover:bg-orange-50/30 transition text-center">
                    <Calendar className="w-6 h-6 text-orange-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Book Class</span>
                  </button>

                  {/* PT Consultation Booking Modal Button */}
                  <button onClick={() => setIsApptModalOpen(true)} className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-850 hover:border-orange-500 hover:bg-orange-50/30 transition text-center">
                    <Clock className="w-6 h-6 text-blue-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Book Appt.</span>
                  </button>

                  {/* Renewal Alerts Modal Button */}
                  <button onClick={() => setIsRenewalModalOpen(true)} className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-850 hover:border-orange-500 hover:bg-orange-50/30 transition text-center">
                    <Bell className="w-6 h-6 text-yellow-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Renewal Alerts</span>
                  </button>

                  {/* View Members Directory Modal Button */}
                  <button onClick={() => setIsMembersModalOpen(true)} className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-850 hover:border-orange-500 hover:bg-orange-50/30 transition text-center">
                    <Users className="w-6 h-6 text-indigo-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Members Dir.</span>
                  </button>

                  {/* Quick Enquiry Modal Button */}
                  <button onClick={() => setIsEnquiryModalOpen(true)} className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg dark:hover:bg-gray-850 hover:border-orange-500 hover:bg-orange-50/30 transition text-center">
                    <Plus className="w-6 h-6 text-teal-500 mb-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Log Enquiry</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Announcements and Recent Members) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Announcements */}
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

            {/* Recent Members */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Members</h2>
              </CardHeader>
              <CardContent>
                {clients.length > 0 ? (
                  <ul className="space-y-3">
                    {clients.slice(0, 4).map(member => (
                      <li key={member._id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
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
                  <p className="text-sm text-gray-550">No members assigned.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* ============================= MODALS ================================== */}
      {/* ======================================================================= */}

      {/* 1. Member Check-In/Out Modal */}
      <Modal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        title="Member Entry & Exit Check-in"
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Entry Search */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Verify Entry / Exit</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search member manually..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedClient(null);
                    }}
                    className="pl-10 text-xs"
                  />
                </div>

                {filteredClients.length > 0 && !selectedClient && (
                  <div className="border border-gray-200 dark:border-gray-700/80 rounded-xl max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 shadow-sm bg-white dark:bg-gray-850">
                    {filteredClients.map(client => (
                      <button
                        key={client._id}
                        onClick={() => setSelectedClient(client)}
                        className="w-full text-left p-2.5 hover:bg-orange-50/50 dark:hover:bg-orange-950/10 flex items-center justify-between transition"
                      >
                        <div>
                          <p className="font-semibold text-xs text-gray-900 dark:text-white">{client.fullName}</p>
                          <p className="text-[10px] text-gray-500">{client.contactNumber} • {client.plan} plan</p>
                        </div>
                        <Badge className={client.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'}>
                          {client.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {selectedClient && (
                  <div className="p-3 bg-orange-50/30 dark:bg-orange-950/10 rounded-xl border border-orange-200/50 space-y-3 shadow-inner text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedClient.fullName}</p>
                        <p className="text-[10px] text-gray-500">{selectedClient.email}</p>
                        <p className="text-[10px] text-gray-500">{selectedClient.contactNumber}</p>
                      </div>
                      <Badge className={selectedClient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedClient.status}
                      </Badge>
                    </div>

                    <div className="text-[10px] space-y-1 pt-2 border-t border-orange-200/30 text-gray-700 dark:text-gray-300">
                      <p><span className="font-semibold">Expiry Date:</span> {new Date(selectedClient.endDate).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Assigned Trainer:</span> {selectedClient.trainer?.fullName || 'None'}</p>
                      <p><span className="font-semibold">Emergency Contact:</span> {selectedClient.emergencyContactName || 'None'} ({selectedClient.emergencyContactNumber || 'None'})</p>
                    </div>

                    <div className="pt-1">
                      <Input
                        type="text"
                        placeholder="Optional entry note..."
                        value={attendanceNote}
                        onChange={(e) => setAttendanceNote(e.target.value)}
                        className="text-[10px] py-1"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleMarkAttendance(selectedClient._id, 'check-in')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-[10px] py-1.5 shadow-md"
                        disabled={selectedClient.status !== 'active'}
                      >
                        Check In
                      </Button>
                      <Button
                        onClick={() => handleMarkAttendance(selectedClient._id, 'check-out')}
                        variant="outline"
                        className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-semibold text-[10px] py-1.5 shadow-sm"
                      >
                        Check Out
                      </Button>
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>
          </div>

          {/* Right Column: Check-in Logs Table */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex justify-between items-center py-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Check-in Log (Today)</h3>
              </CardHeader>
              <CardContent className="p-2">
                {todayAttendance.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 space-y-1.5">
                    <ClipboardList className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-semibold">No entries recorded today yet.</p>
                    <p className="text-[10px] text-gray-400">Search members on the left to check them in.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-150 dark:border-gray-800 rounded-xl shadow-inner max-h-[350px]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-850">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                        {todayAttendance.map((row) => (
                          <tr key={row._id} className="hover:bg-gray-50/50 transition">
                            <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{row.clientName}</td>
                            <td className="px-3 py-2 text-[10px] text-gray-600 dark:text-gray-300">
                              {row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
                            </td>
                            <td className="px-3 py-2 text-[10px] text-gray-600 dark:text-gray-300">
                              {row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
                            </td>
                            <td className="px-3 py-2 text-[10px] text-gray-600 dark:text-gray-300">
                              {row.duration !== null && row.duration !== undefined ? `${row.duration} mins` : '--'}
                            </td>
                            <td className="px-3 py-2">
                              <Badge className={row.checkOutTime ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                {row.checkOutTime ? 'Completed' : 'Inside'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </Modal>

      {/* 2. Today's Class List Modal */}
      <Modal
        isOpen={isClassListModalOpen}
        onClose={() => setIsClassListModalOpen(false)}
        title="Today's Gym Class Sessions"
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session: any) => {
            const avail = getSessionAvailability(session);
            return (
              <Card key={session._id} className="border border-gray-150 dark:border-gray-800 shadow-sm relative hover:shadow transition">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-sm px-2 py-0.5 text-[10px]">
                        {session.classId?.name || 'Class'}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-800 border border-gray-200 text-[10px]">
                        {session.time} - {session.endTime}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-500">Date: {new Date(session.date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-600 flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-800/80">
                      <User size={12} className="text-gray-400" />
                      Trainer: {session.trainerId?.fullName || 'Not assigned'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-medium">
                      <span className="text-gray-600 dark:text-gray-400">Availability</span>
                      <span className="text-gray-900 dark:text-white font-bold">{avail.booked} / {avail.capacity} slots</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, avail.percent)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] text-gray-500 font-semibold">{avail.available} slots left</span>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedSession(session);
                      setIsClassListModalOpen(false);
                      setIsClassBookingOpen(true);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md font-semibold text-[10px] py-1.5"
                    disabled={avail.available <= 0}
                  >
                    Select Member to Book
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Modal>

      {/* 3. Class Booking Confirmation Modal */}
      <Modal
        isOpen={isClassBookingOpen}
        onClose={() => {
          setIsClassBookingOpen(false);
          setIsClassListModalOpen(true); // fall back to class list
        }}
        title={`Book Class: ${selectedSession?.classId?.name || 'Session'}`}
      >
        <div className="space-y-4">
          <div className="bg-orange-50/50 dark:bg-orange-950/10 p-3 rounded-xl border border-orange-200/40 text-xs space-y-1.5">
            <p><span className="font-bold text-gray-600">Time:</span> {selectedSession?.time} - {selectedSession?.endTime}</p>
            <p><span className="font-bold text-gray-600">Trainer:</span> {selectedSession?.trainerId?.fullName || 'Not assigned'}</p>
            <p><span className="font-bold text-gray-600">Remaining Slots:</span> {selectedSession ? getSessionAvailability(selectedSession).available : 0}</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Choose Member to Book *</label>
            <Select
              value={bookingMemberId}
              onChange={(value) => setBookingMemberId(value)}
              options={[
                { value: '', label: 'Select Active Gym Member' },
                ...clients.filter(c => c.status === 'active').map(c => ({ value: c._id, label: `${c.fullName} (${c.contactNumber})` }))
              ]}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => {
              setIsClassBookingOpen(false);
              setIsClassListModalOpen(true);
            }}>Back</Button>
            <Button onClick={handleClassBooking} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs shadow-md" disabled={!bookingMemberId}>
              Confirm Booking
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Renewal Alerts Modal */}
      <Modal
        isOpen={isRenewalModalOpen}
        onClose={() => setIsRenewalModalOpen(false)}
        title="Membership Renewal Alerts & Actions"
        size="lg"
      >
        <div className="space-y-6">
          {/* Today's Expirations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-red-650 flex items-center gap-1">
              <AlertTriangle size={14} /> Expired / Expiring Today ({renewals.today.length})
            </h4>
            {renewals.today.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">No member profiles expiring today.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900">
                {renewals.today.map(client => (
                  <div key={client._id} className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-white">{client.fullName}</p>
                      <p className="text-[10px] text-gray-500">Expired: {new Date(client.endDate).toLocaleDateString()} · {client.contactNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSendNotification(client._id)} size="sm" className="bg-orange-500 text-white text-[10px] py-1 px-2 flex items-center gap-1 font-semibold">
                        <Send size={10} /> Notify
                      </Button>
                      <Button onClick={() => { setForwardClientId(client._id); setIsForwardModalOpen(true); }} variant="outline" size="sm" className="border-orange-500 text-orange-600 text-[10px] py-1 px-2 font-semibold">
                        Forward Sales
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiring in 3 Days */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <Clock size={14} /> Expiring within 3 Days ({renewals.threeDays.length})
            </h4>
            {renewals.threeDays.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">No profiles expiring within 3 days.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900">
                {renewals.threeDays.map(client => (
                  <div key={client._id} className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-white">{client.fullName}</p>
                      <p className="text-[10px] text-gray-500">Expires: {new Date(client.endDate).toLocaleDateString()} · {client.contactNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSendNotification(client._id)} size="sm" className="bg-orange-500 text-white text-[10px] py-1 px-2 flex items-center gap-1 font-semibold">
                        <Send size={10} /> Notify
                      </Button>
                      <Button onClick={() => { setForwardClientId(client._id); setIsForwardModalOpen(true); }} variant="outline" size="sm" className="border-orange-500 text-orange-600 text-[10px] py-1 px-2 font-semibold">
                        Forward Sales
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expiring in 7 Days */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <Bell size={14} /> Expiring within 7 Days ({renewals.sevenDays.length})
            </h4>
            {renewals.sevenDays.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">No profiles expiring within 7 days.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900">
                {renewals.sevenDays.map(client => (
                  <div key={client._id} className="p-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-xs text-gray-900 dark:text-white">{client.fullName}</p>
                      <p className="text-[10px] text-gray-500">Expires: {new Date(client.endDate).toLocaleDateString()} · {client.contactNumber}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleSendNotification(client._id)} size="sm" className="bg-orange-500 text-white text-[10px] py-1 px-2 flex items-center gap-1 font-semibold">
                        <Send size={10} /> Notify
                      </Button>
                      <Button onClick={() => { setForwardClientId(client._id); setIsForwardModalOpen(true); }} variant="outline" size="sm" className="border-orange-500 text-orange-600 text-[10px] py-1 px-2 font-semibold">
                        Forward Sales
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 5. View-Only Members Directory Modal */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title="Gym Members Directory"
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <p className="text-xs text-gray-500">Directory is view-only. Modifications are restricted to gym managers.</p>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <Input
                type="text"
                placeholder="Search by name/phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 py-1 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
            {clients
              .filter(c => !searchTerm || c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || c.contactNumber.includes(searchTerm))
              .map(client => (
                <Card key={client._id} className="border border-gray-150 dark:border-gray-800 shadow-sm relative hover:shadow transition">
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {client.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">{client.fullName}</h4>
                          <span className="text-[9px] text-gray-450">{client.plan} plan</span>
                        </div>
                      </div>
                      <Badge className={client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {client.status}
                      </Badge>
                    </div>

                    <div className="text-[10px] space-y-1 text-gray-750 dark:text-gray-300">
                      <p className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" /> {client.contactNumber}</p>
                      <p className="flex items-center gap-1.5"><Mail size={11} className="text-gray-400" /> {client.email}</p>
                      <p className="flex items-center gap-1.5"><Calendar size={11} className="text-gray-400" /> Expires: {new Date(client.endDate).toLocaleDateString()}</p>
                      <p className="flex items-center gap-1.5"><User size={11} className="text-gray-400" /> Trainer: {client.trainer?.fullName || 'None'}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-850 p-2 rounded-lg text-[10px] border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-400">Emergency Contact</p>
                      <p className="text-gray-900 dark:text-white font-medium">{client.emergencyContactName || 'N/A'}</p>
                      <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone size={9} /> {client.emergencyContactNumber || 'N/A'} {client.emergencyContactRelation ? ` (${client.emergencyContactRelation})` : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </Modal>

      {/* 6. Quick Enquiry Modal (Record Lead) */}
      <Modal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        title="Record Walk-in Lead Enquiry"
      >
        <form onSubmit={handleCreateEnquiry} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Full Name *</label>
              <Input
                type="text"
                required
                value={enquiryForm.name}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                className="text-xs"
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Contact Number *</label>
              <Input
                type="tel"
                required
                value={enquiryForm.phone}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                className="text-xs"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Email Address</label>
              <Input
                type="email"
                value={enquiryForm.email}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                className="text-xs"
                placeholder="e.g. john@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Lead Source</label>
              <Select
                value={enquiryForm.source}
                onChange={(value) => setEnquiryForm({ ...enquiryForm, source: value })}
                options={[
                  { value: 'walk-in', label: 'Walk-in lead' },
                  { value: 'call', label: 'Phone Inquiry' },
                  { value: 'website', label: 'Website / Online' },
                  { value: 'social', label: 'Social Media' }
                ]}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Interests / Program</label>
              <Input
                type="text"
                value={enquiryForm.interests}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, interests: e.target.value })}
                className="text-xs"
                placeholder="e.g. Yoga, Strength"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Budget / Notes</label>
              <Input
                type="text"
                value={enquiryForm.budget}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, budget: e.target.value })}
                className="text-xs"
                placeholder="e.g. 5000/month"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Assign Sales Executive</label>
              <Select
                value={enquiryForm.assignedStaff}
                onChange={(value) => setEnquiryForm({ ...enquiryForm, assignedStaff: value })}
                options={[
                  { value: '', label: 'Select Staff Member' },
                  ...salesStaff.map(s => ({ value: s._id, label: `${s.fullName} (Sales)` }))
                ]}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-750">Next Follow-Up Date</label>
              <Input
                type="date"
                value={enquiryForm.followUpDate}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, followUpDate: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-750">Comments / Notes</label>
            <textarea
              rows={3}
              value={enquiryForm.comments}
              onChange={(e) => setEnquiryForm({ ...enquiryForm, comments: e.target.value })}
              className="w-full text-xs border border-gray-300 dark:border-gray-700/80 rounded-xl p-2.5 bg-transparent"
              placeholder="Record walk-in lead context details..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsEnquiryModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs shadow-md">Record Lead</Button>
          </div>
        </form>
      </Modal>

      {/* 7. Assign Sales Lead Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Enquiry to Sales Staff"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Choose Sales Representative</label>
            <Select
              value={assignStaffId}
              onChange={(value) => setAssignStaffId(value)}
              options={[
                { value: '', label: 'Select Sales Executive' },
                ...salesStaff.map(s => ({ value: s._id, label: s.fullName }))
              ]}
              className="text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignLead} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs shadow-md" disabled={!assignStaffId}>
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. PT/Appointment Booking Modal */}
      <Modal
        isOpen={isApptModalOpen}
        onClose={() => setIsApptModalOpen(false)}
        title="Schedule Consultation / Appointment"
      >
        <form onSubmit={handleScheduleAppt} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Appointment Title *</label>
            <Input
              type="text"
              required
              value={apptForm.title}
              onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })}
              className="text-xs"
              placeholder="e.g. PT Assessment Slot"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-750">Booking Type *</label>
              <Select
                value={apptForm.type}
                onChange={(value) => setApptForm({ ...apptForm, type: value })}
                options={[
                  { value: 'member-session', label: 'Trainer Assessment / Consultation' },
                  { value: 'task', label: 'Gym Walk-in Tour' }
                ]}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-750">Related Gym Member</label>
              <Select
                value={apptForm.relatedMember}
                onChange={(value) => setApptForm({ ...apptForm, relatedMember: value })}
                options={[
                  { value: '', label: 'No Member (General Guest)' },
                  ...clients.map(c => ({ value: c._id, label: `${c.fullName} (${c.contactNumber})` }))
                ]}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-750">Appointment Date *</label>
              <Input
                type="date"
                required
                value={apptForm.scheduledDate}
                onChange={(e) => setApptForm({ ...apptForm, scheduledDate: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-750">Time *</label>
              <Input
                type="time"
                required
                value={apptForm.scheduledTime}
                onChange={(e) => setApptForm({ ...apptForm, scheduledTime: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Assign Trainer / Staff Representative</label>
            <Select
              value={apptForm.assignedStaff}
              onChange={(value) => setApptForm({ ...apptForm, assignedStaff: value })}
              options={[
                { value: '', label: 'Select Trainer / Staff Member' },
                ...trainers.map(t => ({ value: t._id, label: `${t.fullName} (Trainer)` })),
                ...salesStaff.map(s => ({ value: s._id, label: `${s.fullName} (Sales Representative)` }))
              ]}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Description</label>
            <textarea
              rows={3}
              value={apptForm.description}
              onChange={(e) => setApptForm({ ...apptForm, description: e.target.value })}
              className="w-full text-xs border border-gray-300 dark:border-gray-700/80 rounded-xl p-2.5 bg-transparent"
              placeholder="e.g. Schedule gym tour details..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsApptModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs shadow-md">Book Slot</Button>
          </div>
        </form>
      </Modal>

      {/* 9. Forward Renewal Modal */}
      <Modal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        title="Forward Renewal Task to Sales Staff"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Choose Sales Executive *</label>
            <Select
              value={forwardStaffId}
              onChange={(value) => setForwardStaffId(value)}
              options={[
                { value: '', label: 'Select Sales Member' },
                ...salesStaff.map(s => ({ value: s._id, label: s.fullName }))
              ]}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-750">Forwarding Note / Instruction</label>
            <textarea
              rows={3}
              value={forwardNote}
              onChange={(e) => setForwardNote(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-700/80 rounded-xl p-2.5 bg-transparent"
              placeholder="e.g. Follow up on basic plan renewal..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsForwardModalOpen(false)}>Cancel</Button>
            <Button onClick={handleForwardRenewal} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-xs shadow-md" disabled={!forwardStaffId}>
              Forward Lead
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default ReceptionistDashboard;
