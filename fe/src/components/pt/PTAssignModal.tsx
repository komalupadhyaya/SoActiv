import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { usePT } from '../../hooks/usePT';
import { useClient } from '../../hooks/useClient';
import { useStaff } from '../../hooks/useStaff';
import { useToast } from '../../contexts/ToastContext';


const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface PTAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preSelectedMemberId?: string; // If opened from member profile or upgrade click
    preSelectedTrainerId?: string;
    isUpgrade?: boolean;
    memberName?: string;
}

export const PTAssignModal: React.FC<PTAssignModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    preSelectedMemberId,
    preSelectedTrainerId,
    isUpgrade,
    memberName
}) => {
    const { plans, fetchPlans, assignPT, assignments, fetchAssignments } = usePT();
    const { clients, fetchClients, updateClient } = useClient();
    const { staff, fetchAllStaff } = useStaff();

    const { addToast } = useToast();

    const [memberId, setMemberId] = useState('');
    const [planId, setPlanId] = useState('');
    const [trainerId, setTrainerId] = useState('');
    const [startDate, setStartDate] = useState(getLocalDateString());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReset = () => {
        setMemberId(preSelectedMemberId || '');
        setPlanId('');
        setTrainerId(preSelectedTrainerId || '');
        setStartDate(getLocalDateString());
        setIsSubmitting(false);
    };

    // Reset form data and fetch options on Modal open/close
    useEffect(() => {
        if (isOpen) {
            handleReset();
            fetchPlans();
            fetchClients();
            fetchAllStaff();
            fetchAssignments();
        } else {
            handleReset();
        }
    }, [isOpen, preSelectedMemberId, preSelectedTrainerId, fetchPlans, fetchClients, fetchAllStaff, fetchAssignments]);

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Derived lists
    const activePlans = plans.filter(p => p.isActive);
    const trainers = staff.filter(s => s.position.toLowerCase() === 'trainer' && s.status === 'active');

    const assignedPtMemberIds = new Set(
        assignments
            .map(a => {
                if (typeof a.memberId === 'object' && a.memberId !== null) {
                    return a.memberId._id;
                }
                return a.memberId;
            })
            .filter(Boolean)
    );

    let clientOptions: { value: string; label: string }[] = [];

    if (isUpgrade) {
        // In Upgrade / Renew mode: show ONLY members who have an assigned PT Plan
        const uniqueAssignedMembers = new Map<string, string>();

        clients.forEach(c => {
            if (c.hasPersonalTraining || assignedPtMemberIds.has(c._id)) {
                uniqueAssignedMembers.set(c._id, c.fullName);
            }
        });

        assignments.forEach(a => {
            if (typeof a.memberId === 'object' && a.memberId && a.memberId._id) {
                uniqueAssignedMembers.set(a.memberId._id, a.memberId.fullName);
            }
        });

        clientOptions = Array.from(uniqueAssignedMembers.entries()).map(([id, name]) => ({
            value: id,
            label: name
        }));
    } else {
        // In Assign PT mode: show members who do NOT have active PT
        const activePtMemberIds = new Set(
            assignments
                .filter(a => a.status === 'active')
                .map(a => (typeof a.memberId === 'object' && a.memberId !== null ? a.memberId._id : a.memberId))
                .filter(Boolean)
        );

        clientOptions = clients
            .filter(c => c._id === preSelectedMemberId || (!c.hasPersonalTraining && !activePtMemberIds.has(c._id)))
            .map(c => ({ value: c._id, label: c.fullName }));
    }

    if (preSelectedMemberId && !clientOptions.some(o => o.value === preSelectedMemberId)) {
        clientOptions = [
            { value: preSelectedMemberId, label: memberName || 'Selected Member' },
            ...clientOptions
        ];
    }

    const planOptions = activePlans.map(p => ({ value: p._id, label: `${p.name} - ${p.totalSessions} Sessions - ₹${p.price}` }));
    const trainerOptions = trainers.map(t => ({ value: t._id, label: t.fullName }));

    // Auto pre-fill trainer when selecting a member in upgrade mode
    useEffect(() => {
        if (isUpgrade && memberId && !trainerId) {
            const existing = assignments.find(a => {
                const mId = typeof a.memberId === 'object' ? a.memberId?._id : a.memberId;
                return mId === memberId;
            });
            if (existing) {
                const tId = typeof existing.trainerId === 'object' ? existing.trainerId?._id : existing.trainerId;
                if (tId) setTrainerId(tId);
            }
        }
    }, [memberId, isUpgrade, assignments, trainerId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId || !planId || !trainerId || !startDate) {
            addToast('Please fill all fields', 'error');
            return;
        }

        const todayStr = getLocalDateString();
        if (startDate < todayStr) {
            addToast('Start date cannot be in the past', 'error');
            return;
        }

        setIsSubmitting(true);
        const success = await assignPT({
            memberId,
            planId,
            trainerId,
            startDate
        });

        if (success) {
            // Also update the client record so the client card reflects PT details immediately
            try {
                await updateClient(memberId, {
                    hasPersonalTraining: true,
                    personalTrainer: trainerId,
                    ptPlanId: planId,
                    ptStartDate: startDate,
                } as any);
            } catch (err) {
                console.error('Failed to sync PT details to client record:', err);
            }

            if (isUpgrade) {
                addToast(`PT Plan upgraded successfully${memberName ? ` for ${memberName}` : ''}`, 'success');
            }
            handleReset();
            onClose();
            if (onSuccess) onSuccess();
        }
        setIsSubmitting(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isUpgrade ? "Upgrade / Renew PT Plan" : "Assign Personal Training"}
            closeOnOutsideClick={false}
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
                        Select New Plan
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
                    min={getLocalDateString()}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isUpgrade ? 'Upgrade Plan' : 'Assign PT')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
