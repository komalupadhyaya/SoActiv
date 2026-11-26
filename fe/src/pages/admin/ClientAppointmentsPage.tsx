import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';
import { ProFormaInvoiceModal } from '../../components/modals/ProFormaInvoiceModal';

export const ClientAppointmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients } = useClient();
  const { staff } = useStaff();
  const { addToast } = useToast();
  const showToast = addToast;

  const memId = id || searchParams.get('memid') || '';

  const client = useMemo(() => {
    if (!memId) return clients[0] || null;
    return clients.find((c) => c._id === memId) || clients[0] || null;
  }, [clients, memId]);

  const apttyp = searchParams.get('apttyp');
  const [appointmentModule, setAppointmentModule] = useState<'New' | 'Classic'>(
    apttyp === '1' ? 'Classic' : 'Classic'
  );
  const [activeTopTab, setActiveTopTab] = useState<'Appointments' | string>('Appointments');
  
  const todayISO = new Date().toISOString().split('T')[0];
  const nextWeekISO = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState<string>(todayISO);
  const [toDate, setToDate] = useState<string>(nextWeekISO);
  const [selectedStaff, setSelectedStaff] = useState<string>('All Staff');
  const [selectedStatus, setSelectedStatus] = useState<string>('Select');
  const [selectedCommunicate, setSelectedCommunicate] = useState<string>('Select');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const clientName = client?.fullName || 'Avinash';

  const tabs = [
    'Profile',
    'Service Card',
    'Payments',
    'Call Log',
    'Appointments',
    'Referrals',
    'Family Member',
    'Store',
    'Documents',
    'Attendance',
    'Trial History',
    'Training',
    'Terms & Conditions',
  ];

  const handleTabClick = (tab: string) => {
    setActiveTopTab(tab);
    if (tab === 'Profile' && client) {
      navigate(`/admin/client-form/${client._id}`);
    } else if (tab === 'Service Card' && client) {
      navigate(`/admin/clients/service-card/${client._id}`);
    } else if (tab === 'Payments' && client) {
      navigate(`/admin/clients/payments/${client._id}`);
    } else if (tab === 'Training' && client) {
      navigate(`/admin/clients/training/${client._id}`);
    } else if (tab === 'Schedule') {
      navigate('/admin/schedule');
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col font-sans">
      {/* Breadcrumbs Header */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between text-xs sm:text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/clients" className="hover:text-gray-900 dark:hover:text-gray-200">
            Clients
          </Link>
          <span>/</span>
          <span>Archived</span>
          <span>/</span>
          <span className="text-[#ff5e28] font-semibold">Appointments - {clientName}</span>
        </div>
      </div>

      {/* Top Tabs Navigation */}
      <div className="px-4 sm:px-6 pt-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max text-xs text-gray-600 dark:text-gray-400">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`pb-2.5 transition-colors cursor-pointer ${
                activeTopTab === tab
                  ? 'text-[#ff5e28] font-medium border-b-2 border-[#ff5e28]'
                  : 'hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Banner / Header Row */}
      <div className="mx-4 sm:mx-6 mt-4 p-4 bg-[#ffece5] dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xs flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:white">
          Appointments - {clientName}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => showToast('Inter branch transfer opened', 'info')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Inter branch transfer
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Print profile
          </button>
          <button
            type="button"
            onClick={() => showToast('Add advance payment opened', 'info')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            Add Advance Payment
          </button>
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            New Invoice
          </button>
          <button
            type="button"
            onClick={() => showToast('New Call log opened', 'info')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            New Call
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/schedule')}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer"
          >
            New appointment
          </button>
        </div>
      </div>

      {/* Appointment Sub-Tabs (Appointment (New) / Appointment (Classic)) */}
      <div className="mx-4 sm:mx-6 mt-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          <button
            type="button"
            onClick={() => setAppointmentModule('New')}
            className={`pb-2 font-medium cursor-pointer transition-colors ${
              appointmentModule === 'New'
                ? 'text-[#ff5e28] border-b-2 border-[#ff5e28]'
                : 'hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Appointment (New)
          </button>
          <button
            type="button"
            onClick={() => setAppointmentModule('Classic')}
            className={`pb-2 font-medium cursor-pointer transition-colors ${
              appointmentModule === 'Classic'
                ? 'text-[#ff5e28] border-b-2 border-[#ff5e28]'
                : 'hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Appointment (Classic)
          </button>
        </div>
      </div>

      {/* Explanation text */}
      <div className="mx-4 sm:mx-6 mt-3 text-xs text-gray-600 dark:text-gray-400">
        {appointmentModule === 'Classic'
          ? 'View appointments and history using the older module structure. Recommended only for data before July 2025.'
          : 'List of Appointments booked for individual members or for shared accounts where this member is primary member.'}
      </div>

      {/* Status Counters Bar */}
      <div className="mx-4 sm:mx-6 mt-4 flex flex-wrap items-center justify-end gap-5 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
          <span>Upcoming :</span>
          <span className="text-[#f59e0b] font-bold">0</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
          <span>Rescheduled :</span>
          <span className="text-[#86efac] dark:text-[#4ade80] font-bold">0</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
          <span>No Show :</span>
          <span className="text-[#f87171] font-bold">0</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
          <span>Completed :</span>
          <span className="text-[#f87171] font-bold">0</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
          <span>Cancelled :</span>
          <span className="text-[#f59e0b] font-bold">0</span>
        </div>
      </div>

      {/* Filter Row Controls */}
      <div className="mx-4 sm:mx-6 mt-3 p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 dark:text-gray-400">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 text-xs focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-600 dark:text-gray-400">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 text-xs focus:ring-1 focus:ring-orange-500"
          />
        </div>

        <button
          type="button"
          onClick={() => showToast('Filters applied', 'info')}
          className="px-4 py-1 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-bold rounded-xs shadow-2xs transition-colors cursor-pointer text-xs uppercase"
        >
          GO
        </button>

        <div className="flex items-center gap-6 ml-auto flex-wrap">
          {/* Staff */}
          <div className="flex items-center gap-2">
            <span className="text-gray-800 dark:text-gray-200 font-medium">Staff</span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[120px]"
            >
              <option value="All Staff">All Staff</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-gray-800 dark:text-gray-200 font-medium">Status</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[110px]"
            >
              <option value="Select">Select</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Attended">Attended</option>
              <option value="No Show">No Show</option>
              <option value="Canceled">Canceled</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>

          {/* Communicate */}
          <div className="flex items-center gap-2">
            <span className="text-gray-800 dark:text-gray-200 font-medium">Communicate</span>
            <select
              value={selectedCommunicate}
              onChange={(e) => setSelectedCommunicate(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 text-xs focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[110px]"
            >
              <option value="Select">Select</option>
              <option value="SMS">SMS</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments List / Table Content Area */}
      <div className="mx-4 sm:mx-6 mt-6 pb-12">
        <div className="py-8 px-4 text-left border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-700 dark:text-gray-300 font-normal">
            No Results Found.
          </p>
        </div>
      </div>

      {/* Pro Forma Invoice Modal */}
      <ProFormaInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSave={async () => {
          setIsInvoiceModalOpen(false);
          navigate(`/admin/clients/payments/${memId || id}`);
        }}
        memberData={{
          fullName: clientName,
          contactNumber: client?.contactNumber || '',
          email: client?.email || '',
          salesRep: (client as any)?.salesRep,
        }}
      />
    </div>
  );
};
