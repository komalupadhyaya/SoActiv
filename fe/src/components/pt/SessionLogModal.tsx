import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface SessionLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { date: string; notes?: string }) => Promise<void | boolean>;
    clientName: string;
    isSubmitting: boolean;
}

export const SessionLogModal: React.FC<SessionLogModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    clientName,
    isSubmitting
}) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ date, notes });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Log Session for ${clientName}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-gray-500">
                    Mark a training session as completed. This will be deducted from the client's balance.
                </p>

                <Input
                    label="Session Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Notes</label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Workout details, progress, etc..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isSubmitting}>
                        Confirm Session
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
