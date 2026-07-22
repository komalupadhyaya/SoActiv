import React, { useEffect, useState } from 'react';
import {
    Plus, Calendar, Users, Clock, Edit2, Trash2, ChevronRight, PlayCircle,
    RefreshCw, X, AlertCircle, Dumbbell
} from 'lucide-react';
import { useGymClass, GymClass, ClassSession } from '../../hooks/useGymClass';
import { useStaff } from '../../hooks/useStaff';
import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COLORS = ['#F97316', '#8B5CF6', '#06B6D4', '#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899'];

function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getMaxDateString = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return getLocalDateString(d);
};

const getMaxEndDateString = (startDateStr: string, days: number) => {
    if (!startDateStr) return getMaxDateString(days);
    const [year, month, day] = startDateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day + days);
    return getLocalDateString(d);
};

const emptyForm = {
    name: '', description: '', notes: '', trainerId: '', capacity: 20,
    durationMinutes: 60, time: '07:00', color: '#F97316',
    recurrenceType: 'none' as 'none' | 'weekly', recurrenceDays: [] as number[],
};

const emptyGenerate = { startDate: '', endDate: '' };

const ClassForm: React.FC<{
    form: typeof emptyForm;
    setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
    formError: string;
    submitting: boolean;
    trainers: any[];
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isEdit?: boolean;
}> = ({ form, setForm, formError, submitting, trainers, onSubmit, onCancel, isEdit }) => {
    const toggleDay = (day: number) => {
        setForm(prev => ({
            ...prev,
            recurrenceDays: prev.recurrenceDays.includes(day)
                ? prev.recurrenceDays.filter(d => d !== day)
                : [...prev.recurrenceDays, day]
        }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {formError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Name *</label>
                    <input
                        type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Morning Yoga"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        rows={2} placeholder="Brief description of the class..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trainer</label>
                    <select
                        value={form.trainerId} onChange={e => setForm(p => ({ ...p, trainerId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="">-- No Trainer --</option>
                        {trainers.map(t => (
                            <option key={t._id?.toString()} value={t._id?.toString()}>{t.fullName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity *</label>
                    <input
                        type="number" min={1} max={500} value={form.capacity}
                        onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (minutes) *</label>
                    <input
                        type="number" min={15} max={480} value={form.durationMinutes}
                        onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                    <input
                        type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                {/* Color picker */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class Color</label>
                    <div className="flex gap-2 flex-wrap">
                        {COLORS.map(c => (
                            <button
                                key={c} type="button"
                                onClick={() => setForm(p => ({ ...p, color: c }))}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Recurrence */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recurrence</label>
                    <div className="flex gap-3 mb-3">
                        {(['none', 'weekly'] as const).map(type => (
                            <button
                                key={type} type="button"
                                onClick={() => setForm(p => ({ ...p, recurrenceType: type, recurrenceDays: [] }))}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    form.recurrenceType === type
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {type === 'none' ? 'Single' : 'Every Week'}
                            </button>
                        ))}
                    </div>
                    {form.recurrenceType === 'weekly' && (
                        <div className="flex gap-2 flex-wrap">
                            {DAY_NAMES.map((day, i) => (
                                <button
                                    key={day} type="button"
                                    onClick={() => toggleDay(i)}
                                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                                        form.recurrenceDays.includes(i)
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Notes</label>
                    <textarea
                        value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        rows={2} placeholder="e.g. Focus on flexibility. Bring yoga mat."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit" disabled={submitting}
                    className="px-5 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                    {submitting ? 'Saving...' : isEdit ? 'Update Class' : 'Create Class'}
                </button>
            </div>
        </form>
    );
};

export const ClassManagementPage: React.FC = () => {
    const {
        classes, sessions, loading,
        fetchClasses, createClass, updateClass, deleteClass,
        generateSessions, fetchSessionsByClass, cancelSession
    } = useGymClass();
    const { staff, fetchAllStaff } = useStaff();
    const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

    const [activeView, setActiveView] = useState<'classes' | 'sessions'>('classes');
    const [selectedClass, setSelectedClass] = useState<GymClass | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isCancelSessionOpen, setIsCancelSessionOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [form, setForm] = useState({ ...emptyForm });
    const [generateForm, setGenerateForm] = useState({ ...emptyGenerate });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sessionsFromDate, setSessionsFromDate] = useState(getLocalDateString());

    const handleSessionsFromDateChange = async (date: string) => {
        setSessionsFromDate(date);
        if (selectedClass) {
            await fetchSessionsByClass(selectedClass._id, { from: date });
        }
    };

    // Trainers only
    const trainers = staff.filter(s => s.position === 'trainer' && s.status === 'active');

    useEffect(() => {
        fetchClasses();
        fetchAllStaff();
    }, [fetchClasses, fetchAllStaff]);

    const openEditModal = (cls: GymClass) => {
        setForm({
            name: cls.name,
            description: cls.description || '',
            notes: cls.notes || '',
            trainerId: (cls.trainerId as any)?._id || '',
            capacity: cls.capacity,
            durationMinutes: cls.durationMinutes,
            time: cls.time,
            color: cls.color,
            recurrenceType: cls.recurrence.type,
            recurrenceDays: cls.recurrence.days,
        });
        setIsEditOpen(true);
        setSelectedClass(cls);
    };

    const openGenerateModal = (cls: GymClass) => {
        setSelectedClass(cls);
        const today = getLocalDateString();
        const plus30Date = new Date();
        plus30Date.setDate(plus30Date.getDate() + 30);
        const plus30 = getLocalDateString(plus30Date);
        setGenerateForm({ startDate: today, endDate: cls.recurrence.type === 'none' ? today : plus30 });
        setIsGenerateOpen(true);
    };

    const openSessions = async (cls: GymClass) => {
        setSelectedClass(cls);
        setActiveView('sessions');
        const today = getLocalDateString();
        setSessionsFromDate(today);
        await fetchSessionsByClass(cls._id, { from: today });
    };



    const validateForm = () => {
        if (!form.name.trim()) return 'Class name is required';
        if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
            return 'Class name must contain only alphabetical characters and spaces';
        }
        const nameLower = form.name.trim().toLowerCase();
        const isDuplicate = classes.some(c => 
            c.name.toLowerCase() === nameLower && 
            c.status === 'active' && 
            (!isEditOpen || (selectedClass && c._id !== selectedClass._id))
        );
        if (isDuplicate) {
            return 'A class with this name already exists';
        }
        if (form.description.trim()) {
            const wordCount = form.description.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount > 50) {
                return 'Description cannot exceed 50 words';
            }
            if (!/^[a-zA-Z\s.,!?'"\-()]*$/.test(form.description.trim())) {
                return 'Description must contain only alphabetical characters and spaces (no numbers or special characters)';
            }
        }
        if (form.notes.trim()) {
            const wordCount = form.notes.trim().split(/\s+/).filter(Boolean).length;
            if (wordCount > 50) {
                return 'Class notes cannot exceed 50 words';
            }
            if (!/^[a-zA-Z\s.,!?'"\-()]*$/.test(form.notes.trim())) {
                return 'Class notes must contain only alphabetical characters and spaces (no numbers or special characters)';
            }
        }
        if (!form.trainerId) return 'Trainer is required';
        if (form.capacity < 1) return 'Capacity must be at least 1';
        if (form.durationMinutes < 15) return 'Duration must be at least 15 minutes';
        if (form.recurrenceType === 'weekly' && form.recurrenceDays.length === 0) return 'Select at least one day for weekly recurrence';
        return '';
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateForm();
        if (err) { setFormError(err); return; }
        setSubmitting(true);
        const result = await createClass({
            name: form.name, description: form.description, notes: form.notes,
            trainerId: form.trainerId || undefined, capacity: form.capacity,
            durationMinutes: form.durationMinutes, time: form.time, color: form.color,
            recurrence: { type: form.recurrenceType, days: form.recurrenceDays },
        });
        setSubmitting(false);
        if (result.success) {
            setIsCreateOpen(false);
            setForm({ ...emptyForm });
            setFormError('');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;
        const err = validateForm();
        if (err) { setFormError(err); return; }
        setSubmitting(true);
        await updateClass(selectedClass._id, {
            name: form.name, description: form.description, notes: form.notes,
            capacity: form.capacity, durationMinutes: form.durationMinutes,
            time: form.time, color: form.color,
            recurrence: { type: form.recurrenceType, days: form.recurrenceDays },
        } as any);
        setSubmitting(false);
        setIsEditOpen(false);
    };

    const handleDelete = async (cls: GymClass) => {
        const ok = await confirm(`Cancel class "${cls.name}"? All future sessions will also be cancelled.`, { title: 'Cancel Class', type: 'danger' });
        if (ok) await deleteClass(cls._id);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass) return;

        const isSingle = selectedClass.recurrence.type === 'none';
        const startD = generateForm.startDate;
        const endD = isSingle ? startD : generateForm.endDate;

        if (!startD || !endD) { setFormError('Date is required'); return; }
        
        const todayStr = getLocalDateString();
        if (startD < todayStr) {
            setFormError('Start date cannot be in the past');
            return;
        }
        if (endD < todayStr) {
            setFormError('End date cannot be in the past');
            return;
        }
        if (endD < startD) {
            setFormError('End date must be after or equal to start date');
            return;
        }

        const maxEndD = getMaxEndDateString(startD, 90);
        if (endD > maxEndD) {
            setFormError('Date range cannot exceed 90 days');
            return;
        }

        setSubmitting(true);
        await generateSessions(selectedClass._id, startD, endD);
        setSubmitting(false);
        setIsGenerateOpen(false);
        // Refresh sessions if viewing
        if (activeView === 'sessions') {
            await fetchSessionsByClass(selectedClass._id, { from: getLocalDateString() });
        }
    };

    const handleCancelSession = async () => {
        if (!selectedSession) return;
        setSubmitting(true);
        await cancelSession(selectedSession._id, cancelReason);
        setSubmitting(false);
        setIsCancelSessionOpen(false);
        setCancelReason('');
        if (selectedClass) {
            await fetchSessionsByClass(selectedClass._id, { from: sessionsFromDate });
        }
    };

    const ClassCard = ({ cls }: { cls: GymClass }) => {
        const trainerName = (cls.trainerId as any)?.fullName || 'Unassigned';
        const recurrenceLabel = cls.recurrence.type === 'weekly'
            ? cls.recurrence.days.map(d => DAY_NAMES[d]).join(', ')
            : 'Single';

        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                {/* Color strip + header */}
                <div className="h-2" style={{ backgroundColor: cls.color }} />
                <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{cls.name}</h3>
                            {cls.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{cls.description}</p>
                            )}
                        </div>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            cls.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                            {cls.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4 text-orange-500" />
                            <span>{cls.capacity} capacity</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>{cls.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span>{formatTime(cls.time)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <RefreshCw className="w-4 h-4 text-orange-500" />
                            <span className="truncate">{recurrenceLabel}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                        <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {trainerName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Trainer</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{trainerName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => openSessions(cls)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                            <Calendar className="w-3.5 h-3.5" /> Sessions
                        </button>
                        <button
                            onClick={() => openGenerateModal(cls)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                        >
                            <PlayCircle className="w-3.5 h-3.5" /> Generate
                        </button>
                        <button
                            onClick={() => openEditModal(cls)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => handleDelete(cls)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const SessionRow = ({ session }: { session: ClassSession }) => {
        const availableSlots = session.capacity - session.bookedCount;
        const fillPercent = Math.round((session.bookedCount / session.capacity) * 100);
        const isFull = session.bookedCount >= session.capacity;

        return (
            <div className={`p-4 rounded-xl border transition-colors ${
                session.status === 'cancelled'
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800'
            }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <div className="text-center min-w-[56px]">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {new Date(session.date).getDate()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(session.date).toLocaleDateString('en-IN', { month: 'short' })}
                            </p>
                            <p className="text-xs text-orange-500 font-medium">
                                {DAY_NAMES[new Date(session.date).getDay()]}
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {formatTime(session.time)} – {formatTime(session.endTime)}
                            </p>
                            {session.notes && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">📝 {session.notes}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Capacity bar */}
                        <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {session.bookedCount}/{session.capacity} booked
                                </span>
                                <span className={isFull ? 'text-red-500' : 'text-green-500'}>
                                    {availableSlots} left
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        fillPercent >= 90 ? 'bg-red-500' : fillPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${fillPercent}%` }}
                                />
                            </div>
                        </div>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : session.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {session.status}
                        </span>

                        {session.status === 'scheduled' && (
                            <button
                                onClick={() => { setSelectedSession(session); setIsCancelSessionOpen(true); }}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Cancel session"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };



    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        {activeView === 'sessions' && selectedClass ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveView('classes')}
                                    className="text-orange-500 hover:text-orange-600 font-medium text-sm"
                                >
                                    ← All Classes
                                </button>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedClass.color }} />
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClass.name}</h1>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Class Management</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create, schedule, and manage gym classes</p>
                            </>
                        )}
                    </div>
                    {activeView === 'classes' && (
                        <button
                            onClick={() => { setForm({ ...emptyForm }); setFormError(''); setIsCreateOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" /> Create Class
                        </button>
                    )}
                    {activeView === 'sessions' && selectedClass && (
                        <button
                            onClick={() => openGenerateModal(selectedClass)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl font-medium text-sm hover:bg-purple-600 transition-colors shadow-sm"
                        >
                            <PlayCircle className="w-4 h-4" /> Generate Sessions
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
                {/* Classes Grid */}
                {activeView === 'classes' && (
                    <>
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <Dumbbell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Classes Yet</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first class to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classes.map(cls => <ClassCard key={cls._id} cls={cls} />)}
                            </div>
                        )}
                    </>
                )}

                {/* Sessions List */}
                {activeView === 'sessions' && selectedClass && (
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show sessions from:</label>
                                <input
                                    type="date"
                                    value={sessionsFromDate}
                                    onChange={e => handleSessionsFromDateChange(e.target.value)}
                                    min={getLocalDateString()}
                                    className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                        {selectedClass.notes && (
                            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    <span className="font-medium">Class Notes:</span> {selectedClass.notes}
                                </p>
                            </div>
                        )}
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-center">
                                <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Sessions Generated</h3>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                    Click "Generate Sessions" to create scheduled slots
                                </p>
                                <button
                                    onClick={() => openGenerateModal(selectedClass)}
                                    className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                                >
                                    Generate Sessions
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map(s => <SessionRow key={s._id} session={s} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── Create Modal ──────────────────────────────────────────────────── */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Class</h2>
                            <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <ClassForm
                                form={form}
                                setForm={setForm}
                                formError={formError}
                                submitting={submitting}
                                trainers={trainers}
                                onSubmit={handleCreate}
                                onCancel={() => { setIsCreateOpen(false); setFormError(''); }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Edit Modal ────────────────────────────────────────────────────── */}
            {isEditOpen && selectedClass && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Class</h2>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <ClassForm
                                form={form}
                                setForm={setForm}
                                formError={formError}
                                submitting={submitting}
                                trainers={trainers}
                                onSubmit={handleUpdate}
                                onCancel={() => { setIsEditOpen(false); setFormError(''); }}
                                isEdit
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Generate Sessions Modal ───────────────────────────────────────── */}
            {isGenerateOpen && selectedClass && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Generate Sessions</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">For: {selectedClass.name}</p>
                            </div>
                            <button onClick={() => setIsGenerateOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleGenerate} className="p-5 space-y-4">
                            {selectedClass.recurrence.type === 'weekly' && (
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-purple-800 dark:text-purple-300">
                                        <span className="font-medium">Repeats:</span>{' '}
                                        Every {selectedClass.recurrence.days.map(d => DAY_FULL[d]).join(', ')} at {formatTime(selectedClass.time)}
                                    </p>
                                </div>
                            )}
                            {formError && (
                                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {selectedClass.recurrence.type === 'none' ? 'Session Date' : 'Start Date'}
                                </label>
                                <input
                                    type="date" value={generateForm.startDate}
                                    min={getLocalDateString()}
                                    max={getMaxDateString(90)}
                                    onChange={e => setGenerateForm(p => ({ ...p, startDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            {selectedClass.recurrence.type !== 'none' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                                    <input
                                        type="date" value={generateForm.endDate}
                                        min={generateForm.startDate || getLocalDateString()}
                                        max={getMaxEndDateString(generateForm.startDate, 90)}
                                        onChange={e => setGenerateForm(p => ({ ...p, endDate: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsGenerateOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-5 py-2 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">
                                    {submitting ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Cancel Session Modal ──────────────────────────────────────────── */}
            {isCancelSessionOpen && selectedSession && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Cancel Session</h2>
                            <button onClick={() => setIsCancelSessionOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    Cancel session on <span className="font-semibold">{formatDate(selectedSession.date)}</span> at{' '}
                                    <span className="font-semibold">{formatTime(selectedSession.time)}</span>?
                                    Booked members will be notified.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                                <textarea
                                    value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                                    rows={2} placeholder="e.g. Trainer unavailable"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsCancelSessionOpen(false)}
                                    className="px-4 py-2 text-sm text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-200 transition-colors">
                                    Keep Session
                                </button>
                                <button onClick={handleCancelSession} disabled={submitting}
                                    className="px-5 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                                    {submitting ? 'Cancelling...' : 'Cancel Session'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmState.isOpen}
                message={confirmState.message}
                title={confirmState.title}
                type={confirmState.type}
                onConfirm={handleConfirm}
                onClose={handleCancel}
            />
        </div>
    );
};

export default ClassManagementPage;
