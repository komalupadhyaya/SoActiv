import React, { useState, useEffect } from 'react';
import { useFollowUp } from '../../hooks/useFollowUp';
import { useStaff } from '../../hooks/useStaff';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

export const FollowUpFormPage: React.FC = () => {
  const { createFollowUp, loading } = useFollowUp();
  const { staff, fetchStaff } = useStaff();
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-fill data from navigation state (if coming from PT Expiring page, etc.)
  const prefilledData = location.state as {
    type?: 'enquiry' | 'client' | 'pt';
    relatedId?: string;
    relatedName?: string;
  } | null;

  const [formData, setFormData] = useState({
    assignedTo: '',
    type: prefilledData?.type || ('enquiry' as 'enquiry' | 'client' | 'pt'),
    relatedId: prefilledData?.relatedId || '',
    relatedName: prefilledData?.relatedName || '',
    scheduledDate: '',
    scheduledTime: '',
    note: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.assignedTo) newErrors.assignedTo = 'Please select a staff member';
    if (!formData.type) newErrors.type = 'Please select a follow-up type';
    if (!formData.relatedId) newErrors.relatedId = 'Related ID is required';
    if (!formData.relatedName) newErrors.relatedName = 'Related name is required';
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Scheduled date is required';
    if (!formData.scheduledTime) newErrors.scheduledTime = 'Scheduled time is required';
    if (!formData.note) newErrors.note = 'Note is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await createFollowUp(formData);
    if (result.success) {
      alert('Follow-up created successfully');
      navigate('/admin/follow-ups');
    } else {
      alert(`Failed to create follow-up: ${result.message}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Create Follow-Up</h1>
          <p className="text-gray-600 mt-1">Schedule a new follow-up task</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Follow-Up Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="enquiry">Enquiry</option>
            <option value="client">Client</option>
            <option value="pt">PT Package</option>
          </select>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
        </div>

        {/* Related ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="relatedId"
            value={formData.relatedId}
            onChange={handleChange}
            placeholder="Enter the ID of the enquiry/client/PT package"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.relatedId ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.relatedId && <p className="text-red-500 text-sm mt-1">{errors.relatedId}</p>}
          <p className="text-gray-500 text-xs mt-1">The MongoDB ObjectId of the related entity</p>
        </div>

        {/* Related Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Related Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="relatedName"
            value={formData.relatedName}
            onChange={handleChange}
            placeholder="Enter the name of the person/entity"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.relatedName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.relatedName && <p className="text-red-500 text-sm mt-1">{errors.relatedName}</p>}
        </div>

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign To <span className="text-red-500">*</span>
          </label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.assignedTo ? 'border-red-500' : 'border-gray-300'
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="scheduledDate"
            value={formData.scheduledDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate}</p>}
        </div>

        {/* Scheduled Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.scheduledTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.scheduledTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledTime}</p>}
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Note <span className="text-red-500">*</span>
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            rows={4}
            placeholder="Enter follow-up notes (e.g., 'Call back in 3 days')"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.note ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.note && <p className="text-red-500 text-sm mt-1">{errors.note}</p>}
          <p className="text-gray-500 text-xs mt-1">Maximum 500 characters</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {loading ? 'Creating...' : 'Create Follow-Up'}
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

