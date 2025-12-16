import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useSchedule, Schedule as ScheduleType } from '../../hooks/useSchedule';
import { useStaff } from '../../hooks/useStaff';

interface ScheduleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: ScheduleType | null;
    defaultDate?: string; // Format: YYYY-MM-DD
}

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    defaultDate,
}) => {
    const { user } = useAuth();
    const { createScheduleEvent, updateScheduleEvent, checkHoliday } = useSchedule();
    const { staff, fetchAllStaff } = useStaff();

    // ... (state defs)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledDate: '',
        startTime: '',
        endTime: '',
        scheduledTime: '',
        type: 'task' as any,
        holidayType: 'full_day' as 'full_day' | 'first_half' | 'second_half',
        assignedTo: [] as string[],
    });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [holidayBlock, setHolidayBlock] = useState<{ blocked: boolean; message?: string; type?: string; startTime?: string; endTime?: string }>({ blocked: false });

    const isEditMode = !!initialData;
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isManager = user?.position === 'manager';

    // Fetch staff and populate form
    useEffect(() => {
        if (isOpen && user) {
            fetchAllStaff();

            if (initialData) {
                // Populate form for editing
                let assignedIds: string[] = [];
                if (initialData.assignedTo) {
                    assignedIds = initialData.assignedTo.map(s => s._id);
                }

                setFormData({
                    title: initialData.title || '',
                    description: initialData.description || '',
                    scheduledDate: initialData.scheduledDate ? new Date(initialData.scheduledDate).toISOString().split('T')[0] : '',
                    startTime: initialData.startTime || initialData.scheduledTime || '',
                    endTime: initialData.endTime || '',
                    scheduledTime: initialData.scheduledTime || '',
                    type: initialData.type,
                    holidayType: (initialData as any).holidayType || 'full_day',
                    assignedTo: assignedIds,
                });
            } else {
                // Reset for creation (with defaultDate if available)
                setFormData({
                    title: '',
                    description: '',
                    scheduledDate: defaultDate || '',
                    startTime: '',
                    endTime: '',
                    scheduledTime: '',
                    type: 'task',
                    holidayType: 'full_day',
                    assignedTo: [],
                });
            }
            setErrors({});
            setHolidayBlock({ blocked: false });
        }
    }, [isOpen, user, initialData, defaultDate]);

    // Check for holiday conflicts when date changes (and user is creating a NON-holiday event)
    // Check for holiday conflicts when date changes (and user is creating a NON-holiday event)
    useEffect(() => {
        const check = async () => {
            if (formData.scheduledDate && formData.type !== 'holiday' && !isEditMode) {
                // Determine if we need to check (avoid redundant calls if nothing changed?)
                // Actually the dependency array handles the change detection for date/type.

                const res = await checkHoliday(formData.scheduledDate);
                if (res.hasHoliday) {
                    // Only update if actually different to avoid loop? 
                    // But checkHoliday result structure is complex.
                    setHolidayBlock({
                        blocked: true,
                        message: `Date has holiday: ${res.holiday.title}`,
                        type: res.holiday.type,
                        startTime: res.holiday.startTime,
                        endTime: res.holiday.endTime
                    });
                } else {
                    setHolidayBlock(prev => prev.blocked ? { blocked: false } : prev);
                }
            } else {
                setHolidayBlock(prev => prev.blocked ? { blocked: false } : prev);
            }
        };
        check();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.scheduledDate, formData.type]); // Removed checkHoliday to prevent infinite loop

    // Check for holiday conflicts when date changes (and user is creating a NON-holiday event)


    // Updated destructuring at top:
    // const { createScheduleEvent, updateScheduleEvent, checkHoliday } = useSchedule();
    // But I will apply this in the Replace Block properly.

    // Actually, I can't change the hook call in this block if I don't include line 24.
    // I will include lines 24+ in the replacement.

    // Let's rewrite the logic inside the hook usage:

    const availableStaff = staff.filter(s => s.status === 'active');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleStaffToggle = (staffId: string) => {
        setFormData(prev => {
            const current = prev.assignedTo;
            if (current.includes(staffId)) {
                return { ...prev, assignedTo: current.filter(id => id !== staffId) };
            } else {
                return { ...prev, assignedTo: [...current, staffId] };
            }
        });
        if (errors.assignedTo) setErrors(prev => ({ ...prev, assignedTo: '' }));
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.scheduledDate) newErrors.scheduledDate = 'Date is required';

        // Relax validation for Holiday
        if (formData.type !== 'holiday') {
            if (!formData.startTime) newErrors.startTime = 'Start Time is required';
            if (formData.assignedTo.length === 0) newErrors.assignedTo = 'Please assign to at least one staff member';

            // Check manual blocking time on client side for better UX?
            // If holidayBlock.blocked (Full Day) -> Validate Fail
            if (holidayBlock.blocked && holidayBlock.type === 'full_day') {
                newErrors.scheduledDate = holidayBlock.message || 'Variable blocked';
            }
            // Partial block check
            if (holidayBlock.blocked && holidayBlock.startTime && holidayBlock.endTime && formData.startTime && formData.endTime) {
                const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                const hStart = toMin(holidayBlock.startTime);
                const hEnd = toMin(holidayBlock.endTime);
                const eStart = toMin(formData.startTime);
                const eEnd = toMin(formData.endTime);

                if (eStart < hEnd && eEnd > hStart) {
                    newErrors.startTime = `Overlaps with holiday (${holidayBlock.startTime}-${holidayBlock.endTime})`;
                }
            }
        } else {
            // Holiday Validations
            if (formData.holidayType !== 'full_day') {
                if (!formData.startTime) newErrors.startTime = 'Start Time is required for partial holidays';
                if (!formData.endTime) newErrors.endTime = 'End Time is required for partial holidays';
            }
        }

        if (!formData.type) newErrors.type = 'Type is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setSubmitting(true);
            const payload = {
                title: formData.title,
                description: formData.description,
                scheduledDate: formData.scheduledDate,
                scheduledTime: formData.startTime || '09:00', // Default for holiday if empty
                startTime: formData.startTime || '09:00',
                endTime: formData.endTime,
                type: formData.type,
                assignedTo: formData.assignedTo,
                isEditable: true,
                holidayType: formData.type === 'holiday' ? formData.holidayType : undefined
            };

            let result;
            if (isEditMode && initialData) {
                result = await updateScheduleEvent(initialData._id, payload);
            } else {
                result = await createScheduleEvent(payload);
            }

            if (result.success) {
                onSuccess();
                onClose();
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting) onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? 'Edit Schedule Event' : 'Create Schedule Event'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* HOLIDAY WARNING */}
                    {holidayBlock.blocked && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                            <strong>Holiday Alert:</strong> {holidayBlock.message || 'Scheduling restricted due to a holiday.'}
                            {holidayBlock.startTime && ` (${holidayBlock.startTime} - ${holidayBlock.endTime})`}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            placeholder="Enter event title"
                            disabled={submitting || (holidayBlock.blocked && holidayBlock.type === 'full_day')}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="Enter event description (optional)"
                            disabled={submitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.scheduledDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                disabled={submitting}
                            />
                            {errors.scheduledDate && <p className="mt-1 text-sm text-red-500">{errors.scheduledDate}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Time {formData.type !== 'holiday' && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                disabled={submitting}
                            />
                            {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Time
                            </label>
                            <input
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.endTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                disabled={submitting}
                            />
                            {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Event Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            disabled={submitting}
                        >
                            <option value="task">Task</option>
                            <option value="followup">Follow-up</option>
                            <option value="member-session">Member Session</option>
                            <option value="holiday">Holiday</option>
                            <option value="class">Class</option>
                            <option value="self-reminder">Self Reminder</option>
                            <option value="member-checkin">Member Check-in</option>

                            {/* Admin & Manager Only Types */}
                            {(isAdmin || isManager) && (
                                <>
                                    <option value="manager_task">Manager Task</option>
                                    <option value="pt_expiry">PT Expiry</option>
                                    <option value="membership_expiry">Membership Expiry</option>
                                </>
                            )}

                            {/* Admin Only Types */}
                            {isAdmin && <option value="admin_task">Admin Task</option>}
                        </select>
                        {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                    </div>

                    {/* Holiday Type Selection */}
                    {formData.type === 'holiday' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Holiday Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="holidayType"
                                value={formData.holidayType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                disabled={submitting}
                            >
                                <option value="full_day">Full Day</option>
                                <option value="first_half">First Half</option>
                                <option value="second_half">Second Half</option>
                            </select>
                        </div>
                    )}

                    {formData.type !== 'holiday' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Assign To <span className="text-red-500">*</span>
                            </label>
                            <div className={`border rounded-md max-h-48 overflow-y-auto bg-white dark:bg-gray-900 ${errors.assignedTo ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                {availableStaff.map((staffMember) => (
                                    <div key={staffMember._id} className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <input
                                            type="checkbox"
                                            id={`staff-${staffMember._id}`}
                                            checked={formData.assignedTo.includes(staffMember._id)}
                                            onChange={() => handleStaffToggle(staffMember._id)}
                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                            disabled={submitting}
                                        />
                                        <label htmlFor={`staff-${staffMember._id}`} className="ml-2 block text-sm text-gray-900 dark:text-white cursor-pointer w-full">
                                            {staffMember.fullName} - {staffMember.position}
                                        </label>
                                    </div>
                                ))}
                                {availableStaff.length === 0 && (
                                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                        No active staff available
                                    </div>
                                )}
                            </div>
                            {errors.assignedTo && <p className="mt-1 text-sm text-red-500">{errors.assignedTo}</p>}
                            <p className="mt-1 text-xs text-gray-500">Select multiple staff for shared tasks</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={submitting || (holidayBlock.blocked && holidayBlock.type === 'full_day')}>
                            {submitting ? 'Saving...' : (isEditMode ? 'Update Event' : 'Create Event')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
