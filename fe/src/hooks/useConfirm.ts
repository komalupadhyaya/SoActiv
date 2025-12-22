
import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
}

export const useConfirm = () => {
    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false,
        message: '',
        title: '',
        type: 'danger'
    });

    const resolveRef = useRef<(value: boolean) => void>(() => { });

    const confirm = useCallback((message: string, options?: Omit<ConfirmOptions, 'message'>) => {
        setConfirmState({
            isOpen: true,
            message,
            title: options?.title || 'Are you sure?',
            confirmText: options?.confirmText || 'Confirm',
            cancelText: options?.cancelText || 'Cancel',
            type: options?.type || 'danger'
        });

        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        resolveRef.current(true);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleCancel = useCallback(() => {
        resolveRef.current(false);
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        confirm,
        confirmState,
        handleConfirm,
        handleCancel
    };
};
