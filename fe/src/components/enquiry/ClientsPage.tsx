import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Trash2,
  Dumbbell,
  IndianRupee,
  Upload,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClientRegistrationForm } from '../../components/forms/ClientRegistrationForm';
import { BulkUploadModal } from '../../components/common/BulkUploadModal';
import { UploadResultsReport } from '../../components/common/UploadResultsReport';
import { useClient, type BulkUploadResult } from '../../hooks/useClient';

// Status color classes
const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

type LocalRecentActivity =
  | { type: 'add'; count: number }
  | { type: 'delete'; count: number }
  | null;

export const ClientsPage: React.FC = () => {
  const { clients, loading, error, createClient, bulkUpload, deleteClient } = useClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<LocalRecentActivity>(null);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactNumber.includes(searchQuery) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const expiringClients = clients.filter(
    (client) => (client.remainingDays ?? 0) > 0 && (client.remainingDays ?? 0) <= 30
  );
  const expiredClients = clients.filter((client) => (client.remainingDays ?? 0) <= 0);

  const handleCreateClient = async (formData: any) => {
    const result = await createClient(formData);
    if (result.success) {
      setRecentActivity({ type: 'add', count: 1 });
      setIsAddClientModalOpen(false);
      setTimeout(() => setRecentActivity(null), 5000);
    } else {
      alert(result.message || 'Failed to register client');
    }
    return result;
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
    setRecentActivity((prev) => {
      if (prev?.type === 'delete') return { ...prev, count: prev.count + 1 };
      return { type: 'delete', count: 1 };
    });
    setTimeout(() => setRecentActivity(null), 5000);
  };

  const handleBulkUpload = async (file: File) => {
    const result = await bulkUpload(file);
    if (result) {
      setUploadResult(result);
      setIsBulkUploadModalOpen(false);
      setIsResultsModalOpen(true);

      if (result.summary.successful > 0) {
        setRecentActivity({ type: 'add', count: result.summary.successful });
        setTimeout(() => setRecentActivity(null), 5000);
      }
    }
    return result;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600 dark:text-gray-400">
        Loading clients...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4 mt-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 w-full max-w-screen-2xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your gym clients and their memberships
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            Bulk Upload
          </Button>
          <Button
            onClick={() => setIsAddClientModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Client
          </Button>
        </div>
      </div>

      {/* Notifications: Add/Delete + Expiry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recentActivity?.type === 'add' && (
          <Card className="border-l-4 border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600 w-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    {recentActivity.count} client added successfully!
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    New member has been registered.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {recentActivity?.type === 'delete' && (
          <Card className="border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600 w-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {recentActivity.count} client deleted
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Member has been removed from the system.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {expiringClients.length > 0 && !recentActivity && (
          <Card className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600 w-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    {expiringClients.length} member(s) expiring in 30 days
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Consider reaching out for renewals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {expiredClients.length > 0 && !recentActivity && (
          <Card className="border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600 w-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {expiredClients.length} member(s) have expired
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Follow up for renewals or account updates
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search & Filters */}
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or email..."
                leftIcon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-xs sm:w-auto"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'pending', label: 'Pending Renewal' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            />
            <Button variant="outline" className="flex items-center gap-2">
              <Filter size={16} />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Card List (no table) */}
      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Clients ({filteredClients.length})
          </h3>
        </CardHeader>
        <CardContent className="p-4">
          {filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No clients match your search criteria.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card key={client._id} className="h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    {/* Header: Name + Gender */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {client.fullName}
                        </div>
                        <div className="text-sm capitalize text-gray-500 dark:text-gray-400">
                          {client.gender}
                        </div>
                      </div>
                      <Badge className={statusColors[client.status]}>
                        {client.status}
                      </Badge>
                    </div>

                    {/* Contact */}
                    <div className="mt-3 flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center space-x-1">
                        <Phone size={14} />
                        <span>{client.contactNumber}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Mail size={14} />
                        <span>{client.email}</span>
                      </div>
                    </div>

                    {/* Membership period */}
                    <div className="mt-3 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>
                          {client.startDate
                            ? new Date(client.startDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>
                          {client.endDate
                            ? new Date(client.endDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Package / PT */}
                    <div className="mt-3 flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <IndianRupee size={14} className="mr-1 text-gray-500" />
                        <span className="font-semibold">
                          {typeof client.packagePrice === 'number'
                            ? client.packagePrice.toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      {client.hasPersonalTraining && (
                        <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                          <Dumbbell size={12} className="mr-1" />
                          <span>
                            PT: ₹
                            {typeof client.personalTrainingPrice === 'number'
                              ? client.personalTrainingPrice.toFixed(2)
                              : '0'}{' '}
                            for {client.personalTrainingDurationWeeks} wk
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Remaining days + actions */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-medium ${(client.remainingDays ?? 0) <= 0
                          ? 'text-red-600 dark:text-red-400'
                          : (client.remainingDays ?? 0) <= 30
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                          }`}
                      >
                        {(client.remainingDays ?? 0) <= 0
                          ? 'Expired'
                          : `${client.remainingDays ?? 0} days`}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClient(client._id)}
                          className="text-red-400 hover:bg-red-50 dark:hover:bg-red-800"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        title="Add New Client"
        size="xl"
      >
        <div
          style={{ maxHeight: '75vh', overflowY: 'auto', overflowX: 'hidden' }}
          className="px-2"
        >
          <ClientRegistrationForm
            onClose={() => setIsAddClientModalOpen(false)}
            onSubmit={handleCreateClient}
          />
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
        type="client"
      />

      {/* Upload Results Modal */}
      <UploadResultsReport
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        result={uploadResult}
        type="client"
      />
    </div>
  );
};

export default ClientsPage;
