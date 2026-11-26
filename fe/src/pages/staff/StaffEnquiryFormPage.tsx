import React, { useEffect, useState, useMemo } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useStaff, Staff } from '../../hooks/useStaff';
import { useEnquiry, IEnquiry } from '../../hooks/useEnquiry';
import { useGymClass } from '../../hooks/useGymClass';
import { useToast } from '../../contexts/ToastContext';

type EnquiryStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDateTimeMin = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    min: getLocalDateString(firstDay),
    max: getLocalDateString(lastDay),
  };
};

export const StaffEnquiryFormPage: React.FC = () => {
  const currentMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { addToast } = useToast();
  const [countryCode, setCountryCode] = useState('+91');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    enquiryDate: getLocalDateString(),
    serviceName: '',
    source: 'Walk-in',
    enquiryType: 'Walk-in',
    trialType: 'no-trial',
    trialDateTime: '',
    trialService: '',
    trialStaff: '',
    trialClassDate: getLocalDateString(),
    trialClass: '',
    trialSessionDate: getLocalDateString(),
    trialSession: '',
    status: 'new' as EnquiryStatus,
    assignedStaff: '',
    followUpDate: '',
    followUpDateTime: '',
    callTag: '' as 'cold' | 'warm' | 'hot' | '',
    followUpMessage: '',
    comments: '',
    interests: '',
    budget: '',
  });

  const { staff, loading: loadingStaff, fetchAllStaff } = useStaff();
  const { classes: gymClasses, fetchClasses, sessions, fetchUpcomingSessions } = useGymClass();
  const { createEnquiry, updateEnquiry, getEnquiryById, error: enquiryError } = useEnquiry();

  const [submitting, setSubmitting] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEditing);

  // Fetch staff list & classes on component mount
  useEffect(() => {
    fetchAllStaff();
    fetchClasses();
    if (fetchUpcomingSessions) {
      fetchUpcomingSessions();
    }
  }, [fetchAllStaff, fetchClasses, fetchUpcomingSessions]);

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
              gender: enquiry.gender || '',
              enquiryDate: enquiry.enquiryDate ? new Date(enquiry.enquiryDate).toISOString().split('T')[0] : getLocalDateString(),
              serviceName: enquiry.serviceName || '',
              source: enquiry.source || '',
              enquiryType: enquiry.enquiryType || '',
              trialType: enquiry.trialType || 'no-trial',
              trialDateTime: enquiry.trialDateTime ? new Date(enquiry.trialDateTime).toISOString().slice(0, 16) : '',
              trialService: enquiry.trialService || '',
              trialStaff: typeof enquiry.trialStaff === 'object' && enquiry.trialStaff ? (enquiry.trialStaff as any)._id : (enquiry.trialStaff || ''),
              trialClassDate: enquiry.trialClassDate ? new Date(enquiry.trialClassDate).toISOString().split('T')[0] : getLocalDateString(),
              trialClass: enquiry.trialClass || '',
              trialSessionDate: enquiry.trialSessionDate ? new Date(enquiry.trialSessionDate).toISOString().split('T')[0] : getLocalDateString(),
              trialSession: enquiry.trialSession || '',
              status: enquiry.status || 'new',
              assignedStaff: getAssignedStaffId(enquiry.assignedStaff),
              followUpDate: enquiry.followUpDate ? new Date(enquiry.followUpDate).toISOString().split('T')[0] : '',
              followUpDateTime: enquiry.followUpDateTime ? new Date(enquiry.followUpDateTime).toISOString().slice(0, 16) : (enquiry.followUpDate ? new Date(enquiry.followUpDate).toISOString().slice(0, 16) : ''),
              callTag: enquiry.callTag || '',
              followUpMessage: enquiry.followUpMessage || '',
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
    if (field === 'budget' && typeof value === 'string') {
      finalValue = value.replace(/\D/g, '');
    }
    setFormData((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      addToast('Customer name is required', 'error');
      return;
    }

    if (!formData.phone.trim()) {
      addToast('Phone number is required', 'error');
      return;
    }

    if (formData.phone.replace(/\D/g, '').length < 7) {
      addToast('Phone number must be at least 7 digits', 'error');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      addToast('Please enter a valid email address', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const enquiryData = {
        ...formData,
        gender: (formData.gender as 'male' | 'female' | 'other') || undefined,
        phone: `${countryCode}${formData.phone}`,
        enquiryDate: formData.enquiryDate ? new Date(formData.enquiryDate).toISOString() : new Date().toISOString(),
        trialDateTime: formData.trialType === 'trial-appointment' && formData.trialDateTime ? new Date(formData.trialDateTime).toISOString() : undefined,
        trialService: formData.trialType === 'trial-appointment' ? formData.trialService : undefined,
        trialStaff: formData.trialType === 'trial-appointment' && formData.trialStaff ? formData.trialStaff : undefined,
        trialClassDate: formData.trialType === 'trial-class' && formData.trialClassDate ? new Date(formData.trialClassDate).toISOString() : undefined,
        trialClass: formData.trialType === 'trial-class' ? formData.trialClass : undefined,
        trialSessionDate: formData.trialType === 'trial-session' && formData.trialSessionDate ? new Date(formData.trialSessionDate).toISOString() : undefined,
        trialSession: formData.trialType === 'trial-session' ? formData.trialSession : undefined,
        followUpDateTime: formData.followUpDateTime ? new Date(formData.followUpDateTime).toISOString() : undefined,
        followUpDate: formData.followUpDateTime ? new Date(formData.followUpDateTime).toISOString() : (formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined),
        callTag: (formData.callTag as 'cold' | 'warm' | 'hot') || undefined,
        followUpMessage: formData.followUpMessage || undefined,
      };

      if (isEditing && id) {
        const updated = await updateEnquiry(id, enquiryData);
        if (!updated) return;
      } else {
        const created = await createEnquiry(enquiryData);
        if (!created) return;
      }
      navigate('/staff/enquiries');
    } catch (error) {
      addToast(isEditing ? 'Failed to update enquiry' : 'Failed to create enquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter staff list to only show active Sales representatives
  const staffOptions = [
    { value: '', label: 'Select' },
    ...staff
      .filter((s) => s.status === 'active' && s.position === 'sales')
      .map((s: Staff) => ({
        value: s._id,
        label: s.fullName,
      })),
  ];

  const classOptions = useMemo(() => {
    const active = (gymClasses || []).filter((c) => c.status === 'active');
    if (active.length > 0) {
      return [
        { value: '', label: 'Select Class' },
        ...active.map((c) => ({
          value: c.name,
          label: `${c.name}${c.time ? ` (${c.time})` : ''}`,
        })),
      ];
    }
    return [
      { value: '', label: 'Select Class' },
      { value: 'Yoga', label: 'Yoga' },
      { value: 'Zumba', label: 'Zumba' },
      { value: 'CrossFit', label: 'CrossFit' },
      { value: 'HIIT', label: 'HIIT' },
      { value: 'Pilates', label: 'Pilates' },
      { value: 'Spinning', label: 'Spinning' },
      { value: 'Cardio & Strength', label: 'Cardio & Strength' },
    ];
  }, [gymClasses]);

  const sessionOptions = useMemo(() => {
    const validSessions = (sessions || []).filter((s) => s.status !== 'cancelled');
    if (validSessions.length > 0) {
      return [
        { value: '', label: 'Select Session' },
        ...validSessions.map((s) => {
          const className = typeof s.classId === 'object' && s.classId ? (s.classId as any).name : 'Class';
          return {
            value: s._id || `${className} (${s.time})`,
            label: `${className} - ${s.time}`,
          };
        }),
      ];
    }
    return [
      { value: '', label: 'Select Session' },
      { value: 'Morning Session (06:00 AM - 07:00 AM)', label: 'Morning Session (06:00 AM - 07:00 AM)' },
      { value: 'Morning Session (07:00 AM - 08:00 AM)', label: 'Morning Session (07:00 AM - 08:00 AM)' },
      { value: 'Morning Session (08:00 AM - 09:00 AM)', label: 'Morning Session (08:00 AM - 09:00 AM)' },
      { value: 'Evening Session (05:00 PM - 06:00 PM)', label: 'Evening Session (05:00 PM - 06:00 PM)' },
      { value: 'Evening Session (06:00 PM - 07:00 PM)', label: 'Evening Session (06:00 PM - 07:00 PM)' },
      { value: 'Evening Session (07:00 PM - 08:00 PM)', label: 'Evening Session (07:00 PM - 08:00 PM)' },
      { value: 'Evening Session (08:00 PM - 09:00 PM)', label: 'Evening Session (08:00 PM - 09:00 PM)' },
    ];
  }, [sessions]);

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
        <Button variant="ghost" onClick={() => navigate('/staff/enquiries')} className="p-2">
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
                Personal Details
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
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gender
                  </label>
                  <div className="flex items-center space-x-6 h-10">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={() => handleInputChange('gender', 'male')}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Male</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={() => handleInputChange('gender', 'female')}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Female</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Lead Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Enquiry Date *"
                  type="date"
                  value={formData.enquiryDate}
                  onChange={(e) => handleInputChange('enquiryDate', e.target.value)}
                  min={currentMonthRange.min}
                  max={currentMonthRange.max}
                  required
                />
                <Select
                  label="Service Name *"
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'CLUB MEMBERSHIP', label: 'CLUB MEMBERSHIP' },
                    { value: 'Gym Membership', label: 'Gym Membership' },
                    { value: 'Diet', label: 'Diet' },
                    { value: 'Freezing', label: 'Freezing' },
                    { value: 'Group Workout', label: 'Group Workout' },
                    { value: 'happy hours', label: 'happy hours' },
                    { value: 'Personal Session', label: 'Personal Session' },
                    { value: 'Transfer Fee', label: 'Transfer Fee' },
                  ]}
                  value={formData.serviceName}
                  onChange={(value) => handleInputChange('serviceName', value)}
                />
                <Select
                  label="Lead source"
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'Aktivity', label: 'Aktivity' },
                    { value: 'Corporate', label: 'Corporate' },
                    { value: 'e-mail', label: 'e-mail' },
                    { value: 'Facebook', label: 'Facebook' },
                    { value: 'Flyers/Banners', label: 'Flyers/Banners' },
                    { value: 'Google', label: 'Google' },
                    { value: 'Hoardings', label: 'Hoardings' },
                    { value: 'Justdial', label: 'Justdial' },
                    { value: 'Listing sites', label: 'Listing sites' },
                    { value: 'Magazine', label: 'Magazine' },
                    { value: 'Member App', label: 'Member App' },
                    { value: 'Missed call app', label: 'Missed call app' },
                    { value: 'Newspapers', label: 'Newspapers' },
                    { value: 'Others', label: 'Others' },
                    { value: 'Passing By', label: 'Passing By' },
                    { value: 'Phone', label: 'Phone' },
                    { value: 'Posters', label: 'Posters' },
                    { value: 'Promotional consultant', label: 'Promotional consultant' },
                    { value: 'Radio', label: 'Radio' },
                    { value: 'Referral', label: 'Referral' },
                    { value: 'Signboard', label: 'Signboard' },
                    { value: 'SMS', label: 'SMS' },
                    { value: 'Social media', label: 'Social media' },
                    { value: 'Staff', label: 'Staff' },
                    { value: 'TV', label: 'TV' },
                    { value: 'Walk-in', label: 'Walk-in' },
                    { value: 'Website', label: 'Website' },
                    { value: 'Word of mouth', label: 'Word of mouth' },
                    { value: 'SoActiv', label: 'SoActiv' },
                  ]}
                  value={formData.source}
                  onChange={(value) => handleInputChange('source', value)}
                />
                <Select
                  label="Enquiry Type"
                  options={[
                    { value: '', label: 'Select' },
                    { value: 'Walk-in', label: 'Walk-in' },
                    { value: 'Phone', label: 'Phone' },
                    { value: 'e-mail', label: 'e-mail' },
                    { value: 'Social media', label: 'Social media' },
                    { value: 'Website', label: 'Website' },
                  ]}
                  value={formData.enquiryType}
                  onChange={(value) => handleInputChange('enquiryType', value)}
                />
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Schedule a trial / meeting
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="trialType"
                    value="no-trial"
                    checked={formData.trialType === 'no-trial'}
                    onChange={() => handleInputChange('trialType', 'no-trial')}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    No Trial
                  </span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="trialType"
                    value="trial-appointment"
                    checked={formData.trialType === 'trial-appointment'}
                    onChange={() => handleInputChange('trialType', 'trial-appointment')}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trial Appointment
                  </span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="trialType"
                    value="trial-class"
                    checked={formData.trialType === 'trial-class'}
                    onChange={() => handleInputChange('trialType', 'trial-class')}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trial Class
                  </span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="trialType"
                    value="trial-session"
                    checked={formData.trialType === 'trial-session'}
                    onChange={() => handleInputChange('trialType', 'trial-session')}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trial Session
                  </span>
                </label>
              </div>

              {formData.trialType === 'trial-appointment' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Date & Time *"
                    type="datetime-local"
                    value={formData.trialDateTime}
                    onChange={(e) => handleInputChange('trialDateTime', e.target.value)}
                    min={getLocalDateTimeMin()}
                    required
                  />
                  <Select
                    label="Service *"
                    options={[
                      { value: '', label: 'Select' },
                      { value: 'CLUB MEMBERSHIP', label: 'CLUB MEMBERSHIP' },
                      { value: 'Gym Membership', label: 'Gym Membership' },
                      { value: 'Diet', label: 'Diet' },
                      { value: 'Freezing', label: 'Freezing' },
                      { value: 'Group Workout', label: 'Group Workout' },
                      { value: 'happy hours', label: 'happy hours' },
                      { value: 'Personal Session', label: 'Personal Session' },
                      { value: 'Transfer Fee', label: 'Transfer Fee' },
                    ]}
                    value={formData.trialService}
                    onChange={(value) => handleInputChange('trialService', value)}
                    required
                  />
                  <Select
                    label="Staff Name *"
                    options={staffOptions}
                    value={formData.trialStaff}
                    onChange={(value) => handleInputChange('trialStaff', value)}
                    required
                  />
                </div>
              )}

              {formData.trialType === 'trial-class' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date *"
                    type="date"
                    value={formData.trialClassDate}
                    onChange={(e) => handleInputChange('trialClassDate', e.target.value)}
                    min={getLocalDateString()}
                    required
                  />
                  <Select
                    label="Class *"
                    options={classOptions}
                    value={formData.trialClass}
                    onChange={(value) => handleInputChange('trialClass', value)}
                    required
                  />
                </div>
              )}

              {formData.trialType === 'trial-session' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Date *"
                    type="date"
                    value={formData.trialSessionDate}
                    onChange={(e) => handleInputChange('trialSessionDate', e.target.value)}
                    min={getLocalDateString()}
                    required
                  />
                  <Select
                    label="Session *"
                    options={sessionOptions}
                    value={formData.trialSession}
                    onChange={(value) => handleInputChange('trialSession', value)}
                    required
                  />
                </div>
              )}
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                Schedule enquiry follow-up
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Staff Name"
                  options={staffOptions}
                  value={formData.assignedStaff}
                  onChange={(value) => handleInputChange('assignedStaff', value)}
                />
                <Input
                  label="Date & Time"
                  type="datetime-local"
                  value={formData.followUpDateTime}
                  onChange={(e) => handleInputChange('followUpDateTime', e.target.value)}
                  min={getLocalDateTimeMin()}
                />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Call Tag
                  </label>
                  <div className="flex items-center space-x-6 h-10">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="callTag"
                        value="cold"
                        checked={formData.callTag === 'cold'}
                        onChange={() => handleInputChange('callTag', 'cold')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded border border-blue-600 text-blue-600 font-medium text-sm">
                        Cold
                      </span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="callTag"
                        value="warm"
                        checked={formData.callTag === 'warm'}
                        onChange={() => handleInputChange('callTag', 'warm')}
                        className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded border border-amber-500 text-amber-500 font-medium text-sm">
                        Warm
                      </span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="callTag"
                        value="hot"
                        checked={formData.callTag === 'hot'}
                        onChange={() => handleInputChange('callTag', 'hot')}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded border border-red-600 text-red-600 font-medium text-sm">
                        Hot
                      </span>
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    maxLength={250}
                    placeholder="Maximum 250 characters"
                    value={formData.followUpMessage}
                    onChange={(e) => handleInputChange('followUpMessage', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {formData.followUpMessage.length}/250
                  </p>
                </div>
              </div>
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
                onClick={() => navigate('/staff/enquiries')}
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
                    {isEditing ? 'Update Lead' : 'Log Lead'}
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

export default StaffEnquiryFormPage;
