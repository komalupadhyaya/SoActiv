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
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ClientRegistrationForm } from '../../components/forms/ClientRegistrationForm';
import { useClient } from '../../hooks/useClient';

// Status color classes
const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

// Recent activity type for local notifications
type LocalRecentActivity =
  | { type: 'add'; count: number }
  | { type: 'delete'; count: number }
  | null;

export const ClientsPage: React.FC = () => {
  const { clients, loading, error, createClient, deleteClient } = useClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
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
    (client) => client.remainingDays > 0 && client.remainingDays <= 30
  );
  const expiredClients = clients.filter((client) => client.remainingDays <= 0);

  const handleCreateClient = async (formData: any) => {
    const result = await createClient(formData);
    if (result.success) {
      setRecentActivity({ type: 'add', count: 1 });
      setIsAddClientModalOpen(false);

      // Auto-clear notification after 5 seconds
      setTimeout(() => setRecentActivity(null), 5000);
    } else {
      alert(result.message || 'Failed to register client');
    }
    return result;
  };

  const handleDeleteClient = async (id: string, clientName: string) => {
    await deleteClient(id, clientName);
    setRecentActivity((prev) => {
      if (prev?.type === 'delete') return { ...prev, count: prev.count + 1 };
      return { type: 'delete', count: 1 };
    });

    // Auto-clear notification after 5 seconds
    setTimeout(() => setRecentActivity(null), 5000);
  };

  if (loading && clients.length === 0) {
    return <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading clients...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg mx-4 mt-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your gym clients and their memberships
          </p>
        </div>
        <Button
          onClick={() => setIsAddClientModalOpen(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2"
        >
          <Plus size={16} />
          Add New Client
        </Button>
      </div>

      {/* Notifications: Add/Delete + Expiry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New Client Added Notification */}
        {recentActivity?.type === 'add' && (
          <Card className="border-l-4 border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600">
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

        {/* Client Deleted Notification */}
        {recentActivity?.type === 'delete' && (
          <Card className="border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600">
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

        {/* Membership Expiring Soon */}
        {expiringClients.length > 0 && !recentActivity && (
          <Card className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-600">
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

        {/* Expired Memberships */}
        {expiredClients.length > 0 && !recentActivity && (
          <Card className="border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600">
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
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or email..."
                leftIcon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[20rem]"
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

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Clients ({filteredClients.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Membership Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Package / PT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Remaining Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {client.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {client.gender}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Phone size={12} className="mr-1" />
                          {client.contactNumber}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Mail size={12} className="mr-1" />
                          {client.email}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar size={12} className="mr-1" />
                          {client.startDate
                            ? new Date(client.startDate).toLocaleDateString()
                            : 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar size={12} className="mr-1" />
                          {client.endDate
                            ? new Date(client.endDate).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center">
                          <IndianRupee size={14} className="text-gray-500 mr-1" />
                          <strong>{(typeof client.packagePrice === 'number' ? client.packagePrice : 0).toFixed(2)}</strong>
                        </div>
                        {client.hasPersonalTraining && (
                          <div className="flex items-center mt-1 text-orange-600 dark:text-orange-400 text-xs">
                            <Dumbbell size={12} className="mr-1" />
                            PT: ₹{typeof client.personalTrainingPrice === 'number' ? client.personalTrainingPrice.toFixed(2) : '0'} for{' '}
                            {client.personalTrainingDurationWeeks} wk
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${
                          client.remainingDays <= 0
                            ? 'text-red-600 dark:text-red-400'
                            : client.remainingDays <= 30
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {client.remainingDays <= 0 ? 'Expired' : `${client.remainingDays} days`}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusColors[client.status]}>{client.status}</Badge>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClient(client._id, client.fullName)}
                          className="text-red-400 hover:bg-red-50 dark:hover:bg-red-800"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No clients match your search criteria.
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
    </div>
  );
};

export default ClientsPage;