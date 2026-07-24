import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  ClipboardList,
  User,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useClient } from '../../../hooks/useClient';
import { useClientAttendance } from '../../../hooks/useClientAttendance';
import { useToast } from '../../../contexts/ToastContext';

const CheckInPage: React.FC = () => {
  const { clients, loading: clientsLoading, refresh: refreshClients } = useClient();
  const { markClientAttendance, fetchTodayLogs } = useClientAttendance();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [attendanceNote, setAttendanceNote] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => {
    refreshClients();
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await fetchTodayLogs();
      setTodayAttendance(logs);
    } catch (e) {
      console.error('Failed to load today logs:', e);
    } finally {
      setLogsLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return [];
    return clients.filter(c =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactNumber.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clients]);

  const handleMarkAttendance = async (clientId: string, action: 'check-in' | 'check-out') => {
    const res = await markClientAttendance(clientId, action, attendanceNote);
    if (res.success) {
      addToast(res.message, 'success');
      setAttendanceNote('');
      setSelectedClient(null);
      setSearchTerm('');
      loadLogs();
      refreshClients();
    } else {
      addToast(res.message, 'error');
    }
  };

  const checkedInToday = todayAttendance.filter(r => !r.checkOutTime).length;
  const completedToday = todayAttendance.filter(r => r.checkOutTime).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Member Check-In / Check-Out</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Search for a member to mark their gym entry or exit.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Currently Inside</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{checkedInToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Search + Check-in panel */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Verify Member Entry / Exit</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedClient(null);
                  }}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Dropdown results */}
              {filteredClients.length > 0 && !selectedClient && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 shadow-sm bg-white dark:bg-gray-800">
                  {filteredClients.map(client => (
                    <button
                      key={client._id}
                      onClick={() => setSelectedClient(client)}
                      className="w-full text-left p-3 hover:bg-orange-50/60 dark:hover:bg-orange-950/10 flex items-center justify-between transition"
                    >
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{client.fullName}</p>
                        <p className="text-xs text-gray-500">{client.contactNumber} · {client.plan} plan</p>
                      </div>
                      <Badge className={client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {client.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              {searchTerm && !clientsLoading && filteredClients.length === 0 && !selectedClient && (
                <p className="text-xs text-gray-400 text-center py-4">No members found for "{searchTerm}"</p>
              )}

              {/* Selected Member Card */}
              {selectedClient && (
                <div className="p-4 bg-orange-50/40 dark:bg-orange-950/10 rounded-xl border border-orange-200/50 shadow-inner space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 font-bold text-sm">
                        {selectedClient.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedClient.fullName}</p>
                        <p className="text-xs text-gray-500">{selectedClient.email}</p>
                        <p className="text-xs text-gray-500">{selectedClient.contactNumber}</p>
                      </div>
                    </div>
                    <Badge className={selectedClient.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'}>
                      {selectedClient.status}
                    </Badge>
                  </div>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-orange-200/30 text-gray-700 dark:text-gray-300">
                    <p><span className="font-semibold">Plan:</span> {selectedClient.plan}</p>
                    <p><span className="font-semibold">Expiry:</span> {new Date(selectedClient.endDate).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Trainer:</span> {selectedClient.trainer?.fullName || 'Not assigned'}</p>
                    <p><span className="font-semibold">Emergency Contact:</span> {selectedClient.emergencyContactName || 'N/A'} ({selectedClient.emergencyContactNumber || 'N/A'})</p>
                  </div>

                  <Input
                    type="text"
                    placeholder="Optional note (e.g. guest pass, one-day trial)..."
                    value={attendanceNote}
                    onChange={(e) => setAttendanceNote(e.target.value)}
                    className="text-xs"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleMarkAttendance(selectedClient._id, 'check-in')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm shadow-md"
                      disabled={selectedClient.status !== 'active'}
                    >
                      ✓ Check In
                    </Button>
                    <Button
                      onClick={() => handleMarkAttendance(selectedClient._id, 'check-out')}
                      variant="outline"
                      className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-semibold text-sm"
                    >
                      ↩ Check Out
                    </Button>
                  </div>

                  {selectedClient.status !== 'active' && (
                    <p className="text-xs text-red-500 font-medium text-center">
                      ⚠ Membership is inactive — check-in disabled.
                    </p>
                  )}

                  <button
                    onClick={() => { setSelectedClient(null); setSearchTerm(''); setAttendanceNote(''); }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-full text-center mt-1"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Today's Log */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-orange-500" />
                Check-in Log — Today
              </h2>
              <button
                onClick={loadLogs}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Refresh
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
                </div>
              ) : todayAttendance.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold">No entries recorded today yet.</p>
                  <p className="text-xs">Search a member on the left to check them in.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                      {todayAttendance.map((row) => (
                        <tr key={row._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                          <td className="px-4 py-3 font-semibold text-sm text-gray-900 dark:text-white">{row.clientName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {row.duration !== null && row.duration !== undefined ? `${row.duration} mins` : '--'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={row.checkOutTime ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}>
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
    </div>
  );
};

export default CheckInPage;
