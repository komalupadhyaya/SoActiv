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
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 10 Sessions Pack"
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Total Sessions"
                        type="number"
                        min="1"
                        value={formData.totalSessions}
                        onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 0 })}
                        required
                    />
                    <Input
                        label="Validity (Days)"
                        type="number"
                        min="1"
                        value={formData.validityDays}
                        onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 0 })}
                        required
                    />
                </div>

                <Input
                    label="Price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, price: val === '' ? '' as any : parseFloat(val) || 0 });
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
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional details..."
                    />
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
