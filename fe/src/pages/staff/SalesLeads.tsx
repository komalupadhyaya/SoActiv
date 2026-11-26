import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Phone,
    Mail,
    Edit2,
    TrendingUp,
    User,
    Clock,
    Plus,
    SlidersHorizontal,
    Filter,
    Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useEnquiry, IEnquiry } from '../../hooks/useEnquiry';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

// Status colors
const statusColors = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    interested: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusOptions = ['new', 'contacted', 'interested', 'converted', 'lost'];

export const SalesLeads: React.FC = () => {
    // Hooks
    const { myEnquiries, loading, updateEnquiry, deleteEnquiry } = useEnquiry();
    const { staff, fetchAllStaff } = useStaff();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

    useEffect(() => {
        fetchAllStaff();
    }, [fetchAllStaff]);

    const { addToast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetId = searchParams.get('id');
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedCommunicate, setSelectedCommunicate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Filter popup form states matching image 1
    const [filterService, setFilterService] = useState('');
    const [filterLeadSource, setFilterLeadSource] = useState('');
    const [filterEnquiryStage, setFilterEnquiryStage] = useState('');
    const [filterEnquiryType, setFilterEnquiryType] = useState('');
    const [filterCustomerType, setFilterCustomerType] = useState('');
    const [filterLeads, setFilterLeads] = useState(false);
    const [filterMembers, setFilterMembers] = useState(false);

    const [filterStaff, setFilterStaff] = useState('');
    const [filterMale, setFilterMale] = useState(false);
    const [filterFemale, setFilterFemale] = useState(false);
    const [filterFitnessGoal, setFilterFitnessGoal] = useState('');
    const [filterMissedCall, setFilterMissedCall] = useState(false);
    const [filterCold, setFilterCold] = useState(false);
    const [filterHot, setFilterHot] = useState(false);
    const [filterWarm, setFilterWarm] = useState(false);
    const [filterLastCallStatus, setFilterLastCallStatus] = useState('');

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<IEnquiry | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Adjust search query if a specific lead ID is requested
    useEffect(() => {
        if (targetId && myEnquiries.length > 0) {
            const targetLead = myEnquiries.find(l => l._id === targetId);
            if (targetLead) {
                const matchesSearch =
                    targetLead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    targetLead.phone.includes(searchQuery) ||
                    (targetLead.email && targetLead.email.toLowerCase().includes(searchQuery.toLowerCase()));
                if (!matchesSearch) {
                    setSearchQuery('');
                }
            }
        }
    }, [targetId, myEnquiries, searchQuery]);

    // Handle scroll and highlight for target lead
    useEffect(() => {
        if (!loading && targetId && myEnquiries.some(l => l._id === targetId)) {
            setHighlightedId(targetId);

            const timer = setTimeout(() => {
                const element = document.getElementById(`lead-${targetId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 250);

            const clearTimer = setTimeout(() => {
                setHighlightedId(null);
            }, 5000);

            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
    }, [loading, targetId, myEnquiries]);

    // Edit Form State
    const [editStatus, setEditStatus] = useState<string>('');
    const [editComments, setEditComments] = useState<string>('');

    const serviceOptions = useMemo(() => {
        const defaultServices = [
            'CLUB MEMBERSHIP',
            'Gym Membership',
            'Diet',
            'Freezing',
            'Group Workout',
            'happy hours',
            'Personal Session',
            'Transfer Fee',
        ];
        const sSet = new Set<string>(defaultServices);
        myEnquiries.forEach((e) => {
            if (e.serviceName) sSet.add(e.serviceName);
        });
        return Array.from(sSet);
    }, [myEnquiries]);

    const staffOptions = useMemo(() => {
        const staffSet = new Set<string>();
        staff.forEach((s) => {
            const name = s.fullName || (s as any).name;
            if (name) {
                staffSet.add(name);
            }
        });
        return [
            { value: '', label: 'All' },
            ...Array.from(staffSet).map((name) => ({ value: name, label: name })),
        ];
    }, [staff]);

    // Filter Logic
    const filteredLeads = useMemo(() => {
        return myEnquiries.filter(lead => {
            const matchesSearch =
                !searchQuery ||
                lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.phone.includes(searchQuery) ||
                (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesStage = true;
            if (filterEnquiryStage) {
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const trialDateStr = lead.trialDateTime || (lead as any).trialClassDate || (lead as any).trialSessionDate;
                const hasTrial = lead.trialType && lead.trialType !== 'no-trial';
                const isTrialPast = hasTrial && trialDateStr && new Date(trialDateStr) < todayStart;

                if (filterEnquiryStage === 'Enquiry') {
                    matchesStage = !hasTrial && lead.status !== 'converted' && lead.status !== 'lost';
                } else if (filterEnquiryStage === 'Trial Scheduled') {
                    matchesStage = hasTrial && !isTrialPast && lead.status !== 'converted' && lead.status !== 'lost';
                } else if (filterEnquiryStage === 'Post Trial') {
                    matchesStage = hasTrial && isTrialPast && lead.status !== 'converted' && lead.status !== 'lost';
                } else if (filterEnquiryStage === 'Sale') {
                    matchesStage = lead.status === 'converted';
                } else {
                    matchesStage = lead.status === filterEnquiryStage;
                }
            }
            const matchesService = !filterService || lead.serviceName?.toLowerCase() === filterService.toLowerCase();
            const matchesSource = !filterLeadSource || (lead as any).leadSource?.toLowerCase() === filterLeadSource.toLowerCase() || lead.source?.toLowerCase() === filterLeadSource.toLowerCase();
            const matchesType = !filterEnquiryType || (lead as any).enquiryType?.toLowerCase() === filterEnquiryType.toLowerCase();

            const matchesGender =
                (!filterMale && !filterFemale) ||
                (filterMale && (lead as any).gender === 'male') ||
                (filterFemale && (lead as any).gender === 'female');

            const matchesCallTag =
                (!filterCold && !filterHot && !filterWarm) ||
                (filterCold && (lead as any).callTag === 'cold') ||
                (filterHot && (lead as any).callTag === 'hot') ||
                (filterWarm && (lead as any).callTag === 'warm');

            const matchesMemberLead =
                (!filterLeads && !filterMembers) ||
                (filterLeads && lead.status !== 'converted') ||
                (filterMembers && lead.status === 'converted');

            return matchesSearch && matchesStage && matchesService && matchesSource && matchesType && matchesGender && matchesCallTag && matchesMemberLead;
        });
    }, [
        myEnquiries,
        searchQuery,
        filterService,
        filterLeadSource,
        filterEnquiryStage,
        filterEnquiryType,
        filterMale,
        filterFemale,
        filterCold,
        filterHot,
        filterWarm,
        filterLeads,
        filterMembers,
    ]);

    const handleResetFilters = () => {
        setFilterService('');
        setFilterLeadSource('');
        setFilterEnquiryStage('');
        setFilterEnquiryType('');
        setFilterCustomerType('');
        setFilterLeads(false);
        setFilterMembers(false);
        setFilterStaff('');
        setFilterMale(false);
        setFilterFemale(false);
        setFilterFitnessGoal('');
        setFilterMissedCall(false);
        setFilterCold(false);
        setFilterHot(false);
        setFilterWarm(false);
        setFilterLastCallStatus('');
        setSearchQuery('');
    };

    const enquiryStats = useMemo(() => {
        const total = myEnquiries.length;
        const openEnquiriesList = myEnquiries.filter(
            (e) => e.status !== 'converted' && e.status !== 'lost'
        );
        const open = openEnquiriesList.length;
        const converted = myEnquiries.filter((e) => e.status === 'converted').length;
        const lost = myEnquiries.filter((e) => e.status === 'lost').length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const isTrialDatePast = (e: any) => {
            const trialDateStr = e.trialDateTime || e.trialClassDate || e.trialSessionDate;
            if (!trialDateStr) return false;
            return new Date(trialDateStr) < todayStart;
        };

        // Open Enquiries Breakdown
        const openEnquiry = openEnquiriesList.filter(
            (e) => !e.trialType || e.trialType === 'no-trial'
        ).length;

        const openTrialScheduled = openEnquiriesList.filter(
            (e) => e.trialType && e.trialType !== 'no-trial' && !isTrialDatePast(e)
        ).length;

        const openPostTrial = openEnquiriesList.filter(
            (e) => e.trialType && e.trialType !== 'no-trial' && isTrialDatePast(e)
        ).length;

        const openSalesStage = openEnquiriesList.filter(
            (e) => e.status === 'contacted' || e.status === 'interested'
        ).length;

        // Trial Status Breakdown
        const trialScheduled = myEnquiries.filter(
            (e) => e.trialType && e.trialType !== 'no-trial'
        ).length;

        const trialCompleted = myEnquiries.filter(
            (e) => e.trialType && e.trialType !== 'no-trial' && isTrialDatePast(e)
        ).length;

        const trialConverted = myEnquiries.filter(
            (e) => e.trialType && e.trialType !== 'no-trial' && e.status === 'converted'
        ).length;

        return {
            total,
            open,
            converted,
            lost,
            openEnquiry,
            openTrialScheduled,
            openPostTrial,
            openSalesStage,
            trialScheduled,
            trialCompleted,
            trialConverted,
        };
    }, [myEnquiries]);

    // Handlers
    const handleOpenEdit = (lead: IEnquiry) => {
        setSelectedLead(lead);
        setEditStatus(lead.status);
        setEditComments(lead.comments || '');
        setIsEditModalOpen(true);
    };

    const handleSaveUpdate = async () => {
        if (!selectedLead) return;

        try {
            await updateEnquiry(selectedLead._id, {
                status: editStatus as any,
                comments: editComments
            });
            setIsEditModalOpen(false);
            addToast('Lead updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update lead', 'error');
        }
    };

    const handleDeleteLead = async (id: string, name?: string) => {
        if (await confirm(`Are you sure you want to delete lead "${name || 'this lead'}"?`, {
            title: 'Delete Lead',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        })) {
            await deleteEnquiry(id);
        }
    };

    if (loading && myEnquiries.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <TrendingUp className="mr-2 text-orange-500" />
                        {user?.position === 'receptionist' || user?.position === 'manager'
                            ? 'Sales Enquiries & Leads'
                            : 'My Sales Leads'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {user?.position === 'receptionist' || user?.position === 'manager'
                            ? 'Track, manage, and register new customer enquiries'
                            : 'Track and manage your assigned enquiries'}
                    </p>
                </div>
                {(user?.position === 'receptionist' || user?.position === 'manager') && (
                    <Button
                        variant="primary"
                        onClick={() => navigate('/staff/enquiries/new')}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none shadow-md"
                    >
                        <Plus size={16} />
                        Add Walk-In Lead
                    </Button>
                )}
            </div>

            {/* Enquiry Stats Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Enquiries - Total */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-3">
                        Enquiries - {enquiryStats.total}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Open
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {enquiryStats.open}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Converted
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {enquiryStats.converted}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Archived/Lost
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {enquiryStats.lost}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Open Enquiries */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-3">
                        Open Enquiries
                    </h3>
                    <div className="grid grid-cols-4 gap-1 text-center">
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Enquiry
                            </div>
                            <div className="text-base sm:text-lg font-bold text-green-500">
                                {enquiryStats.openEnquiry}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Trial Scheduled
                            </div>
                            <div className="text-base sm:text-lg font-bold text-amber-500">
                                {enquiryStats.openTrialScheduled}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Post Trial
                            </div>
                            <div className="text-base sm:text-lg font-bold text-red-500">
                                {enquiryStats.openPostTrial}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Sales Stage
                            </div>
                            <div className="text-base sm:text-lg font-bold text-red-500">
                                {enquiryStats.openSalesStage}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Trial Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-3">
                        Trial Status
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Trial Scheduled
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {enquiryStats.trialScheduled}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Trial Completed
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {enquiryStats.trialCompleted}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] sm:text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1.5 leading-tight h-8 flex items-center justify-center text-center px-0.5">
                                Converted
                            </div>
                            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {enquiryStats.trialConverted}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action / Communicate Bar matching image 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 w-full">
                <div className="flex flex-wrap items-center">
                    {/* Sliders/Filter Button */}
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        title="Toggle Filters"
                        className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                            showFilters
                                ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                        <SlidersHorizontal size={16} />
                    </button>

                    {/* Action Dropdown */}
                    <div className="flex items-center space-x-3 ml-8 sm:ml-16">
                        <span className="text-sm font-normal text-gray-800 dark:text-gray-200">
                            Action
                        </span>
                        <select
                            value={selectedAction}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedAction(val);
                                if (val) {
                                    addToast(`Selected action: ${val}`, 'info');
                                }
                            }}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 min-w-[90px] cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Move to Archive">Move to Archive</option>
                            <option value="Staff Change">Staff Change</option>
                            <option value="Print">Print</option>
                        </select>
                    </div>

                    {/* Communicate Dropdown */}
                    <div className="flex items-center space-x-3 ml-8 sm:ml-20">
                        <span className="text-sm font-normal text-gray-800 dark:text-gray-200">
                            Communicate
                        </span>
                        <select
                            value={selectedCommunicate}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedCommunicate(val);
                                if (val) {
                                    addToast(`Selected communicate: ${val}`, 'info');
                                }
                            }}
                            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 min-w-[90px] cursor-pointer"
                        >
                            <option value="">Select</option>
                            <option value="Send E-mail">Send E-mail</option>
                            <option value="Send SMS">Send SMS</option>
                        </select>
                    </div>
                </div>

                {/* Filter Popup Panel matching image 1 */}
                {showFilters && (
                    <div className="mt-3 pt-6 pb-5 px-6 border-2 border-orange-400 dark:border-orange-500 rounded-lg bg-white dark:bg-gray-800 shadow-sm w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* Service */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Service
                                    </label>
                                    <select
                                        value={filterService}
                                        onChange={(e) => setFilterService(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        {serviceOptions.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Lead Source */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Lead Source
                                    </label>
                                    <select
                                        value={filterLeadSource}
                                        onChange={(e) => setFilterLeadSource(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        <option value="Aktivity">Aktivity</option>
                                        <option value="Corporate">Corporate</option>
                                        <option value="e-mail">e-mail</option>
                                        <option value="Facebook">Facebook</option>
                                        <option value="Flyers/Banners">Flyers/Banners</option>
                                        <option value="Google">Google</option>
                                        <option value="Hoardings">Hoardings</option>
                                        <option value="Justdial">Justdial</option>
                                        <option value="Listing sites">Listing sites</option>
                                        <option value="Magazine">Magazine</option>
                                        <option value="Member App">Member App</option>
                                        <option value="Missed call app">Missed call app</option>
                                        <option value="Newspapers">Newspapers</option>
                                        <option value="Others">Others</option>
                                        <option value="Passing By">Passing By</option>
                                        <option value="Phone">Phone</option>
                                        <option value="Posters">Posters</option>
                                        <option value="Promotional consultant">Promotional consultant</option>
                                        <option value="Radio">Radio</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Signboard">Signboard</option>
                                        <option value="SMS">SMS</option>
                                        <option value="Social media">Social media</option>
                                        <option value="Staff">Staff</option>
                                        <option value="TV">TV</option>
                                        <option value="Walk-in">Walk-in</option>
                                        <option value="Website">Website</option>
                                        <option value="Word of mouth">Word of mouth</option>
                                        <option value="SoActiv">SoActiv</option>
                                    </select>
                                </div>

                                {/* Enquiry Stage */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Enquiry Stage
                                    </label>
                                    <select
                                        value={filterEnquiryStage}
                                        onChange={(e) => setFilterEnquiryStage(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        <option value="Enquiry">Enquiry</option>
                                        <option value="Trial Scheduled">Trial Scheduled</option>
                                        <option value="Post Trial">Post Trial</option>
                                        <option value="Sale">Sale</option>
                                    </select>
                                </div>

                                {/* Enquiry Type */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Enquiry Type
                                    </label>
                                    <select
                                        value={filterEnquiryType}
                                        onChange={(e) => setFilterEnquiryType(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        <option value="Walk-in">Walk-in</option>
                                        <option value="Phone">Phone</option>
                                        <option value="e-mail">e-mail</option>
                                        <option value="Social media">Social media</option>
                                        <option value="Website">Website</option>
                                    </select>
                                </div>

                                {/* Customer Type */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Customer Type
                                    </label>
                                    <select
                                        value={filterCustomerType}
                                        onChange={(e) => setFilterCustomerType(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        <option value="Self">Self</option>
                                        <option value="Group">Group</option>
                                        <option value="Couple">Couple</option>
                                        <option value="Youth">Youth</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                </div>

                                {/* Members/leads */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Members/leads
                                    </label>
                                    <div className="flex items-center gap-6 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterLeads}
                                                onChange={(e) => setFilterLeads(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Leads
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterMembers}
                                                onChange={(e) => setFilterMembers(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Members
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* Staff */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Staff
                                    </label>
                                    <select
                                        value={filterStaff}
                                        onChange={(e) => setFilterStaff(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        {staffOptions.slice(1).map((s) => (
                                            <option key={s.value} value={s.value}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Gender */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Gender
                                    </label>
                                    <div className="flex items-center gap-6 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterMale}
                                                onChange={(e) => setFilterMale(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Male
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterFemale}
                                                onChange={(e) => setFilterFemale(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Female
                                        </label>
                                    </div>
                                </div>

                                {/* Fitness Goal */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Fitness Goal
                                    </label>
                                    <select
                                        value={filterFitnessGoal}
                                        onChange={(e) => setFilterFitnessGoal(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                    </select>
                                </div>

                                {/* Calls */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Calls
                                    </label>
                                    <div className="flex items-center gap-6 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterMissedCall}
                                                onChange={(e) => setFilterMissedCall(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Missed Call
                                        </label>
                                    </div>
                                </div>

                                {/* Call Tag */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Call Tag
                                    </label>
                                    <div className="flex items-center gap-5 w-48 sm:w-56 text-sm text-gray-700 dark:text-gray-200">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterCold}
                                                onChange={(e) => setFilterCold(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Cold
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterHot}
                                                onChange={(e) => setFilterHot(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Hot
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={filterWarm}
                                                onChange={(e) => setFilterWarm(e.target.checked)}
                                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                                            />
                                            Warm
                                        </label>
                                    </div>
                                </div>

                                {/* Last Call Status */}
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-normal text-gray-800 dark:text-gray-200 w-36">
                                        Last Call Status
                                    </label>
                                    <select
                                        value={filterLastCallStatus}
                                        onChange={(e) => setFilterLastCallStatus(e.target.value)}
                                        className="w-48 sm:w-56 h-8 px-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                    >
                                        <option value="">All</option>
                                        <option value="Enquiry">Enquiry</option>
                                        <option value="Enquiry/Cold">Enquiry/Cold</option>
                                        <option value="New Enquiry">New Enquiry</option>
                                        <option value="Cold">Cold</option>
                                        <option value="Enquiry follow-up">Enquiry follow-up</option>
                                        <option value="Sale">Sale</option>
                                        <option value="Did not Put Enquiry">Did not Put Enquiry</option>
                                        <option value="Not Relevant">Not Relevant</option>
                                        <option value="Trial Scheduled">Trial Scheduled</option>
                                        <option value="Post Trial Follow-up">Post Trial Follow-up</option>
                                        <option value="Busy Tone">Busy Tone</option>
                                        <option value="Switched Off/ Out of Reach">Switched Off/ Out of Reach</option>
                                        <option value="No answer">No answer</option>
                                        <option value="Future Prospect">Future Prospect</option>
                                        <option value="Not Interested">Not Interested</option>
                                        <option value="Invalid number">Invalid number</option>
                                        <option value="Auto Consumed">Auto Consumed</option>
                                        <option value="Manual Consumed">Manual Consumed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center mt-6">
                            <button
                                type="button"
                                onClick={() => setShowFilters(false)}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-1.5 rounded shadow-sm transition-colors text-sm"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Leads Grid */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Active Leads ({filteredLeads.length})
                    </h2>
                </CardHeader>
                <CardContent className="p-4">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No leads found.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredLeads.map((lead) => (
                                <Card 
                                    key={lead._id} 
                                    id={`lead-${lead._id}`}
                                    className={`hover:shadow-md transition-all duration-500 ${
                                        highlightedId === lead._id
                                            ? 'ring-2 ring-orange-500 dark:ring-orange-450 bg-orange-50/50 dark:bg-orange-950/20 border-orange-500'
                                            : 'border border-gray-100 dark:border-gray-800'
                                    }`}
                                >
                                    <CardContent className="p-5 flex flex-col h-full">
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{lead.name}</h3>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">Source: {lead.source}</span>
                                                </div>
                                            </div>
                                            <Badge className={statusColors[lead.status] || 'bg-gray-100 text-gray-800'}>
                                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                                            </Badge>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 mb-4 text-sm flex-1">
                                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                <Phone size={14} className="mr-2 opacity-70" />
                                                {lead.phone}
                                            </div>
                                            {lead.email && (
                                                <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                    <Mail size={14} className="mr-2 opacity-70" />
                                                    <span className="truncate">{lead.email}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center text-gray-600 dark:text-gray-300">
                                                <Clock size={14} className="mr-2 opacity-70" />
                                                <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {lead.comments && (
                                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-xs text-gray-500 italic border border-gray-100 dark:border-gray-700">
                                                    "{lead.comments}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                                            {user?.position === 'manager' ? (
                                                // Manager: can update status/notes AND edit full details
                                                <div className="flex gap-2 items-center">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 gap-1.5 text-xs py-2 px-2"
                                                        onClick={() => handleOpenEdit(lead)}
                                                    >
                                                        <Clock size={12} />
                                                        Status
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        className="flex-1 gap-1.5 text-xs py-2 px-2 bg-gradient-to-r from-orange-500 to-amber-500 border-none hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                                                        onClick={() => navigate(`/staff/enquiries/edit/${lead._id}`)}
                                                    >
                                                        <Edit2 size={12} />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="gap-1 text-xs py-2 px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30 hover:border-red-300"
                                                        onClick={() => handleDeleteLead(lead._id, lead.name)}
                                                        title="Delete Lead"
                                                    >
                                                        <Trash2 size={12} />
                                                        Delete
                                                    </Button>
                                                </div>
                                            ) : user?.position === 'receptionist' ? (
                                                // Receptionist: can only edit and delete walk-in leads
                                                (lead.source?.toLowerCase() === 'walk-in' || lead.enquiryType?.toLowerCase() === 'walk-in') ? (
                                                    <div className="flex gap-2 items-center">
                                                        <Button
                                                            variant="primary"
                                                            className="flex-1 gap-1.5 text-xs py-2 px-3 bg-gradient-to-r from-orange-500 to-amber-500 border-none hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
                                                            onClick={() => navigate(`/staff/enquiries/edit/${lead._id}`)}
                                                        >
                                                            <Edit2 size={12} />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="gap-1 text-xs py-2 px-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30 hover:border-red-300"
                                                            onClick={() => handleDeleteLead(lead._id, lead.name)}
                                                            title="Delete Lead"
                                                        >
                                                            <Trash2 size={12} />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="w-full text-xs text-center text-gray-400 dark:text-gray-500 italic py-1">
                                                        View only — not a walk-in lead
                                                    </p>
                                                )
                                            ) : (
                                                // Sales staff: can update status / note and delete lead
                                                <div className="flex gap-2 items-center">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 gap-1.5 text-xs py-2"
                                                        onClick={() => handleOpenEdit(lead)}
                                                    >
                                                        <Edit2 size={12} />
                                                        Update Status / Note
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="gap-1 text-xs py-2 px-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/30 hover:border-red-300"
                                                        onClick={() => handleDeleteLead(lead._id, lead.name)}
                                                        title="Delete Lead"
                                                    >
                                                        <Trash2 size={12} />
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>


                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Update Lead"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                        >
                            {statusOptions.map(option => (
                                <option key={option} value={option}>
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notes / Comments
                        </label>
                        <textarea
                            value={editComments}
                            onChange={(e) => setEditComments(e.target.value)}
                            className="w-full h-24 rounded-md border border-gray-300 dark:border-gray-700 p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                            placeholder="Add conversation notes..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveUpdate}>Save Changes</Button>
                    </div>
                </div>
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
