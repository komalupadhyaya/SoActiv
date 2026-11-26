import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Dumbbell,
  Plus,
  Calendar,
  Activity,
  FileText,
} from 'lucide-react';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

export const ClientTrainingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients } = useClient();
  const { showToast } = useToast();

  const memId = id || searchParams.get('memid') || '';

  const client = useMemo(() => {
    if (!memId) return clients[0] || null;
    return clients.find((c) => c._id === memId) || clients[0] || null;
  }, [clients, memId]);

  const [activeTopTab, setActiveTopTab] = useState<'Training' | string>('Training');
  const [activeSubTab, setActiveSubTab] = useState<string>('Fitness Log');

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

  const subTabs = [
    'Fitness Log',
    'Assessment',
    'Meal Plan',
    'Fitness Goal',
    'Fitness Profile',
  ];

  const handleTabClick = (tab: string) => {
    setActiveTopTab(tab);
    if (tab === 'Profile' && client) {
      navigate(`/admin/client-form/${client._id}`);
    } else if (tab === 'Service Card' && client) {
      navigate(`/admin/clients/service-card/${client._id}`);
    } else if (tab === 'Payments' && client) {
      navigate(`/admin/clients/payments/${client._id}`);
    } else if (tab === 'Appointments' && client) {
      navigate(`/admin/clients/appointments/${client._id}`);
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
          <span className="text-[#ff5e28] font-semibold">Workout - {clientName}</span>
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
        <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          Workout - {clientName}
        </h1>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => showToast('Add workout modal opened', 'info')}
            className="px-3.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs cursor-pointer font-medium"
          >
            Add workout
          </button>
        </div>
      </div>

      {/* Training Sub-Tabs */}
      <div className="mx-4 sm:mx-6 mt-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-6 text-xs text-gray-700 dark:text-gray-300 font-semibold">
          {subTabs.map((subTab) => (
            <button
              key={subTab}
              type="button"
              onClick={() => setActiveSubTab(subTab)}
              className={`pb-2 cursor-pointer transition-colors ${
                activeSubTab === subTab
                  ? 'text-gray-900 dark:text-white border-b-2 border-transparent'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {subTab}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-4 sm:mx-6 mt-6 pb-12">
        <div className="py-8 px-2 text-left">
          <p className="text-xs text-gray-700 dark:text-gray-300 font-normal">
            No Results Found.
          </p>
        </div>
      </div>
    </div>
  );
};
