
// src/pages/admin/EnquiryFormPage.tsx
import React, { useEffect, useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useStaff } from '../../hooks/useStaff';
import { useEnquiry } from '../../hooks/useEnquiry';
import { Staff } from '../../hooks/useStaff';
import { IEnquiry } from '../../hooks/useEnquiry';
import { useToast } from '../../contexts/ToastContext';

type EnquiryStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';

export const EnquiryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { addToast } = useToast();
  const [countryCode, setCountryCode] = useState('+91');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: '',
    status: 'new' as EnquiryStatus,
    assignedStaff: '',
    followUpDate: '',
    comments: '',
    interests: '',
    budget: '',
  });

  const { staff, loading: loadingStaff, error: staffError, fetchAllStaff } = useStaff();
  const { createEnquiry, updateEnquiry, getEnquiryById, error: enquiryError } = useEnquiry();

  const [submitting, setSubmitting] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEditing);

  // Fetch staff list on component mount
  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  // Type guard for staff object
  const isStaffObject = (obj: any): obj is { _id: string } => {
    return obj && typeof obj === 'object' && '_id' in obj;
  };

  // Safely extract staff ID
  const getAssignedStaffId = (assignedStaff: IEnquiry['assignedStaff']): string => {
    if (!assignedStaff) return '';
    if (typeof assignedStaff === 'string') return assignedStaff;
    if (isStaffObject(assignedStaff)) return assignedStaff._id;
    return '';
  };

  // Load enquiry data if editing
  useEffect(() => {
    const loadEnquiry = async () => {
      if (isEditing && id) {
        try {
          setLoadingForm(true);
          const enquiry = await getEnquiryById(id);
          if (enquiry) {
            let phoneVal = enquiry.phone || '';
            let codeVal = '+91';
            if (phoneVal.startsWith('+')) {
              const codes = ['+971', '+33', '+49', '+61', '+65', '+81', '+86', '+91', '+44', '+1'];
              const matchedCode = codes.find(c => phoneVal.startsWith(c));
              if (matchedCode) {
                codeVal = matchedCode;
                phoneVal = phoneVal.substring(matchedCode.length);
              }
            }
            setCountryCode(codeVal);

            setFormData({
              name: enquiry.name || '',
              phone: phoneVal,
              email: enquiry.email || '',
              source: enquiry.source || '',
              status: enquiry.status || 'new',
              assignedStaff: getAssignedStaffId(enquiry.assignedStaff),
              followUpDate: enquiry.followUpDate ? new Date(enquiry.followUpDate).toISOString().split('T')[0] : '',
              comments: enquiry.comments || '',
              interests: enquiry.interests || '',
              budget: enquiry.budget || '',
            });
          }
        } catch (error) {
          addToast('Failed to load enquiry', 'error');
        } finally {
          setLoadingForm(false);
        }
      }
    };
    loadEnquiry();
  }, [id, isEditing, getEnquiryById, addToast]);

  // Handle input changes
  const handleInputChange = (field: string, value: string | EnquiryStatus) => {
    let finalValue = value;
    if (field === 'phone' && typeof value === 'string') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormData(prev => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      addToast('Name must contain only alphabetical characters and spaces', 'error');
      return;
    }

    if (formData.phone.length !== 10) {
      addToast('Phone number must be exactly 10 digits', 'error');
      return;
    }

    if (!formData.email.trim() || !formData.source || !formData.assignedStaff || !formData.followUpDate || !formData.interests.trim() || !formData.budget.trim()) {
      addToast('Please fill in all details, including email, source, assigned staff, follow-up date, interests, and budget.', 'error');
      return;
    }

    if (!/^[a-zA-Z\s.,\-()]*$/.test(formData.interests)) {
      addToast('Areas of Interest can only contain letters, spaces, and basic punctuation (no numbers or special characters)', 'error');
      return;
    }

    const budgetNum = Number(formData.budget);
    if (isNaN(budgetNum) || budgetNum < 100 || budgetNum > 100000) {
      addToast('Budget must be a valid number between 100 and 100,000', 'error');
      return;
    }

    if (formData.comments) {
      const commentWords = formData.comments.trim().split(/\s+/).filter(Boolean).length;
      if (commentWords > 50) {
        addToast('Comments cannot exceed 50 words', 'error');
        return;
      }
      if (!/^[a-zA-Z\s.,\-()]*$/.test(formData.comments)) {
        addToast('Comments can only contain alphabetical characters, spaces, and basic punctuation (no numbers or special characters)', 'error');
        return;
      }
    }

    setSubmitting(true);

    try {
      const enquiryData = {
        ...formData,
        phone: `${countryCode}${formData.phone}`,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined,
      };

      if (isEditing && id) {
        await updateEnquiry(id, enquiryData);
        addToast('Enquiry updated successfully', 'success');
      } else {
        await createEnquiry(enquiryData);
        addToast('Enquiry created successfully', 'success');
      }
      navigate('/admin/enquiries');
    } catch (error) {
      addToast(isEditing ? 'Failed to update enquiry' : 'Failed to create enquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const staffOptions = [
    { value: '', label: 'Select Staff Member' },
    ...staff
      .filter((s) => s.status === 'active')
      .map((s: Staff) => ({
        value: s._id,
        label: s.fullName,
      })),
  ];

  if (loadingForm) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600 dark:text-gray-400">Loading enquiry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate('/admin/enquiries')} className="p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Enquiry' : 'Add New Enquiry'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditing
              ? 'Update the details of this customer enquiry'
              : 'Manually add a new customer enquiry to the system'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enquiry Details</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Enter customer name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-24 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+61">+61 (AU)</option>
                      <option value="+971">+971 (AE)</option>
                      <option value="+65">+65 (SG)</option>
                      <option value="+49">+49 (DE)</option>
                      <option value="+33">+33 (FR)</option>
                      <option value="+81">+81 (JP)</option>
                      <option value="+86">+86 (CN)</option>
                    </select>
                    <div className="flex-1">
                      <Input
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <Select
                  label="Source *"
                  options={[
                    { value: '', label: 'Select Source' },
                    { value: 'website', label: 'Website' },
                    { value: 'social-media', label: 'Social Media' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'walk-in', label: 'Walk-in' },
                    { value: 'advertisement', label: 'Advertisement' },
                    { value: 'other', label: 'Other' },
                  ]}
                  value={formData.source}
                  onChange={(value) => handleInputChange('source', value)}
                />
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Enquiry Management
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Status"
                  options={[
                    { value: 'new', label: 'New' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'interested', label: 'Interested' },
                    { value: 'converted', label: 'Converted' },
                    { value: 'lost', label: 'Lost' },
                  ]}
                  value={formData.status}
                  onChange={(value) => handleInputChange('status', value as EnquiryStatus)}
                />

                <Select
                  label="Assigned Staff *"
                  options={staffOptions}
                  value={formData.assignedStaff}
                  onChange={(value) => handleInputChange('assignedStaff', value)}
                />

                <Input
                  label="Follow-up Date *"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                />
              </div>

              {loadingStaff && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading staff...</p>
              )}
              {staffError && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  Failed to load staff: {staffError}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Areas of Interest *"
                  placeholder="e.g., Weight training, Cardio, Yoga"
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                />
                <Input
                  label="Budget Range *"
                  placeholder="e.g., $50-100/month"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments & Notes
              </label>
              <textarea
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500"
                placeholder="Add any additional notes or comments about this enquiry..."
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
              />
            </div>

            {enquiryError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                <strong>Error:</strong> {enquiryError}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/admin/enquiries')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || loadingStaff}>
                {submitting ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    {isEditing ? 'Update Enquiry' : 'Save Enquiry'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnquiryFormPage;
