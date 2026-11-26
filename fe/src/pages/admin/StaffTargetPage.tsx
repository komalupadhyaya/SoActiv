import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { useStaff } from '../../hooks/useStaff';
import { useStaffTarget, StaffTarget } from '../../hooks/useStaffTarget';
import { useAuth } from '../../contexts/AuthContext';

const TARGET_TYPE_OPTIONS = ['All', 'Sales', 'Personal Training'];
const SALES_TYPE_OPTIONS = ['All', 'Call Target', 'Revenue Target', 'Closure Count', 'Contacts Created'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

export const StaffTargetPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const { staff, fetchAllStaff } = useStaff();
  const {
    targets,
    loading,
    fetchTargets,
    deleteTarget,
  } = useStaffTarget();

  // Filter States - default to 'All'
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('All');
  const [selectedTargetTypeFilter, setSelectedTargetTypeFilter] = useState<string>('All');
  const [selectedSalesTypeFilter, setSelectedSalesTypeFilter] = useState<string>('All');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('All');

  // Initial Load
  useEffect(() => {
    fetchAllStaff();
    fetchTargets({
      staffId: 'All',
      targetType: 'All',
      salesType: 'All',
      year: 'All',
    });
  }, [fetchAllStaff, fetchTargets]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTargets({
      staffId: selectedStaffFilter,
      targetType: selectedTargetTypeFilter,
      salesType: selectedSalesTypeFilter,
      year: selectedYearFilter,
    });
  };

  const handleOpenAdd = () => {
    navigate('/admin/staff-target/new');
  };

  const handleOpenEdit = (target: StaffTarget) => {
    navigate(`/admin/staff-target/edit/${target._id}`);
  };

  const handleDelete = async (target: StaffTarget) => {
    if (window.confirm(`Are you sure you want to delete the target for ${target.staffName}?`)) {
      await deleteTarget(target._id);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = ['All', currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const formatTargetValue = (val: number | undefined, salesType: string) => {
    if (val === undefined || val === null) return '0.00';
    if (
      salesType.toLowerCase().includes('call') ||
      salesType.toLowerCase().includes('count') ||
      salesType.toLowerCase().includes('contacts')
    ) {
      return String(val);
    }
    return Number(val).toFixed(2);
  };

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
        <span className="text-[#ff5e28] font-semibold">View Staff Target</span>
      </div>

      {/* 2. Top Filter & Action Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200/90 dark:border-gray-700 p-3 shadow-2xs">
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Staff Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Staff</span>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[120px]"
              >
                <option value="All">All</option>
                {staff.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Type Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Target</span>
              <select
                value={selectedTargetTypeFilter}
                onChange={(e) => setSelectedTargetTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[100px]"
              >
                {TARGET_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Type Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Sale</span>
              <select
                value={selectedSalesTypeFilter}
                onChange={(e) => setSelectedSalesTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[120px]"
              >
                {SALES_TYPE_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Year</span>
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer min-w-[80px]"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Go Button */}
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#ff5e28] hover:bg-[#e04f1d] text-white font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer"
            >
              Go
            </button>
          </div>

          {/* Add Target Button */}
          <div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-xs rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus size={13} />
              <span>Add Target</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Targets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-sm border border-gray-200/90 dark:border-gray-700 overflow-x-auto shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold bg-gray-50/50 dark:bg-gray-800/80">
              <th className="py-2.5 px-3 w-12 text-center font-bold text-gray-800 dark:text-gray-200">S.No</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200 min-w-[120px]">Name</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200 min-w-[110px]">Target Type</th>
              <th className="py-2.5 px-3 font-bold text-gray-800 dark:text-gray-200 min-w-[110px]">Sales Type</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-center w-14">Year</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Jan</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Feb</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Mar</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Apr</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">May</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Jun</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Jul</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Aug</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Sep</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Oct</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Nov</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-right">Dec</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-center w-12">Edit</th>
              <th className="py-2.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-center w-12">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
            {loading ? (
              <tr>
                <td colSpan={19} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading staff targets...
                </td>
              </tr>
            ) : targets.length === 0 ? (
              <tr>
                <td colSpan={19} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  No staff targets found.
                </td>
              </tr>
            ) : (
              targets.map((target, idx) => (
                <tr
                  key={target._id}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition-colors"
                >
                  {/* S.No */}
                  <td className="py-2 px-3 text-center text-gray-700 dark:text-gray-300 font-normal">
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td className="py-2 px-3 text-gray-800 dark:text-gray-200 font-medium">
                    {target.staffName}
                  </td>

                  {/* Target Type */}
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                    {target.targetType}
                  </td>

                  {/* Sales Type */}
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                    {target.salesType}
                  </td>

                  {/* Year */}
                  <td className="py-2 px-2 text-center text-gray-700 dark:text-gray-300">
                    {target.year}
                  </td>

                  {/* Months Jan - Dec */}
                  {MONTHS.map((m) => (
                    <td key={m} className="py-2 px-2 text-right text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                      {formatTargetValue(target.monthlyTargets?.[m], target.salesType)}
                    </td>
                  ))}

                  {/* Edit */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(target)}
                      className="text-cyan-500 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors p-1 cursor-pointer"
                      title="Edit target"
                    >
                      <Edit2 size={13} />
                    </button>
                  </td>

                  {/* Delete */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(target)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Delete target"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTargetPage;
