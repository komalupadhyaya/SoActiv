import React, { useState, useEffect } from 'react';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useStaff } from '../../hooks/useStaff';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 1. New imports + hooks
import { useEnquiry } from '../../hooks/useEnquiry';
import { useClient } from '../../hooks/useClient';
// usePTExpiry imported below
import { usePTExpiry } from '../../hooks/usePTExpiry';

export const FollowUpFormPage: React.FC = () => {
  const { createFollowUp, updateFollowUp, followUps, fetchFollowUps, loading } = useFollowUp();
  const { staff, fetchAllStaff } = useStaff();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = !!id;

  // 1. New Hooks (adapted to match requirements)
  const { enquiries, refreshEnquiries: fetchAllEnquiries } = useEnquiry();
  const { clients, refresh: fetchAllClients } = useClient();
  // Assumed hook based on requirements
  const { expiringPT, fetchExpiringPT } = usePTExpiry();

  // Pre-fill data from navigation state (if coming from PT Expiring page, etc.)
  const prefilledData = location.state as {
    type?: 'enquiry' | 'client' | 'pt';
    relatedId?: string;
    relatedName?: string;
  } | null;

  const [formData, setFormData] = useState({
    assignedTo: '',
    type: prefilledData?.type || ('enquiry' as 'enquiry' | 'client' | 'pt' | 'other'),
    relatedId: prefilledData?.relatedId || '',
    relatedName: prefilledData?.relatedName || '',
    scheduledDate: '',
    scheduledTime: '',
    note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  useEffect(() => {
    if (isEditMode) {
      if (followUps.length === 0) {
        fetchFollowUps();
      }
    }
  }, [isEditMode, followUps.length, fetchFollowUps]);

  useEffect(() => {
    if (isEditMode && id && followUps.length > 0) {
      const f = followUps.find((item) => item._id === id);
      if (f) {
        setFormData({
          assignedTo: f.assignedTo?._id || '',
          type: f.type || 'enquiry',
          relatedId: f.relatedId || '',
          relatedName: f.relatedName || '',
          scheduledDate: f.scheduledDate ? new Date(f.scheduledDate).toISOString().split('T')[0] : '',
          scheduledTime: f.scheduledTime || '',
          note: f.note || '',
        });
      }
    }
  }, [isEditMode, id, followUps]);

  // 2. New useEffect for type-based fetching
  useEffect(() => {
    if (formData.type === 'enquiry') {
      fetchAllEnquiries();
    } else if (formData.type === 'client') {
      fetchAllClients();
    } else if (formData.type === 'pt') {
      // Use fetchExpiringPT since that's what we have
      if (typeof fetchExpiringPT === 'function') {
        fetchExpiringPT(30); // Fetch next 30 days by default
      }
    }
  }, [formData.type, fetchAllEnquiries, fetchAllClients, fetchExpiringPT]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 3. handleTypeChange function
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'enquiry' | 'client' | 'pt' | 'other';

    setFormData((prev) => ({
      ...prev,
      type: newType,
      relatedId: '',
      relatedName: '' // Reset related fields when type changes
    }));

    // Clear type error
    if (errors.type) {
      setErrors((prev) => ({ ...prev, type: '' }));
    }
  };

  // Helper to filter/map options
  const getRelatedOptions = () => {
    switch (formData.type) {
      case 'enquiry':
        return enquiries.map((e: any) => ({
          id: e._id,
          label: e.name || e.fullName || 'Unknown Enquiry' // Adapting to possible name fields
        }));
      case 'client':
        return clients.map((c: any) => ({
          id: c._id,
          label: c.fullName || c.name || 'Unknown Client'
        }));
      case 'pt':
        return (expiringPT?.ptPackages || []).map((p: any) => ({
          id: p._id,
          label: p.packageName || p.fullName || 'Unknown Package'
        }));
      default:
        return [];
    }
  };

  // Handler for the single "Related To" dropdown
  const handleRelatedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const options = getRelatedOptions();
    const selectedItem = options.find((opt: any) => opt.id === selectedId);

    setFormData((prev) => ({
      ...prev,
      relatedId: selectedId,
      relatedName: selectedItem ? selectedItem.label : ''
    }));

    if (errors.relatedId) {
      setErrors((prev) => ({ ...prev, relatedId: '', relatedName: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.assignedTo) newErrors.assignedTo = 'Please select a staff member';
    if (!formData.type) newErrors.type = 'Please select a follow-up type';
    if (!formData.relatedId && formData.type !== 'other') newErrors.relatedId = 'Related entity is required';
    if (!formData.relatedName) newErrors.relatedName = 'Related name is required';
    const todayStr = getLocalDateString();
    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'Scheduled date is required';
    } else if (!isEditMode && formData.scheduledDate < todayStr) {
      newErrors.scheduledDate = 'Scheduled date cannot be in the past';
    }
    if (!formData.scheduledTime) newErrors.scheduledTime = 'Scheduled time is required';
    if (!formData.note) {
      newErrors.note = 'Note is required';
    } else {
      const wordCount = formData.note.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 50) {
        newErrors.note = 'Note cannot exceed 50 words';
      } else if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(formData.note)) {
        newErrors.note = 'Note can only contain letters, numbers, spaces, and basic punctuation';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    const submissionData = {
      ...formData,
      relatedId: formData.type === 'other' ? formData.assignedTo : formData.relatedId
    };

    const result = isEditMode && id
      ? await updateFollowUp(id, submissionData as any)
      : await createFollowUp(submissionData as any);

    if (result.success) {
      navigate('/admin/follow-ups');
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Follow-Up' : 'Create Follow-Up'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditMode ? 'Modify an existing follow-up task' : 'Schedule a new follow-up task'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 space-y-6 shadow dark:bg-gray-900 dark:shadow-white">
        {/* Type */}
        <div>
          <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
            Follow-Up Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleTypeChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="enquiry">Enquiry</option>
            <option value="client">Client</option>
            <option value="pt">PT Package</option>
            <option value="other">General / Cleaning Task</option>
          </select>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
        </div>

        {/* 4. Single "Related To" dropdown replacing 2 inputs */}
        {formData.type === 'other' ? (
          <div>
            <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
              Task Location / Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="relatedName"
              value={formData.relatedName}
              onChange={handleChange}
              placeholder="e.g. Clean Locker Room B, Mopping Cardio Zone"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.relatedName ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.relatedName && <p className="text-red-500 text-sm mt-1">{errors.relatedName}</p>}
            <p className="text-gray-500 text-xs mt-1">Specify where or what general/cleaning task needs to be performed</p>
          </div>
        ) : (
          <div>
            <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
              Related {formData.type === 'pt' ? 'Package' : formData.type ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1) : 'Entity'} <span className="text-red-500">*</span>
            </label>
            <select
              name="relatedId"
              value={formData.relatedId}
              onChange={handleRelatedChange}
              disabled={!formData.type}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.relatedId ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Select {formData.type === 'pt' ? 'Package' : formData.type}</option>
              {getRelatedOptions().map((opt: any) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.relatedId && <p className="text-red-500 text-sm mt-1">{errors.relatedId}</p>}
            <p className="text-gray-500 text-xs mt-1">Select the person or package this follow-up is regarding</p>
          </div>
        )}

        {/* Assigned To */}
        <div>
          <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
            Assign To <span className="text-red-500">*</span>
          </label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.assignedTo ? 'border-red-500' : 'border-gray-300'
              }`}
          >
            <option value="">Select a staff member</option>
            {staff.map((s) => (
              <option key={s._id} value={s._id}>
                {s.fullName} - {s.position}
              </option>
            ))}
          </select>
          {errors.assignedTo && <p className="text-red-500 text-sm mt-1">{errors.assignedTo}</p>}
        </div>

        {/* Scheduled Date */}
        <div>
          <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
            Scheduled Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            min={getLocalDateString()}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate}</p>}
        </div>

        {/* Scheduled Time */}
        <div>
          <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
            Scheduled Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.scheduledTime ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.scheduledTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledTime}</p>}
        </div>

        {/* Note */}
        <div>
          <label className=" dark:text-white block text-sm font-medium text-gray-700 mb-2">
            Note <span className="text-red-500">*</span>
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={4}
            placeholder="Enter follow-up notes (e.g., 'Call back in 3 days')"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.note ? 'border-red-500' : 'border-gray-300'
              }`}
          />
          {errors.note && <p className="text-red-500 text-sm mt-1">{errors.note}</p>}
          <p className="text-gray-300 text-xs mt-1">Maximum 50 words</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
