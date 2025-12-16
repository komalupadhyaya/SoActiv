import React, { useState } from 'react';
import {
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  Trash2,
  Dumbbell,
  IndianRupee,
  Upload,
  Edit,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BulkUploadModal } from '../../components/common/BulkUploadModal';
import { UploadResultsReport } from '../../components/common/UploadResultsReport';
import { useClient, type BulkUploadResult } from '../../hooks/useClient';
import { useToast } from '../../contexts/ToastContext';

// Status color classes
const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};



export const ClientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { clients, loading, bulkUpload, deleteClient } = useClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    clientId: string;
    clientName: string;
  }>({
    isOpen: false,
    clientId: '',
    clientName: '',
  });

  const { addToast } = useToast();

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.contactNumber?.includes(searchQuery) ?? false) ||
      (client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesStatus = !statusFilter || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const expiringClients = clients.filter(
    (client) => (client.remainingDays ?? 0) > 0 && (client.remainingDays ?? 0) <= 30
  );
  const expiredClients = clients.filter((client) => (client.remainingDays ?? 0) <= 0);

  const handleDeleteClient = (id: string, clientName: string) => {
    setDeleteConfirmation({
      isOpen: true,
      clientId: id,
      clientName: clientName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.clientId) return;

    await deleteClient(deleteConfirmation.clientId);
    addToast('Client deleted successfully', 'success');
    setDeleteConfirmation({ isOpen: false, clientId: '', clientName: '' });
  };

  const handleBulkUpload = async (file: File) => {
    const result = await bulkUpload(file);
    if (result) {
      setUploadResult(result);
      setIsBulkUploadModalOpen(false);
      setIsResultsModalOpen(true);

      if (result.summary.successful > 0) {
        addToast(`Successfully added ${result.summary.successful} clients`, 'success');
      }
    }
    return result;
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-2 py-3 max-w-7xl mx-auto">
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
            onClick={() => navigate('/admin/client-form')}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add New Client
          </Button>
        </div>
      </div>

      {/* Recent Activity Notification */}


      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expiring Soon */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {expiringClients.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expired */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Calendar className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {expiredClients.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'pending', label: 'Pending' }
                ]}
                placeholder="All Status"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Card Grid */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Clients ({filteredClients.length})
          </h2>
        </CardHeader>
        <CardContent className="p-4">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No clients found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => (
                <Card key={client._id} className="h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    {/* Header: Logo/Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {client.fullName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {client.gender || 'Member'}
                          </div>
                        </div>
                      </div>
                      <Badge className={statusColors[client.status as keyof typeof statusColors]}>
                        {client.status}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300 mb-3">
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-gray-400" />
                        <span>{client.contactNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail size={14} className="text-gray-400" />
                        <span>{client.email || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Membership Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>
                          {client.startDate
                            ? new Date(client.startDate).toLocaleDateString()
                            : 'N/A'}
                          {' - '}
                          {client.endDate
                            ? new Date(client.endDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        {client.plan && (
                          <>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
                              {client.plan}
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span>{client.timing || 'Flexible'}</span>
                      </div>
                    </div>

                    {/* Remaining Days & Price */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.remainingDays !== undefined ? (
                            <span
                              className={`${(client.remainingDays ?? 0) <= 0
                                ? 'text-red-600 dark:text-red-400'
                                : (client.remainingDays ?? 0) <= 30
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                                }`}
                            >
                              {(client.remainingDays ?? 0) <= 0
                                ? 'Expired'
                                : `${client.remainingDays} days left`}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </span>
                        {client.packagePrice && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <IndianRupee size={12} className="mr-1" />
                            {typeof client.packagePrice === 'number'
                              ? client.packagePrice.toFixed(2)
                              : client.packagePrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {client.hasPersonalTraining && (
                          <div className="flex items-center">
                            <Dumbbell size={12} className="mr-1 text-orange-500" />
                            <span>PT Active</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/client-form/${client._id}`)}
                          className="h-8 px-3"
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClient(client._id, client.fullName)}
                          className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <strong>{deleteConfirmation.clientName}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Delete Client
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientListPage;
