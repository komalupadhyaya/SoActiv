import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    {type === 'danger' && <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />}
                    {type === 'warning' && <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />}
                    <p className="text-gray-600 dark:text-gray-300">
                        {message}
                    </p>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={type === 'danger' ? 'primary' : 'secondary'} // Use primary (orange) for danger as per design system heavily using orange
                        className={type === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
