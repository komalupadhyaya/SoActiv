import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Phone, Mail, Calendar, Trash2, Upload } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useEnquiry } from '../../hooks/useEnquiry';
import { useNavigate } from 'react-router-dom';
import { BulkUploadModal } from '../../components/enquiry/BulkUploadModal';
import { UploadResultsReport } from '../../components/enquiry/UploadResultsReport';
import type { BulkUploadResult } from '../../hooks/useEnquiry';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const statusColors = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  interested: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const getStaffName = (staff: any): string => {
  if (!staff) return 'Unassigned';
  if (typeof staff === 'string') return staff;
  if (typeof staff === 'object' && staff.fullName) return staff.fullName;
  return 'Unassigned';
};

export const EnquiriesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const {
    enquiries: allEnquiries,
    myEnquiries,
    loading,
    error,
    refreshEnquiries,
    deleteEnquiry,
    bulkUpload,
    isAdmin,
  } = useEnquiry();

  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { addToast } = useToast();

  const navigate = useNavigate();

  const displayedEnquiries = isAdmin ? allEnquiries : myEnquiries;

  const staffOptions = useMemo(() => {
    const staffSet = new Set<string>();
    displayedEnquiries.forEach((e) => {
      const name = getStaffName(e.assignedStaff);
      if (name !== 'Unassigned') {
        staffSet.add(name);
      }
    });
    return [
      { value: '', label: 'All Staff' },
      ...Array.from(staffSet).map((name) => ({ value: name, label: name })),
    ];
  }, [displayedEnquiries]);

  const filteredEnquiries = useMemo(() => {
    return displayedEnquiries.filter((enquiry) => {
      const matchesSearch =
        !searchQuery ||
        enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enquiry.phone.includes(searchQuery) ||
        enquiry.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !statusFilter || enquiry.status === statusFilter;
      const staffName = getStaffName(enquiry.assignedStaff);
      const matchesStaff = !staffFilter || staffName === staffFilter;
      return matchesSearch && matchesStatus && matchesStaff;
    });
  }, [displayedEnquiries, searchQuery, statusFilter, staffFilter]);

  const handleRefresh = () => {
    refreshEnquiries();
  };

  const handleBulkUpload = async (file: File) => {
    const result = await bulkUpload(file);
    if (result) {
      setUploadResult(result);
      setIsBulkUploadModalOpen(false);
      setIsResultsModalOpen(true);
    }
    return result;
  };

  if (loading && displayedEnquiries.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 dark:text-gray-400">Loading enquiries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enquiries</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isAdmin ? 'Manage all customer enquiries' : 'Manage your customer enquiries'}
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={() => setIsBulkUploadModalOpen(true)}>
            <Upload size={16} className="mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => navigate('/admin/enquiry-form')}>
            <Plus size={16} className="mr-2" />
            Add Enquiry
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm w-full">
          <strong>Error:</strong> {error}{' '}
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 w-full">
            <div className="flex-1">
              <Input
                placeholder="Search by name, contact, or email..."
                leftIcon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-xs sm:w-auto"
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Status' },
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'interested', label: 'Interested' },
                { value: 'converted', label: 'Converted' },
                { value: 'lost', label: 'Lost' },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            />
            <Select
              options={staffOptions}
              value={staffFilter}
              onChange={(value) => setStaffFilter(value)}
            />
            <Button variant="outline" onClick={handleRefresh}>
              <Filter size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAdmin ? 'All Enquiries' : 'Your Enquiries'} ({filteredEnquiries.length})
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {loading && displayedEnquiries.length > 0 ? (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">Refreshing...</p>
          ) : filteredEnquiries.length === 0 ? (
            <p className="text-center py-4 text-gray-500 dark:text-gray-400">
              No enquiries match your filters.
            </p>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden sm:block overflow-x-auto w-full">
                <table className="w-full min-w-[950px] table-auto divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assigned Staff
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Follow-up
                      </th>
                      <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEnquiries.map((enquiry) => (
                      <tr key={enquiry._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {enquiry.name}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <Phone size={12} />
                              <span>{enquiry.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <Mail size={12} />
                              <span>{enquiry.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <Badge className={statusColors[enquiry.status]}>{enquiry.status}</Badge>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {getStaffName(enquiry.assignedStaff)}
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar size={14} className="mr-1" />
                            {new Date(enquiry.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar size={14} className="mr-1" />
                            {enquiry.followUpDate
                              ? new Date(enquiry.followUpDate).toLocaleDateString()
                              : '—'}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/enquiries/edit/${enquiry._id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-50 dark:hover:text-orange-600"
                              onClick={async () => {
                                if (await confirm('Are you sure you want to delete this enquiry?', { title: 'Delete Enquiry' })) {
                                  await deleteEnquiry(enquiry._id);
                                  addToast('Enquiry deleted successfully', 'success');
                                }
                              }}
                              aria-label="Delete enquiry"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card/list view */}
              <div className="sm:hidden space-y-4">
                {filteredEnquiries.map((enquiry) => (
                  <Card key={enquiry._id}>
                    <CardContent>
                      <div className="text-lg font-semibold">{enquiry.name}</div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Phone size={14} />
                          <span>{enquiry.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Mail size={14} />
                          <span>{enquiry.email}</span>
                        </div>
                        <Badge className={statusColors[enquiry.status]}>{enquiry.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{new Date(enquiry.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>
                            {enquiry.followUpDate
                              ? new Date(enquiry.followUpDate).toLocaleDateString()
                              : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/admin/enquiries/edit/${enquiry._id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-50 dark:hover:text-orange-600"
                          onClick={async () => {
                            if (await confirm('Are you sure you want to delete this enquiry?', { title: 'Delete Enquiry' })) {
                              await deleteEnquiry(enquiry._id);
                              addToast('Enquiry deleted successfully', 'success');
                            }
                          }}
                          aria-label="Delete enquiry"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUpload={handleBulkUpload}
      />

      {uploadResult && (
        <UploadResultsReport
          isOpen={isResultsModalOpen}
          onClose={() => {
            setIsResultsModalOpen(false);
            setUploadResult(null);
          }}
          result={uploadResult}
        />
      )}

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

export default EnquiriesPage;
