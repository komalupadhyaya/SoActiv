// components/modals/StaffTargetModal.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Staff } from '../../hooks/useStaff';
import { StaffTarget, CreateTargetData, MonthlyTargets } from '../../hooks/useStaffTarget';

interface StaffTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTargetData) => Promise<boolean | void>;
  staffList: Staff[];
  initialData?: StaffTarget | null;
  defaultStaffId?: string;
  isSubmitting?: boolean;
}

const TARGET_TYPES = ['Sales', 'Personal Training'];
const SALES_TYPES = ['Call Target', 'Revenue Target', 'Closure Count', 'Contacts Created'];
const MONTHS: Array<keyof MonthlyTargets> = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

export const StaffTargetModal: React.FC<StaffTargetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  staffList,
  initialData,
  defaultStaffId,
  isSubmitting = false,
}) => {
  const currentYear = new Date().getFullYear();

  const [staffId, setStaffId] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('Sales');
  const [salesType, setSalesType] = useState<string>('Revenue Target');
  const [year, setYear] = useState<number>(currentYear);
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTargets>({
    jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
    jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setStaffId(initialData.staffId || '');
      setTargetType(initialData.targetType || 'Sales');
      setSalesType(initialData.salesType || 'Revenue Target');
      setYear(initialData.year || currentYear);
      setMonthlyTargets(initialData.monthlyTargets || {
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      });
    } else {
      setStaffId(defaultStaffId || (staffList.length > 0 ? staffList[0]._id : ''));
      setTargetType('Sales');
      setSalesType('Revenue Target');
      setYear(currentYear);
      setMonthlyTargets({
        jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
        jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
      });
    }
    setValidationError(null);
  }, [initialData, defaultStaffId, staffList, isOpen, currentYear]);

  if (!isOpen) return null;

  const handleMonthChange = (month: keyof MonthlyTargets, value: string) => {
    const num = parseFloat(value) || 0;
    setMonthlyTargets((prev) => ({
      ...prev,
      [month]: num,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setValidationError('Please select a staff member');
      return;
    }
    setValidationError(null);
    await onSubmit({
      staffId,
      targetType,
      salesType,
      year: Number(year),
      monthlyTargets,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Staff Target' : 'Add Staff Target'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {validationError && (
          <div className="p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xs text-xs">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Staff Selection */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Staff Name <span className="text-red-500">*</span>
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                disabled={!!initialData}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-orange-500 disabled:opacity-60"
              >
                <option value="">Select Staff</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({s.position || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-orange-500"
              >
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Target Type <span className="text-red-500">*</span>
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-orange-500"
              >
                {TARGET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Type */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">
                Sales Type <span className="text-red-500">*</span>
              </label>
              <select
                value={salesType}
                onChange={(e) => setSalesType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-orange-500"
              >
                {SALES_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Targets Grid */}
          <div className="pt-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 border-b pb-1 border-gray-100 dark:border-gray-700">
              Monthly Targets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {MONTHS.map((m) => (
                <div key={m}>
                  <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 uppercase mb-0.5">
                    {m}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={monthlyTargets[m] || ''}
                    onChange={(e) => handleMonthChange(m, e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xs text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Target' : 'Save Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
