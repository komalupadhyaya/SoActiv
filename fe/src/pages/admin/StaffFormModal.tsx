import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { StaffFormData, validateStaffForm } from './StaffValidation';
import { useToast } from '../../contexts/ToastContext';

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: StaffFormData) => void;
    initialData?: StaffFormData;
    isSubmitting: boolean;
}

// Helper: Convert any date input to YYYY-MM-DD
const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isSubmitting,
}) => {
    const { isToastVisible } = useToast();
    const [formData, setFormData] = useState<StaffFormData>({
        fullName: '',
        position: '',
        email: '',
        contactNumber: '',
        joiningDate: '',
        salary: '',
        status: 'active',
        notifications: {
            sms: true,
            email: true,
            push: true,
            whatsapp: true,
        },
    });

    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    joiningDate: formatDateForInput(initialData.joiningDate),
                });
            } else {
                // Reset form for new staff
                setFormData({
                    fullName: '',
                    position: '',
                    email: '',
                    contactNumber: '',
                    joiningDate: '',
                    salary: '',
                    status: 'active',
                    notifications: {
                        sms: true,
                        email: true,
                        push: true,
                        whatsapp: true,
                    },
                });
            }
            setValidationError(null);
        }
    }, [isOpen, initialData]);

    const handleInputChange = (
        field: keyof StaffFormData,
        value: string | number | boolean
    ) => {
        let finalValue = value;
        if (field === 'contactNumber' && typeof value === 'string') {
            finalValue = value.replace(/\D/g, '').slice(0, 10);
        } else if (field === 'fullName' && typeof value === 'string') {
            finalValue = value.replace(/[^a-zA-Z\s]/g, '');
        }
        setFormData((prev) => ({
            ...prev,
            [field]: finalValue,
        }));
        // Clear error when user types
        if (validationError) setValidationError(null);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateStaffForm(formData);
        if (error) {
            setValidationError(error);
            return;
        }
        onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit Staff Member' : 'Add New Staff Member'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
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

                            <Select
                                label="Position"
                                options={[
                                    { value: '', label: 'Select Position' },
                                    { value: 'manager', label: 'Manager' },
                                    { value: 'receptionist', label: 'Receptionist' },
                                    { value: 'cleaner', label: 'Cleaner' },
                                    { value: 'sales', label: 'Sales' },
                                    { value: 'maintenance', label: 'Maintenance' },
                                    { value: 'trainer', label: 'Trainer' },
                                    { value: 'other', label: 'Other' },
                                ]}
                                value={formData.position}
                                onChange={(value) => handleInputChange('position', value)}
                            />

                            <Input
                                label="Email"
                                type="email"
                                placeholder="Enter email address"
                                leftIcon={<Mail size={16} />}
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                                disabled={!!initialData} // Disable email in edit mode
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
                            />
                        </div>
                    </div>

                    {/* Notification Preferences */}
                    <div>
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
                    </div>
                </div>

                {/* Validation Error Message */}
                {validationError && (
                    <div className="px-1 pb-4 text-sm text-red-600 dark:text-red-400 font-medium">
                        {validationError}
                    </div>
                )}

                {/* Sticky Footer */}
                <div className="shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || isToastVisible}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isToastVisible}>
                            {isSubmitting ? 'Saving...' : initialData ? 'Update Staff' : 'Register Staff'}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
