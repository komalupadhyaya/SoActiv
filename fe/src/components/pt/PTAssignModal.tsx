import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { usePT } from '../../hooks/usePT';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';

interface PTAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preSelectedMemberId?: string; // If opened from member profile
}

export const PTAssignModal: React.FC<PTAssignModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    preSelectedMemberId
}) => {
    const { plans, fetchPlans, assignPT } = usePT();
    const { clients, fetchClients } = useClient();
    const { staff, fetchAllStaff } = useStaff();
    const { addToast } = useToast();

    const [memberId, setMemberId] = useState('');
    const [planId, setPlanId] = useState('');
    const [trainerId, setTrainerId] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial Fetch
    useEffect(() => {
        if (isOpen) {
            fetchPlans();
            fetchClients(); // Optimize: maybe just search? But for now fetch all is safer for select
            fetchAllStaff();
        }
    }, [isOpen, fetchPlans, fetchClients, fetchAllStaff]);

    useEffect(() => {
        if (preSelectedMemberId) {
            setMemberId(preSelectedMemberId);
        }
    }, [preSelectedMemberId]);

    // Derived lists
    const activePlans = plans.filter(p => p.isActive);
    const trainers = staff.filter(s => s.position.toLowerCase() === 'trainer' && s.status === 'active');

    // Create options
    const clientOptions = clients.map(c => ({ value: c._id, label: c.fullName }));
    const planOptions = activePlans.map(p => ({ value: p._id, label: `${p.name} - ${p.totalSessions} Sessions - ₹${p.price}` }));
    const trainerOptions = trainers.map(t => ({ value: t._id, label: t.fullName }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId || !planId || !trainerId || !startDate) {
            addToast('Please fill all fields', 'error');
            return;
        }

        setIsSubmitting(true);
        const success = await assignPT({
            memberId,
            planId,
            trainerId,
            startDate
        });
        setIsSubmitting(false);

        if (success) {
            onClose();
            if (onSuccess) onSuccess();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Personal Training"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Member Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Member
                    </label>
                    <Select
                        options={clientOptions}
                        value={memberId}
                        onChange={setMemberId}
                        placeholder="Search Member..."
                        disabled={!!preSelectedMemberId} // Lock if pre-selected
                    />
                </div>

                {/* Plan Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Select Plan
                    </label>
                    <Select
                        options={planOptions}
                        value={planId}
                        onChange={setPlanId}
                        placeholder="Choose a Package"
                    />
                </div>

                {/* Trainer Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Assign Trainer
                    </label>
                    <Select
                        options={trainerOptions}
                        value={trainerId}
                        onChange={setTrainerId}
                        placeholder="Select Trainer"
                    />
                </div>

                {/* Start Date */}
                <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        Assign & Create
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
