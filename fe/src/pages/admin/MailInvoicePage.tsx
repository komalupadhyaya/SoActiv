import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const MailInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [showSuccessBanner, setShowSuccessBanner] = useState<boolean>(true);
  const [selectedOptions, setSelectedOptions] = useState<{
    proForma: boolean;
    paidInvoice: boolean;
    receipt: boolean;
  }>({
    proForma: false,
    paidInvoice: false,
    receipt: false,
  });

  const handleToggle = (key: 'proForma' | 'paidInvoice' | 'receipt') => {
    setSelectedOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSend = () => {
    const anySelected = Object.values(selectedOptions).some(Boolean);
    if (!anySelected) {
      showToast('Please select at least one invoice copy option to send', 'info');
      return;
    }
    showToast('Invoice copy sent to member successfully', 'success');
    navigate('/admin/reports/daily-collection');
  };

  const handleClose = () => {
    navigate('/admin/reports/daily-collection');
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Top Success Banner (Yoactiv style yellow-khaki pill) */}
      {showSuccessBanner && (
        <div className="flex justify-center pt-3 px-4">
          <div className="inline-flex items-center justify-between gap-6 px-5 py-1.5 bg-[#e8e496] dark:bg-[#ca8a04]/40 text-gray-900 dark:text-yellow-100 text-xs font-semibold rounded shadow-xs border border-[#d6d27a] dark:border-yellow-600/50">
            <span>Bill Added Successfully</span>
            <button
              type="button"
              onClick={() => setShowSuccessBanner(false)}
              className="text-gray-600 dark:text-yellow-200 hover:text-gray-900 dark:hover:text-white ml-2 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm font-normal text-gray-600 dark:text-gray-400">
          <Link to="/admin/dashboard" className="hover:text-gray-900 dark:hover:text-gray-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/admin/reports" className="hover:text-gray-900 dark:hover:text-gray-200">
            Reports
          </Link>
          <span>/</span>
          <span className="hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer">
            Finance
          </span>
          <span>/</span>
          <span className="text-[#ff5e28] font-semibold">
            Mail Invoice
          </span>
        </div>

        {/* Form Body */}
        <div className="pt-4 space-y-4">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Would you like to send a copy of this invoice to the member? <span className="text-red-500 font-bold">*</span>
          </p>

          {/* Checkboxes */}
          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedOptions.proForma}
                onChange={() => handleToggle('proForma')}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#22b0e6] focus:ring-[#22b0e6] cursor-pointer"
              />
              <span>Pro-forma Invoice</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedOptions.paidInvoice}
                onChange={() => handleToggle('paidInvoice')}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#22b0e6] focus:ring-[#22b0e6] cursor-pointer"
              />
              <span>Paid Invoice (GST Invoice)</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-800 dark:text-gray-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedOptions.receipt}
                onChange={() => handleToggle('receipt')}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#22b0e6] focus:ring-[#22b0e6] cursor-pointer"
              />
              <span>Receipt</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleSend}
              className="px-8 py-2 text-xs font-semibold text-white bg-[#22b0e6] hover:bg-[#1a9fd4] rounded shadow-xs transition-colors cursor-pointer"
            >
              Send
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-8 py-2 text-xs font-semibold text-white bg-[#22b0e6] hover:bg-[#1a9fd4] rounded shadow-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
