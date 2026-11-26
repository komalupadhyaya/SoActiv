// pages/admin/StaffTargetFormPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStaff } from '../../hooks/useStaff';
import { useStaffTarget, MonthlyTargets } from '../../hooks/useStaffTarget';
import { useToast } from '../../contexts/ToastContext';

const TARGETS_OPTIONS = ['Sales', 'Personal Training'];
const SALES_OPTIONS = ['Call Target', 'Revenue Target', 'Closure Count', 'Contacts Created'];
const MONTHS: Array<keyof MonthlyTargets> = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const StaffTargetFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryStaffId = searchParams.get('stfid') || searchParams.get('staffId');

  const { staff, fetchAllStaff } = useStaff();
  const { targets, fetchTargets, createTarget, updateTarget } = useStaffTarget();
  const { addToast } = useToast();

  const currentYear = new Date().getFullYear();

  const [staffId, setStaffId] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('Sales');
  const [salesType, setSalesType] = useState<string>('Call Target');
  const [year, setYear] = useState<number>(currentYear);
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTargets>({
    jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
    jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllStaff();
  }, [fetchAllStaff]);

  // Load existing target if editing
  useEffect(() => {
    if (id) {
      const existing = targets.find((t) => t._id === id);
      if (existing) {
        setStaffId(existing.staffId);
        setTargetType(existing.targetType || 'Sales');
        setSalesType(existing.salesType || 'Call Target');
        setYear(existing.year || currentYear);
        setMonthlyTargets(existing.monthlyTargets || {
          jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
          jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0,
        });
      } else {
        fetchTargets();
      }
    } else if (queryStaffId) {
      setStaffId(queryStaffId);
    }
  }, [id, targets, queryStaffId, currentYear, fetchTargets]);

  const handleMonthChange = (month: keyof MonthlyTargets, value: string) => {
    const num = parseFloat(value) || 0;
    setMonthlyTargets((prev) => ({
      ...prev,
      [month]: num,
    }));
  };

  // Copy January value across all subsequent months
  const handleCopyJanToAll = () => {
    const janVal = monthlyTargets.jan || 0;
    setMonthlyTargets({
      jan: janVal,
      feb: janVal,
      mar: janVal,
      apr: janVal,
      may: janVal,
      jun: janVal,
      jul: janVal,
      aug: janVal,
      sep: janVal,
      oct: janVal,
      nov: janVal,
      dec: janVal,
    });
    addToast('Copied Jan value to all months', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) {
      setValidationError('Please select a staff member');
      return;
    }
    setValidationError(null);
    setIsSubmitting(true);

    try {
      if (id) {
        const res = await updateTarget(id, {
          staffId,
          targetType,
          salesType,
          year: Number(year),
          monthlyTargets,
        });
        if (res) {
          navigate('/admin/staff-target');
        }
      } else {
        const res = await createTarget({
          staffId,
          targetType,
          salesType,
          year: Number(year),
          monthlyTargets,
        });
        if (res) {
          navigate('/admin/staff-target');
        }
      }
    } catch (err: any) {
      addToast(err?.message || 'Failed to save staff target', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 space-y-4 font-sans text-xs">
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
        <Link to="/admin/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200">
          Home
        </Link>
        <span>/</span>
        <Link to="/admin/staff" className="hover:text-gray-700 dark:hover:text-gray-200">
          Staff
        </Link>
        <span>/</span>
        <span className="text-[#ff5e28] font-semibold">Staff Target</span>
      </div>

      {/* 2. Main Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200/90 dark:border-gray-700 p-6 shadow-2xs">
        {validationError && (
          <div className="mb-4 p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xs text-xs">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Staff Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 text-gray-800 dark:text-gray-200 font-normal">
              Staff<span className="text-red-500">*</span>
            </label>
            <select
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                if (validationError) setValidationError(null);
              }}
              className="w-full sm:w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select Staff</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Targets Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 text-gray-800 dark:text-gray-200 font-normal">
              Targets
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {TARGETS_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sales Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 text-gray-800 dark:text-gray-200 font-normal">
              Sales
            </label>
            <select
              value={salesType}
              onChange={(e) => setSalesType(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {SALES_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Year Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <label className="w-28 text-gray-800 dark:text-gray-200 font-normal">
              Year<span className="text-red-500">*</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full sm:w-64 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Target Grid Row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 pt-2">
            <label className="w-28 text-gray-800 dark:text-gray-200 font-normal pt-2 leading-tight">
              {salesType.toLowerCase().includes('target') ? salesType : `${salesType} Target`}
            </label>

            <div className="flex-1 overflow-x-auto">
              <table className="border-collapse border border-gray-300 dark:border-gray-600 text-xs text-center min-w-[720px]">
                <thead>
                  <tr className="bg-[#48c78e] text-white font-medium text-[11px]">
                    {MONTH_LABELS.map((m) => (
                      <th key={m} className="py-1.5 px-2 border-r border-[#3bb37c] last:border-r-0 font-medium">
                        {m}
                      </th>
                    ))}
                    <th className="py-1.5 px-3 font-medium">Copy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
                    {MONTHS.map((m) => (
                      <td key={m} className="p-1 border-r border-gray-200 dark:border-gray-700">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={monthlyTargets[m] === 0 ? '0' : monthlyTargets[m] || ''}
                          onChange={(e) => handleMonthChange(m, e.target.value)}
                          className="w-full px-1.5 py-1 text-center border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </td>
                    ))}
                    <td className="p-1 text-center font-normal">
                      <button
                        type="button"
                        onClick={handleCopyJanToAll}
                        className="text-[#0070ba] hover:underline cursor-pointer text-xs"
                      >
                        Copy
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-2 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffTargetFormPage;
