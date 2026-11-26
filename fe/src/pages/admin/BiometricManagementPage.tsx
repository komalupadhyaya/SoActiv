import React, { useState, useEffect, useCallback } from 'react';
import {
  Fingerprint,
  Monitor,
  Users,
  Activity,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Eye,
  Link2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BiometricDevice {
  _id: string;
  name: string;
  serialNumber: string;
  manufacturer?: string;
  model?: string;
  deviceType: string;
  connectionType: string;
  status: 'ONLINE' | 'OFFLINE' | 'DISABLED' | 'UNKNOWN';
  isActive: boolean;
  ipAddress?: string;
  port?: number;
  duplicateWindowSeconds: number;
  lastPingAt?: string;
  lastCommunicationAt?: string;
  createdAt: string;
}

interface BiometricUser {
  _id: string;
  biometricUserId: string;
  status: 'active' | 'suspended' | 'deleted';
  enrolledAt: string;
  lastSyncedAt?: string;
  memberId?: {
    _id: string;
    fullName: string;
    email: string;
    contactNumber: string;
    status: string;
  };
  deviceId?: {
    _id: string;
    name: string;
    serialNumber: string;
    status: string;
  };
}

interface EventLog {
  _id: string;
  biometricUserId: string;
  eventType: string;
  verificationType: string;
  processingStatus: string;
  accessAllowed: boolean;
  failureReason?: string;
  eventTime: string;
  processedAt: string;
  memberId?: { fullName: string; email: string };
  deviceId?: { name: string; serialNumber: string };
}

type Tab = 'devices' | 'users' | 'logs';

// ─── Status Helpers ───────────────────────────────────────────────────────────
const getStatusBadge = (status: string) => {
  const map: Record<string, { color: string; icon: React.ReactNode }> = {
    ONLINE: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <Wifi className="w-3 h-3" /> },
    OFFLINE: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <WifiOff className="w-3 h-3" /> },
    DISABLED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
    UNKNOWN: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <AlertCircle className="w-3 h-3" /> },
    active: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" /> },
    suspended: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <AlertCircle className="w-3 h-3" /> },
    PROCESSED: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle className="w-3 h-3" /> },
    DUPLICATE: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: <Activity className="w-3 h-3" /> },
    MEMBERSHIP_DENIED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
    UNKNOWN_USER: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <AlertCircle className="w-3 h-3" /> },
    PROCESSING_FAILED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <XCircle className="w-3 h-3" /> },
    DEVICE_DISABLED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: <WifiOff className="w-3 h-3" /> },
  };
  const config = map[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};

const formatTime = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Device Form Modal ────────────────────────────────────────────────────────
interface DeviceFormProps {
  initial?: Partial<BiometricDevice>;
  onSave: (data: any) => void;
  onClose: () => void;
}

const DeviceFormModal: React.FC<DeviceFormProps> = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    serialNumber: initial?.serialNumber || '',
    manufacturer: initial?.manufacturer || 'eSSL',
    model: initial?.model || '',
    deviceType: initial?.deviceType || 'FINGERPRINT',
    connectionType: initial?.connectionType || 'PUSH',
    ipAddress: initial?.ipAddress || '',
    port: initial?.port || '',
    duplicateWindowSeconds: initial?.duplicateWindowSeconds ?? 30,
    isActive: initial?.isActive ?? true,
  });

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{initial?._id ? 'Edit Device' : 'Register Device'}</h2>
              <p className="text-gray-400 text-xs">Configure biometric hardware device</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {[
            { label: 'Device Name *', key: 'name', placeholder: 'e.g. Main Entrance Turnstile' },
            { label: 'Serial Number *', key: 'serialNumber', placeholder: 'e.g. ESSL-X990-001' },
            { label: 'Manufacturer', key: 'manufacturer', placeholder: 'e.g. eSSL' },
            { label: 'Model', key: 'model', placeholder: 'e.g. X990' },
            { label: 'IP Address', key: 'ipAddress', placeholder: '192.168.1.100' },
            { label: 'Port', key: 'port', placeholder: '8080', type: 'number' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
              <input
                type={type || 'text'}
                value={(form as any)[key]}
                onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Device Type</label>
              <select
                value={form.deviceType}
                onChange={(e) => set('deviceType', e.target.value)}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {['FINGERPRINT', 'FACE', 'RFID', 'CARD', 'MULTI_MODAL', 'UNKNOWN'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Connection</label>
              <select
                value={form.connectionType}
                onChange={(e) => set('connectionType', e.target.value)}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {['PUSH', 'TCP_IP', 'HTTP', 'HTTPS', 'SDK', 'POLLING', 'UNKNOWN'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Duplicate Punch Window (seconds)</label>
            <input
              type="number"
              value={form.duplicateWindowSeconds}
              onChange={(e) => set('duplicateWindowSeconds', Number(e.target.value))}
              min={0}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-white/5">
            <label className="text-sm text-gray-300 flex-1">Active Device</label>
            <button
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-all ${form.isActive ? 'bg-violet-600' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {initial?._id ? 'Update Device' : 'Register Device'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Map User Modal ───────────────────────────────────────────────────────────
interface MapUserModalProps {
  devices: BiometricDevice[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const MapUserModal: React.FC<MapUserModalProps> = ({ devices, onSave, onClose }) => {
  const [form, setForm] = useState({ memberId: '', deviceId: '', biometricUserId: '', status: 'active' });
  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Map Biometric User</h2>
              <p className="text-gray-400 text-xs">Link member to device user ID</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Member ID *</label>
            <input
              value={form.memberId}
              onChange={(e) => set('memberId', e.target.value)}
              placeholder="Member's MongoDB ObjectId"
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Device *</label>
            <select
              value={form.deviceId}
              onChange={(e) => set('deviceId', e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
            >
              <option value="">Select device...</option>
              {devices.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.serialNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Biometric User ID (PIN) *</label>
            <input
              value={form.biometricUserId}
              onChange={(e) => set('biometricUserId', e.target.value)}
              placeholder="e.g. 2936 (as stored in device)"
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
            <p className="text-xs text-teal-300">
              <strong>Note:</strong> The Biometric User ID is the PIN/User ID assigned to this member in the physical device's user database.
            </p>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Map User
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const BiometricManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('devices');
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [biometricUsers, setBiometricUsers] = useState<BiometricUser[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [editDevice, setEditDevice] = useState<BiometricDevice | null>(null);
  const [showMapUserForm, setShowMapUserForm] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDevices = useCallback(async () => {
    try {
      const res = await api.get('/biometric/devices');
      setDevices(res.data?.data || []);
    } catch {
      showToast('Failed to load biometric devices', 'error');
    }
  }, [showToast]);

  const fetchBiometricUsers = useCallback(async () => {
    try {
      const res = await api.get('/biometric/users');
      setBiometricUsers(res.data?.data || []);
    } catch {
      showToast('Failed to load biometric user mappings', 'error');
    }
  }, [showToast]);

  const fetchEventLogs = useCallback(async () => {
    try {
      const res = await api.get('/biometric/events?limit=50');
      setEventLogs(res.data?.data?.logs || []);
    } catch {
      showToast('Failed to load event logs', 'error');
    }
  }, [showToast]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDevices(), fetchBiometricUsers(), fetchEventLogs()]);
    setLoading(false);
  }, [fetchDevices, fetchBiometricUsers, fetchEventLogs]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Device CRUD ────────────────────────────────────────────────────────────
  const handleSaveDevice = async (data: any) => {
    try {
      if (editDevice) {
        await api.put(`/biometric/devices/${editDevice._id}`, data);
        showToast('Device updated successfully', 'success');
      } else {
        await api.post('/biometric/devices', { ...data, gymId: user?.gym });
        showToast('Device registered successfully', 'success');
      }
      setShowDeviceForm(false);
      setEditDevice(null);
      fetchDevices();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save device', 'error');
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!window.confirm('Delete this device? All associated user mappings will also be removed.')) return;
    try {
      await api.delete(`/biometric/devices/${id}`);
      showToast('Device deleted successfully', 'success');
      fetchDevices();
    } catch {
      showToast('Failed to delete device', 'error');
    }
  };

  // ── User Mapping CRUD ──────────────────────────────────────────────────────
  const handleMapUser = async (data: any) => {
    try {
      await api.post('/biometric/users', { ...data, gymId: user?.gym });
      showToast('User mapped successfully', 'success');
      setShowMapUserForm(false);
      fetchBiometricUsers();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to map user', 'error');
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!window.confirm('Remove this biometric user mapping?')) return;
    try {
      await api.delete(`/biometric/users/${id}`);
      showToast('Mapping removed', 'success');
      fetchBiometricUsers();
    } catch {
      showToast('Failed to remove mapping', 'error');
    }
  };

  // ── Summary Stats ──────────────────────────────────────────────────────────
  const stats = {
    devicesOnline: devices.filter((d) => d.status === 'ONLINE').length,
    devicesTotal: devices.length,
    mappedUsers: biometricUsers.filter((u) => u.status === 'active').length,
    todayAccess: eventLogs.filter((l) => {
      const d = new Date(l.eventTime);
      const now = new Date();
      return d.toDateString() === now.toDateString() && l.accessAllowed;
    }).length,
    todayDenied: eventLogs.filter((l) => {
      const d = new Date(l.eventTime);
      const now = new Date();
      return d.toDateString() === now.toDateString() && !l.accessAllowed;
    }).length,
  };

  // ── Tab Config ─────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'devices', label: 'Devices', icon: <Monitor className="w-4 h-4" />, count: devices.length },
    { id: 'users', label: 'User Mappings', icon: <Users className="w-4 h-4" />, count: biometricUsers.length },
    { id: 'logs', label: 'Event Logs', icon: <Activity className="w-4 h-4" />, count: eventLogs.length },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-violet-950/30 to-gray-900 border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent" />
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Fingerprint className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Biometric Management</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Manage devices, member mappings & access logs</p>
                </div>
              </div>
              <button
                onClick={loadAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { label: 'Devices Online', value: `${stats.devicesOnline}/${stats.devicesTotal}`, color: 'text-emerald-400', icon: <Wifi className="w-4 h-4" /> },
                { label: 'Mapped Users', value: stats.mappedUsers, color: 'text-violet-400', icon: <Users className="w-4 h-4" /> },
                { label: "Today's Access", value: stats.todayAccess, color: 'text-teal-400', icon: <CheckCircle className="w-4 h-4" /> },
                { label: "Today's Denied", value: stats.todayDenied, color: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className={`flex items-center gap-2 ${stat.color} mb-2`}>
                    {stat.icon}
                    <span className="text-xs font-medium opacity-80">{stat.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* eSSL Setup Info */}
        <div className="mb-6 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-start gap-3">
          <Fingerprint className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-violet-300">eSSL ADMS Configuration</p>
            <p className="text-xs text-violet-300/70 mt-1">
              Configure your eSSL biometric device's ADMS/Cloud settings with:&nbsp;
              <code className="bg-violet-900/40 px-1.5 py-0.5 rounded text-violet-200">
                Server URL: http://&lt;server-ip&gt;:8000/iclock/cdata
              </code>
              &nbsp;— The device will automatically push attendance to this endpoint.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-900/50 border border-white/10 rounded-2xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-white/5'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Devices Tab ── */}
        {activeTab === 'devices' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Registered Devices</h2>
              <button
                id="biometric-add-device-btn"
                onClick={() => { setEditDevice(null); setShowDeviceForm(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
              >
                <Plus className="w-4 h-4" />
                Register Device
              </button>
            </div>

            {devices.length === 0 ? (
              <div className="text-center py-16 bg-white/2 border border-white/5 rounded-2xl">
                <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No devices registered</p>
                <p className="text-gray-600 text-sm mt-1">Register your first biometric device to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div key={device._id} className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${device.status === 'ONLINE' ? 'bg-emerald-500/20' : 'bg-gray-700/50'}`}>
                          <Monitor className={`w-5 h-5 ${device.status === 'ONLINE' ? 'text-emerald-400' : 'text-gray-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white">{device.name}</h3>
                            {getStatusBadge(device.status)}
                            {!device.isActive && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">Disabled</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 flex-wrap">
                            <span className="font-mono">{device.serialNumber}</span>
                            {device.manufacturer && <span>{device.manufacturer} {device.model}</span>}
                            <span className="bg-gray-800 rounded-full px-2 py-0.5">{device.deviceType}</span>
                            <span className="bg-gray-800 rounded-full px-2 py-0.5">{device.connectionType}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 flex-wrap">
                            {device.ipAddress && <span>IP: {device.ipAddress}{device.port ? `:${device.port}` : ''}</span>}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last ping: {formatTime(device.lastPingAt)}
                            </span>
                            <span>Debounce: {device.duplicateWindowSeconds}s</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditDevice(device); setShowDeviceForm(true); }}
                          className="p-2 rounded-xl bg-gray-800 hover:bg-violet-500/20 hover:text-violet-400 text-gray-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(device._id)}
                          className="p-2 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── User Mappings Tab ── */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Biometric User Mappings</h2>
              <button
                id="biometric-map-user-btn"
                onClick={() => setShowMapUserForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/20"
              >
                <Link2 className="w-4 h-4" />
                Map User
              </button>
            </div>

            {biometricUsers.length === 0 ? (
              <div className="text-center py-16 bg-white/2 border border-white/5 rounded-2xl">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No user mappings found</p>
                <p className="text-gray-600 text-sm mt-1">Map members to their biometric device user IDs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {biometricUsers.map((bu) => (
                  <div key={bu._id} className="bg-gray-900/60 border border-white/10 rounded-2xl p-5 hover:border-teal-500/30 transition-all group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <Fingerprint className="w-5 h-5 text-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white">{bu.memberId?.fullName || 'Unknown Member'}</h3>
                            {getStatusBadge(bu.status)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                            <span>PIN: <span className="font-mono text-violet-400">{bu.biometricUserId}</span></span>
                            <ChevronRight className="w-3 h-3" />
                            <span>{bu.deviceId?.name} ({bu.deviceId?.serialNumber})</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <span>Enrolled: {formatTime(bu.enrolledAt)}</span>
                            {bu.lastSyncedAt && <span>Last sync: {formatTime(bu.lastSyncedAt)}</span>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMapping(bu._id)}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Event Logs Tab ── */}
        {activeTab === 'logs' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Biometric Event Logs</h2>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Eye className="w-3.5 h-3.5" />
                Latest 50 events
              </div>
            </div>

            {eventLogs.length === 0 ? (
              <div className="text-center py-16 bg-white/2 border border-white/5 rounded-2xl">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No events recorded yet</p>
                <p className="text-gray-600 text-sm mt-1">Events appear when your biometric device sends data</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-900/80 border-b border-white/10">
                      {['Member', 'Device', 'Event', 'Verify', 'Status', 'Result', 'Time'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {eventLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/2 transition-colors">
                        <td className="px-4 py-3 text-gray-300">{log.memberId?.fullName || <span className="text-gray-600">Unknown</span>}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{log.deviceId?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${log.eventType === 'CHECK_IN' ? 'text-teal-400' : log.eventType === 'CHECK_OUT' ? 'text-orange-400' : 'text-gray-400'}`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{log.verificationType}</td>
                        <td className="px-4 py-3">{getStatusBadge(log.processingStatus)}</td>
                        <td className="px-4 py-3">
                          {log.accessAllowed ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="w-3 h-3" /> Allowed</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-400"><XCircle className="w-3 h-3" /> Denied</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatTime(log.eventTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeviceForm && (
        <DeviceFormModal
          initial={editDevice || undefined}
          onSave={handleSaveDevice}
          onClose={() => { setShowDeviceForm(false); setEditDevice(null); }}
        />
      )}
      {showMapUserForm && (
        <MapUserModal
          devices={devices}
          onSave={handleMapUser}
          onClose={() => setShowMapUserForm(false)}
        />
      )}
    </div>
  );
};

export default BiometricManagementPage;
