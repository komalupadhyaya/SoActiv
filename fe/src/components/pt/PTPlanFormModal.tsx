import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PTPlan } from '../../hooks/usePT';

interface PTPlanFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<PTPlan, '_id' | 'isActive' | 'createdAt'>) => Promise<void | boolean>;
    initialData?: PTPlan;
    isSubmitting: boolean;
}

export const PTPlanFormModal: React.FC<PTPlanFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    isSubmitting
}) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        totalSessions: 10,
        validityDays: 30,
        price: 0
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                totalSessions: initialData.totalSessions,
                validityDays: initialData.validityDays,
                price: initialData.price
            });
        } else {
            setFormData({
                name: '',
                description: '',
                totalSessions: 10,
                validityDays: 30,
                price: 0
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const formErrors: Record<string, string> = {};
        const { totalSessions, validityDays, price } = formData;
        const nameTrimmed = formData.name.trim();
        if (!nameTrimmed) {
            formErrors.name = 'Plan name is required';
        } else if (!/^[a-zA-Z0-9\s]+$/.test(nameTrimmed)) {
            formErrors.name = 'Plan name can only contain letters, numbers, and spaces (no special characters)';
        }

        const sessions = parseInt(totalSessions as any);
        if (totalSessions === '' || isNaN(sessions) || sessions < 1 || sessions > 500) {
            formErrors.totalSessions = 'Total sessions must be between 1 and 500';
        }
        const validity = parseInt(validityDays as any);
        if (validityDays === '' || isNaN(validity) || validity < 1 || validity > 365) {
            formErrors.validityDays = 'Validity must be between 1 and 365 days';
        }
        const p = parseFloat(price as any);
        if (price === '' || isNaN(p) || p < 1 || p > 100000) {
            formErrors.price = 'Price must be between 1 and 100,000';
        }

        const descTrimmed = formData.description.trim();
        if (descTrimmed) {
            const wordCount = descTrimmed.split(/\s+/).filter(Boolean).length;
            if (wordCount > 50) {
                formErrors.description = 'Description cannot exceed 50 words';
            } else if (!/^[a-zA-Z0-9\s.,!?'"\-()]*$/.test(descTrimmed)) {
                formErrors.description = 'Description can only contain letters, numbers, spaces, and basic punctuation';
            }
        }

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        setErrors({});
        await onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Edit PT Plan' : 'Create New PT Plan'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Plan Name"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) {
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                delete newErrors.name;
                                return newErrors;
                            });
                        }
                    }}
                    placeholder="e.g. 10 Sessions Pack"
                    required
                    error={errors.name}
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Total Sessions"
                        type="number"
                        min="1"
                        max="500"
                        value={formData.totalSessions}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, totalSessions: val === '' ? '' as any : parseInt(val) || 0 });
                            
                            const num = parseInt(val);
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                if (val === '') {
                                    newErrors.totalSessions = 'Total sessions is required';
                                } else if (isNaN(num) || num < 1 || num > 500) {
                                    newErrors.totalSessions = 'Total sessions must be between 1 and 500';
                                } else {
                                    delete newErrors.totalSessions;
                                }
                                return newErrors;
                            });
                        }}
                        required
                        error={errors.totalSessions}
                    />
                    <Input
                        label="Validity (Days)"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.validityDays}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData({ ...formData, validityDays: val === '' ? '' as any : parseInt(val) || 0 });
                            
                            const num = parseInt(val);
                            setErrors(prev => {
                                const newErrors = { ...prev };
                                if (val === '') {
                                    newErrors.validityDays = 'Validity is required';
                                } else if (isNaN(num) || num < 1 || num > 365) {
                                    newErrors.validityDays = 'Validity must be between 1 and 365 days';
                                } else {
                                    delete newErrors.validityDays;
                                }
                                return newErrors;
                            });
                        }}
                        required
                        error={errors.validityDays}
                    />
                </div>

                <Input
                    label="Price"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.price}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, price: val === '' ? '' as any : parseFloat(val) || 0 });
                        
                        const num = parseFloat(val);
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            if (val === '') {
                                newErrors.price = 'Price is required';
                            } else if (isNaN(num) || num < 1 || num > 100000) {
                                newErrors.price = 'Price must be between 1 and 100,000';
                            } else {
                                delete newErrors.price;
                            }
                            return newErrors;
                        });
                    }}
                    onFocus={() => {
                        if (formData.price === 0 || (formData.price as any) === '0') {
                            setFormData({ ...formData, price: '' as any });
                        }
                    }}
                    onBlur={() => {
                        if ((formData.price as any) === '' || formData.price === undefined || formData.price === null) {
                            setFormData({ ...formData, price: 0 });
                        }
                    }}
                    required
                    leftIcon={<span className="text-gray-500">₹</span>}
                    error={errors.price}
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                            errors.description
                                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:ring-orange-500 focus:border-orange-500'
                        }`}
                        rows={3}
                        value={formData.description}
                        onChange={(e) => {
                            setFormData({ ...formData, description: e.target.value });
                            if (errors.description) {
                                setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.description;
                                    return newErrors;
                                });
                            }
                        }}
                        placeholder="Optional details..."
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        {initialData ? 'Update Plan' : 'Create Plan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
