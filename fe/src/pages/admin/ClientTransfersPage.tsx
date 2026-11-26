import React, { useMemo } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useClient } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

// Helper to format date into Day, Month 'YY, DayName
const formatDateDetails = (dateStr?: string | Date) => {
  if (!dateStr) return { day: '01', month: 'JAN \'26', dayName: 'Monday' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '01', month: 'JAN \'26', dayName: 'Monday' };

  const day = String(d.getDate()).padStart(2, '0');
  const monthName = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const yearShort = String(d.getFullYear()).slice(-2);
  const dayName = d.toLocaleString('en-US', { weekday: 'long' });

  return {
    day,
    month: `${monthName} '${yearShort}`,
    dayName,
  };
};

const formatDateDDMMYYYY = (dateStr?: string | Date) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const ClientTransfersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clients, loading, fetchClients, getClientById } = useClient();
  const { addToast } = useToast();
  const showToast = addToast;

  const memIdParam = searchParams.get('memid');
  const trsParam = searchParams.get('trs'); // 0 for Sent, 1 for Received

  const clientId = id || memIdParam;
  const isReceived = trsParam === '1' || window.location.pathname.includes('transfers-received');

  const [directClient, setDirectClient] = React.useState<any>(null);

  React.useEffect(() => {
    fetchClients?.();
  }, [fetchClients]);

  React.useEffect(() => {
    if (clientId && getClientById) {
      getClientById(clientId).then((res) => {
        if (res) setDirectClient(res);
      });
    }
  }, [clientId, getClientById]);

  const client = useMemo(() => {
    if (directClient && (!clientId || String(directClient._id) === String(clientId))) {
      return directClient;
    }
    if (!clients || !clientId) return directClient || null;
    return (
      clients.find((c: any) => String(c._id) === String(clientId)) ||
      clients.find((c: any) => String(c.id) === String(clientId)) ||
      directClient ||
      null
    );
  }, [clients, clientId, directClient]);

  const clientName = client?.fullName || 'Member';

  const transfersList = useMemo(() => {
    if (!client) return [];
    if (isReceived) {
      return client.transfersReceived || [];
    }
    return client.transfersSent || [];
  }, [client, isReceived]);

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
    const targetId = client?._id || clientId;
    if (tab === 'Profile') {
      navigate(`/admin/client-form/${targetId}`);
    } else if (tab === 'Service Card') {
      navigate(`/admin/clients/service-card/${targetId}`);
    } else if (tab === 'Payments') {
      navigate(`/admin/clients/payments/${targetId}`);
    } else if (tab === 'Appointments') {
      navigate(`/admin/clients/appointments/${targetId}`);
    } else if (tab === 'Training') {
      navigate(`/admin/clients/training/${targetId}`);
    } else {
      showToast(`${tab} tab clicked`, 'info');
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans pb-16">
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
          <span>Validity Based</span>
          <span>/</span>
          <span className="text-[#ff5e28] font-semibold">
            {isReceived ? 'Transfers Received' : 'Transfers Sent'}
          </span>
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
                tab === 'Service Card'
                  ? 'text-[#ff5e28] font-medium border-b-2 border-[#ff5e28]'
                  : 'hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orange Banner Header */}
      <div className="mx-4 sm:mx-6 mt-4 p-4 bg-[#ffece5] dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-xs flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          Service Card - {clientName}
        </h1>
        <div className="flex items-center gap-2 text-xs">
          <Link
            to={`/admin/clients/service-card/${client?._id || clientId}`}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 shadow-2xs font-medium"
          >
            Back to Service Card
          </Link>
        </div>
      </div>

      {/* Transferred Services List */}
      <div className="mx-4 sm:mx-6 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">
            {isReceived ? 'Transfers Received' : 'Transfers Sent'}
          </h2>
          <span className="text-xs text-gray-500">
            Total {transfersList.length} record(s)
          </span>
        </div>

        {transfersList.length === 0 ? (
          <div className="p-12 text-center border border-gray-200 dark:border-gray-800 rounded bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 text-xs">
            {loading ? 'Loading...' : isReceived ? 'No transfers received found' : 'No transfers sent found'}
          </div>
        ) : (
          transfersList.map((transfer: any, idx: number) => {
            const startDetails = formatDateDetails(transfer.startDate);
            const expiryDetails = formatDateDetails(transfer.expiryDate);
            const startFormatted = formatDateDDMMYYYY(transfer.startDate);
            const expiryFormatted = formatDateDDMMYYYY(transfer.expiryDate);
            const transferDateFormatted = formatDateDDMMYYYY(transfer.transferDate || transfer.createdAt);

            return (
              <div
                key={transfer.transferId || idx}
                className="border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-850 p-4 shadow-2xs relative"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Service Meta */}
                  <div className="lg:col-span-8 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <div>
                        <span className="text-gray-500">Service Name : </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {transfer.serviceName || 'Club Membership'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Service Variation Name : </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {transfer.serviceVariationName || transfer.duration || '3 Months'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Service Id : </span>
                        <span className="text-gray-800 dark:text-gray-200">
                          {transfer.serviceId || '3081363'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500">Duration : </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {transfer.durationText || `7 Days Per week. Valid for ${transfer.serviceVariationName || '3 Months'}.`}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Sessions : </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {transfer.sessions || 'Not Applicable'}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 pt-0.5">
                      <div>
                        <span className="text-gray-500">Status : </span>
                        <span className="text-[#22c55e] font-semibold">Active</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Last visited on : -</span>
                      </div>
                    </div>

                    {/* Transfer Validity Note */}
                    <div className="pt-1.5 text-gray-600 dark:text-gray-400 font-medium text-[11px]">
                      Transfer valid From {startFormatted}, Transfer valid To {expiryFormatted}.
                    </div>

                    {/* Transfer Parties and Date Info */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-x-8 gap-y-1 text-xs text-sky-700 dark:text-sky-400 font-medium">
                      {isReceived ? (
                        <>
                          <div>
                            Sender's Name : <span className="font-bold text-gray-800 dark:text-gray-200">{transfer.fromClientName || 'Original Member'}</span>
                          </div>
                          <div>
                            Sender's Phone Number : <span className="font-bold text-gray-800 dark:text-gray-200">{transfer.fromClientPhone || '-'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            Receiver's Name : <span className="font-bold text-gray-800 dark:text-gray-200">{transfer.toClientName || 'Receiving Member'}</span>
                          </div>
                          <div>
                            Receiver's Phone Number : <span className="font-bold text-gray-800 dark:text-gray-200">{transfer.toClientPhone || '-'}</span>
                          </div>
                        </>
                      )}
                      <div>
                        Transfer Date : <span className="font-bold text-gray-800 dark:text-gray-200">{transferDateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Start & Expiry Date Boxes */}
                  <div className="lg:col-span-4 flex items-center justify-end gap-6 text-center">
                    {/* Start Date Box */}
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                        START DATE
                      </div>
                      <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                        {startDetails.day}
                      </div>
                      <div className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                        {startDetails.month}
                      </div>
                      <div className="text-[10px] text-gray-400 italic">
                        {startDetails.dayName}
                      </div>
                    </div>

                    {/* Expiry Date Box */}
                    <div>
                      <div className="text-[10px] text-gray-500 font-semibold tracking-wider">
                        EXPIRY DATE
                      </div>
                      <div className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                        {expiryDetails.day}
                      </div>
                      <div className="text-[10px] text-gray-800 dark:text-gray-200 font-bold">
                        {expiryDetails.month}
                      </div>
                      <div className="text-[10px] text-gray-400 italic">
                        {expiryDetails.dayName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
