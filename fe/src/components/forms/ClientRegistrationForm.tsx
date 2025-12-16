import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { User, Phone, Mail, MapPin, UserCheck, Calendar, Dumbbell, IndianRupee } from 'lucide-react';
import { useStaff } from '../../hooks/useStaff';

interface ClientRegistrationFormProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<{ success: boolean; message?: string }>;
  initialData?: any;
}

export const ClientRegistrationForm: React.FC<ClientRegistrationFormProps> = ({ onClose, onSubmit, initialData }) => {
  const { staff, loading: staffLoading } = useStaff();

  const [formData, setFormData] = useState({
    // Personal Info
    fullName: '',
    countryCode: '+1',
    contactNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    address: '',

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',

    // Staff Assignment
    salesRep: '',
    memberManager: '',
    trainer: '',

    // Club Info
    attendanceId: '',
    clubId: '',
    gstNo: '',

    // Membership
    startDate: '',
    endDate: '',

    // New: Package & PT
    packagePrice: '',
    hasPersonalTraining: false,
    personalTrainer: '',
    personalTrainingDurationWeeks: '',
    personalTrainingPrice: '',

    // 🔥 New: Plan field
    plan: 'basic' as 'basic' | 'premium',

    // ✅ New: Timing
    timing: '', // <-- Added

    // Notifications
    notifications: {
      sms: true,
      email: true,
      push: true,
      whatsapp: true,
    },
  });

  // Populate form with initialData when editing
  useEffect(() => {
    if (initialData) {
      // Extract country code and phone number
      const contactNumber = initialData.contactNumber || '';
      let countryCode = '+1';
      let phoneNumber = contactNumber;

      if (contactNumber.startsWith('+')) {
        const match = contactNumber.match(/^(\+\d{1,3})(.*)$/);
        if (match) {
          countryCode = match[1];
          phoneNumber = match[2];
        }
      }

      setFormData({
        fullName: initialData.fullName || '',
        countryCode: countryCode,
        contactNumber: phoneNumber,
        email: initialData.email || '',
        gender: initialData.gender || '',
        dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
        address: initialData.address || '',
        emergencyContactName: initialData.emergencyContactName || '',
        emergencyContactNumber: initialData.emergencyContactNumber || '',
        emergencyContactRelation: initialData.emergencyContactRelation || '',
        salesRep: initialData.salesRep || '',
        memberManager: initialData.memberManager || '',
        trainer: initialData.trainer || '',
        attendanceId: initialData.attendanceId || '',
        clubId: initialData.clubId || '',
        gstNo: initialData.gstNo || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
        packagePrice: initialData.packagePrice?.toString() || '',
        hasPersonalTraining: initialData.hasPersonalTraining || false,
        personalTrainer: initialData.personalTrainer || '',
        personalTrainingDurationWeeks: initialData.personalTrainingDurationWeeks?.toString() || '',
        personalTrainingPrice: initialData.personalTrainingPrice?.toString() || '',
        plan: initialData.plan || 'basic',
        timing: initialData.timing || '',
        notifications: initialData.notifications || {
          sms: true,
          email: true,
          push: true,
          whatsapp: true,
        },
      });
    }
  }, [initialData]);

  // Filter staff
  const salesReps = staff
    .filter(s => s.position?.toLowerCase().includes('sales') || s.position?.toLowerCase().includes('rep'))
    .map(s => ({ value: s._id, label: s.fullName }));

  const memberManagers = staff
    .filter(s => s.position?.toLowerCase().includes('manager'))
    .map(s => ({ value: s._id, label: s.fullName }));

  const trainers = staff
    .filter(s => s.position?.toLowerCase().includes('trainer'))
    .map(s => ({ value: s._id, label: s.fullName }));

  const allStaffOptions = staff.map(s => ({ value: s._id, label: `${s.fullName} (${s.position || 'Staff'})` }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullContactNumber = formData.countryCode + formData.contactNumber;

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      contactNumber: fullContactNumber,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactNumber: formData.emergencyContactNumber,
      emergencyContactRelation: formData.emergencyContactRelation,
      salesRep: formData.salesRep,
      memberManager: formData.memberManager,
      trainer: formData.trainer,
      attendanceId: formData.attendanceId,
      clubId: formData.clubId,
      gstNo: formData.gstNo,
      startDate: formData.startDate,
      endDate: formData.endDate,
      packagePrice: parseFloat(formData.packagePrice) || 0,

      // ✅ Send plan and timing
      plan: formData.plan,
      timing: formData.timing, // <-- Included

      hasPersonalTraining: formData.hasPersonalTraining,
      ...(formData.hasPersonalTraining && {
        personalTrainer: formData.personalTrainer,
        personalTrainingDurationWeeks: parseInt(formData.personalTrainingDurationWeeks) || undefined,
        personalTrainingPrice: parseFloat(formData.personalTrainingPrice) || 0,
      }),

      notifications: formData.notifications,
    };

    const result = await onSubmit(payload);
    if (result.success) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggle = (field: string, checked: boolean) => {
    setFormData(prev => {
      let updates: any = { [field]: checked };

      // ✅ Auto-set plan to premium if PT is enabled
      if (field === 'hasPersonalTraining') {
        if (checked) {
          updates.plan = 'premium'; // Auto-upgrade
        }
        // Optional: downgrade to basic if PT is disabled
        // else {
        //   updates.plan = 'basic';
        // }
      }

      return { ...prev, ...updates };
    });
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: checked,
      },
    }));
  };

  if (staffLoading && staff.length === 0) {
    return <div className="p-6 text-center">Loading staff...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User size={18} className="mr-2" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="Enter full name"
              leftIcon={<User size={16} />}
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
            />
            <div className="flex space-x-2">
              <Select
                label="Country Code"
                options={[
                  { value: '+1', label: '+1 (US)' },
                  { value: '+44', label: '+44 (UK)' },
                  { value: '+91', label: '+91 (IN)' },
                ]}
                value={formData.countryCode}
                onChange={(value) => handleInputChange('countryCode', value)}
              />
              <Input
                label="Contact Number"
                placeholder="Phone number"
                leftIcon={<Phone size={16} />}
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                required
                className="flex-1"
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              leftIcon={<Mail size={16} />}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
            <Select
              label="Gender"
              options={[
                { value: '', label: 'Select Gender' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              value={formData.gender}
              onChange={(value) => handleInputChange('gender', value)}
            />
            <Input
              label="Date of Birth"
              type="date"
              leftIcon={<Calendar size={16} />}
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
            />
            <Input
              label="Address"
              placeholder="Enter address"
              leftIcon={<MapPin size={16} />}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCheck size={18} className="mr-2" /> Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Name"
              placeholder="Emergency contact name"
              leftIcon={<UserCheck size={16} />}
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              required
            />
            <Input
              label="Contact Number"
              placeholder="Emergency contact number"
              leftIcon={<Phone size={16} />}
              value={formData.emergencyContactNumber}
              onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
              required
            />
            <Select
              label="Relationship"
              options={[
                { value: '', label: 'Select Relationship' },
                { value: 'parent', label: 'Parent' },
                { value: 'spouse', label: 'Spouse' },
                { value: 'sibling', label: 'Sibling' },
                { value: 'friend', label: 'Friend' },
                { value: 'other', label: 'Other' },
              ]}
              value={formData.emergencyContactRelation}
              onChange={(value) => handleInputChange('emergencyContactRelation', value)}
            />
          </div>
        </div>

        {/* Staff Assignment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Staff Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Sales Rep"
              options={[{ value: '', label: 'Select Sales Rep' }, ...salesReps.length ? salesReps : allStaffOptions]}
              value={formData.salesRep}
              onChange={(value) => handleInputChange('salesRep', value)}
            />
            <Select
              label="Member Manager"
              options={[{ value: '', label: 'Select Manager' }, ...memberManagers.length ? memberManagers : allStaffOptions]}
              value={formData.memberManager}
              onChange={(value) => handleInputChange('memberManager', value)}
            />
            <Select
              label="Trainer (Optional)"
              options={[{ value: '', label: 'Select Trainer' }, ...trainers.length ? trainers : allStaffOptions]}
              value={formData.trainer}
              onChange={(value) => handleInputChange('trainer', value)}
            />
          </div>
        </div>

        {/* Club Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Club Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Attendance ID"
              placeholder="Generate or enter ID"
              value={formData.attendanceId}
              onChange={(e) => handleInputChange('attendanceId', e.target.value)}
              required
            />
            <Input
              label="Club ID"
              placeholder="Enter club ID"
              value={formData.clubId}
              onChange={(e) => handleInputChange('clubId', e.target.value)}
              required
            />
            <Input
              label="GST Number (Optional)"
              placeholder="Enter GST number"
              value={formData.gstNo}
              onChange={(e) => handleInputChange('gstNo', e.target.value)}
            />
          </div>
        </div>

        {/* Membership & Pricing */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <IndianRupee size={18} className="mr-2" /> Membership & Pricing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Package Price (Rs.)"
              type="number"
              step="0.01"
              placeholder="Enter package price"
              leftIcon={<IndianRupee size={16} />}
              value={formData.packagePrice}
              onChange={(e) => handleInputChange('packagePrice', e.target.value)}
              required
            />

            {/* 🔥 Add Personal Training Toggle */}
            <div className="flex items-center mt-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.hasPersonalTraining}
                    onChange={(e) => handleToggle('hasPersonalTraining', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full ${formData.hasPersonalTraining ? 'bg-orange-600' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${formData.hasPersonalTraining ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Personal Training
                </span>
              </label>
            </div>

            {/* Display current plan */}
            <div className="sm:col-span-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              Membership Plan: <strong className="capitalize">{formData.plan}</strong>
              {formData.hasPersonalTraining && (
                <span className="text-orange-600 dark:text-orange-400 ml-1">(Upgraded to Premium)</span>
              )}
            </div>
          </div>

          {/* Personal Training Fields (Conditional) */}
          {formData.hasPersonalTraining && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-800 space-y-4">
              <h4 className="font-medium text-orange-800 dark:text-orange-300 flex items-center">
                <Dumbbell size={16} className="mr-1" /> Personal Training Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Personal Trainer"
                  options={[{ value: '', label: 'Select Trainer' }, ...trainers]}
                  value={formData.personalTrainer}
                  onChange={(value) => handleInputChange('personalTrainer', value)}
                />
                <Input
                  label="Duration (Weeks)"
                  type="number"
                  placeholder="e.g., 12"
                  value={formData.personalTrainingDurationWeeks}
                  onChange={(e) => handleInputChange('personalTrainingDurationWeeks', e.target.value)}
                  required
                />
                <Input
                  label="PT Price (Rs.)"
                  type="number"
                  step="0.01"
                  placeholder="Enter PT price"
                  leftIcon={<IndianRupee size={16} />}
                  value={formData.personalTrainingPrice}
                  onChange={(e) => handleInputChange('personalTrainingPrice', e.target.value)}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* ✅ New: Timing Input */}
        <div className="sm:col-span-2">
          <Input
            label="Gym Timing"
            placeholder="e.g., 6:00 AM - 9:00 AM, Evening, Flexible"
            value={formData.timing}
            onChange={(e) => handleInputChange('timing', e.target.value)}
            required
          />
        </div>

        {/* Membership Period */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar size={18} className="mr-2" /> Membership Period
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              leftIcon={<Calendar size={16} />}
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              leftIcon={<Calendar size={16} />}
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(formData.notifications).map(([type, enabled]) => (
              <label key={type} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleNotificationChange(type, e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Register Client</Button>
        </div>
      </div>
    </form>
  );
};

export default ClientRegistrationForm;