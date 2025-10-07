// components/forms/StaffRegistrationForm.tsx
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { User, Mail, Phone, Calendar } from 'lucide-react';

interface StaffFormData {
  fullName: string;
  position: string;
  email: string;
  contactNumber: string;
  joiningDate: string; // Must be YYYY-MM-DD for input[type="date"]
  salary: number | string;
  status: 'active' | 'inactive';
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
}

interface StaffRegistrationFormProps {
  onClose: () => void;
  onSubmit: (data: Omit<StaffFormData, 'userId'>) => void;
  initialData?: Omit<StaffFormData, 'userId'>;
}

// Helper: Convert any date input to YYYY-MM-DD
const formatDateForInput = (date: string | Date | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // Extract 'YYYY-MM-DD'
};

export const StaffRegistrationForm: React.FC<StaffRegistrationFormProps> = ({
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<StaffFormData>({
    fullName: initialData?.fullName || '',
    position: initialData?.position || '',
    email: initialData?.email || '',
    contactNumber: initialData?.contactNumber || '',
    joiningDate: formatDateForInput(initialData?.joiningDate), // ✅ Fixed: Properly format date
    salary: initialData?.salary || '',
    status: initialData?.status || 'active',
    notifications: initialData?.notifications || {
      sms: true,
      email: true,
      push: true,
      whatsapp: true,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      salary: Number(formData.salary),
    };

    onSubmit(payload);
  };

  const handleInputChange = (field: keyof StaffFormData, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: checked,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-6">
        {/* Staff Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Staff Information
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

            <Input
              label="Position"
              placeholder="e.g., Trainer, Manager, Receptionist"
              leftIcon={<User size={16} />}
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter email address"
              leftIcon={<Mail size={16} />}
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />

            <Input
              label="Contact Number"
              type="tel"
              placeholder="Enter phone number"
              leftIcon={<Phone size={16} />}
              value={formData.contactNumber}
              onChange={(e) => handleInputChange('contactNumber', e.target.value)}
              required
            />

            <Input
              label="Joining Date"
              type="date"
              leftIcon={<Calendar size={16} />}
              value={formData.joiningDate}
              onChange={(e) => handleInputChange('joiningDate', e.target.value)}
              required
            />

            <Input
              label="Salary (₹)"
              type="number"
              placeholder="Enter monthly salary"
              leftIcon="₹"
              value={formData.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              required
              min="0"
            />

            <Select
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(value) => handleInputChange('status', value as 'active' | 'inactive')}
              // required
            />
          </div>
        </div>

        {/* Notification Preferences */}
        {/* <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notification Preferences
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(formData.notifications).map(([type, enabled]) => (
              <label key={type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleNotificationChange(type, e.target.checked)}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div> */}
      </div>

      {/* Sticky Footer */}
      <div className="shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? 'Update Staff' : 'Register Staff'}
          </Button>
        </div>
      </div>
    </form>
  );
};