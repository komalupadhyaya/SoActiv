import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

interface ReportsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportCategory {
  id: string;
  name: string;
  items: { id: string; label: string; href: string }[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'general',
    name: 'General Reports',
    items: [
      { id: 'biometric-summary', label: 'Biometric Summary', href: '/admin/reports?type=biometric-summary' },
      { id: 'biometric', label: 'Biometric', href: '/admin/reports?type=biometric' },
      { id: 'vaccination', label: 'Vaccination Report', href: '/admin/reports?type=vaccination' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    items: [
      { id: 'offers', label: 'Offers', href: '/admin/reports?type=offers' },
      { id: 'lead-source', label: 'Lead Source', href: '/admin/reports?type=lead-source' },
      { id: 'referral', label: 'Referral', href: '/admin/reports?type=referral' },
      { id: 'sms-report', label: 'SMS Report', href: '/admin/reports?type=sms-report' },
      { id: 'business-mis', label: 'Business MIS Report', href: '/admin/reports?type=business-mis' },
      { id: 'marketing-mis', label: 'Marketing MIS Report', href: '/admin/reports?type=marketing-mis' },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    items: [
      { id: 'dsr-report', label: 'DSR Report', href: '/admin/reports/sales/dsr-report' },
      { id: 'revenue', label: 'Revenue', href: '/admin/reports/sales/revenue' },
      { id: 'expected-revenue', label: 'Expected Revenue', href: '/admin/reports?type=expected-revenue' },
      { id: 'revenue-vs-target', label: 'Revenue Vs Target', href: '/admin/reports?type=revenue-vs-target' },
      { id: 'revenue-month-till-date', label: 'Revenue - Month Till Date', href: '/admin/reports?type=revenue-month-till-date' },
      { id: 'service-sales', label: 'Service Sales', href: '/admin/reports?type=service-sales' },
      { id: 'service-type', label: 'Service Type', href: '/admin/reports?type=service-type' },
      { id: 'package-sales-report', label: 'Package Sales Report', href: '/admin/reports?type=package-sales-report' },
      { id: 'registration-fee', label: 'Registration Fee', href: '/admin/reports?type=registration-fee' },
      { id: 'old-upgrade-report', label: 'Old Upgrade Report', href: '/admin/reports?type=old-upgrade-report' },
      { id: 'new-upgrade-report', label: 'New Upgrade Report', href: '/admin/reports?type=new-upgrade-report' },
      { id: 'cross-sell-report', label: 'Cross Sell Report', href: '/admin/reports?type=cross-sell-report' },
      { id: 'cross-sell-conversion', label: 'Cross Sell Conversion', href: '/admin/reports?type=cross-sell-conversion' },
      { id: 'non-transacted-report', label: 'Not Interested Report', href: '/admin/reports?type=non-transacted-report' },
      { id: 'pt-sales-report', label: 'PT Sales Report', href: '/admin/reports?type=pt-sales-report' },
      { id: 'corporate-sales', label: 'Corporate Sales', href: '/admin/reports?type=corporate-sales' },
      { id: 'space-wise-utilization', label: 'Sports Wise Utilization Report', href: '/admin/reports?type=space-wise-utilization' },
      { id: 'court-wise-utilization', label: 'Court Wise Utilization Report', href: '/admin/reports?type=court-wise-utilization' },
      { id: 'tv-member-price-map', label: 'Turf/Venue Heat Map', href: '/admin/reports?type=tv-member-price-map' },
      { id: 'inquiry-convert', label: 'Enquiry Conversion Report', href: '/admin/reports?type=inquiry-convert' },
    ],
  },
  {
    id: 'appointments',
    name: 'Appointments & Trials',
    items: [
      { id: 'trial-appointments', label: 'Trial Appointments', href: '/admin/reports?type=trial-appointments' },
      { id: 'trial-classes', label: 'Trial Classes', href: '/admin/reports?type=trial-classes' },
      { id: 'other-appointments', label: 'Other Appointments', href: '/admin/reports?type=other-appointments' },
      { id: 'enquiry-appointments', label: 'Enquiry Appointments', href: '/admin/reports?type=enquiry-appointments' },
      { id: 'clients-appointment', label: 'Clients Appointment', href: '/admin/reports?type=clients-appointment' },
      { id: 'trial-conversion', label: 'Trial Conversion', href: '/admin/reports?type=trial-conversion' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    items: [
      { id: 'estimate', label: 'Estimate', href: '/admin/reports?type=estimate' },
      { id: 'all-invoices', label: 'All Invoices', href: '/admin/reports?type=all-invoices' },
      { id: 'paid-invoices', label: 'Paid Invoices', href: '/admin/reports?type=paid-invoices' },
      { id: 'receipts', label: 'Receipts', href: '/admin/reports?type=receipts' },
      { id: 'pending-collections', label: 'Pending Collections', href: '/admin/reports?type=pending-collections' },
      { id: 'cancelled-invoices', label: 'Cancelled Invoices', href: '/admin/reports?type=cancelled-invoices' },
      { id: 'written-off-invoices', label: 'Written Off Invoices', href: '/admin/reports?type=written-off-invoices' },
      { id: 'refund-report', label: 'Refund Report', href: '/admin/reports?type=refund-report' },
      { id: 'sales-accounting', label: 'Sales (Accounting)', href: '/admin/reports?type=sales-accounting' },
      { id: 'sales-return-accounting', label: 'Sales Return (Accounting)', href: '/admin/reports?type=sales-return-accounting' },
      { id: 'effective-sales-accounting', label: 'Effective Sales (Accounting)', href: '/admin/reports?type=effective-sales-accounting' },
      { id: 'revenue-realization', label: 'Revenue Realization', href: '/admin/reports?type=revenue-realization' },
      { id: 'revenue-realization-sale', label: 'Revenue Realization (Sale)', href: '/admin/reports?type=revenue-realization-sale' },
      { id: 'revenue-realization-base-value', label: 'Revenue Realization (Base Value)', href: '/admin/reports?type=revenue-realization-base-value' },
      { id: 'revenue-realization-fy', label: 'Revenue Realization (FY)', href: '/admin/reports?type=revenue-realization-fy' },
      { id: 'revenue-vs-utilization', label: 'Revenue VS Utilization', href: '/admin/reports?type=revenue-vs-utilization' },
      { id: 'collection-report', label: 'Collection Report', href: '/admin/reports?type=collection-report' },
      { id: 'cashflow-statement', label: 'Cashflow Statement', href: '/admin/reports?type=cashflow-statement' },
      { id: 'payment-mode', label: 'Payment Mode', href: '/admin/reports?type=payment-mode' },
      { id: 'payment-mode-advance-payment', label: 'Payment Mode - Advance Payment', href: '/admin/reports?type=payment-mode-advance-payment' },
      { id: 'backdated-bills', label: 'Backdated Bills', href: '/admin/reports?type=backdated-bills' },
      { id: 'advance-payment-balance', label: 'Advance Payment Balance', href: '/admin/reports?type=advance-payment-balance' },
      { id: 'advance-payment-received', label: 'Advance Payment Received', href: '/admin/reports?type=advance-payment-received' },
      { id: 'advance-payment-utilized', label: 'Advance Payment Utilized', href: '/admin/reports?type=advance-payment-utilized' },
      { id: 'advance-payment-cancelled', label: 'Advance Payment Cancelled', href: '/admin/reports?type=advance-payment-cancelled' },
      { id: 'discount-report', label: 'Discount Report', href: '/admin/reports?type=discount-report' },
      { id: 'estimate-cancelled', label: 'Estimate Cancelled', href: '/admin/reports?type=estimate-cancelled' },
    ],
  },
  {
    id: 'client-management',
    name: 'Client Management',
    items: [
      { id: 'renewal-vs-attrition', label: 'Renewal Vs Attrition', href: '/admin/reports?type=renewal-vs-attrition' },
      { id: 'upgrade-report', label: 'Upgrade Report', href: '/admin/reports?type=upgrade-report' },
      { id: 'client-check-ins', label: 'Client Check-Ins', href: '/admin/reports?type=client-check-ins' },
      { id: 'multiclub-client-check-ins', label: 'MultiClub Client Check-Ins', href: '/admin/reports?type=multiclub-client-check-ins' },
      { id: 'attendance-register', label: 'Attendance Register', href: '/admin/reports?type=attendance-register' },
      { id: 'new-clients', label: 'New Clients', href: '/admin/reports?type=new-clients' },
      { id: 'renewals', label: 'Renewals', href: '/admin/reports?type=renewals' },
      { id: 'membership', label: 'Membership', href: '/admin/reports?type=membership' },
      { id: 'membership-expiry', label: 'Membership Expiry', href: '/admin/reports/membership-expiry' },
      { id: 'pt-expiry', label: 'PT Expiry', href: '/admin/reports/pt-expiry' },
      { id: 'members-not-called', label: 'Members Not Called', href: '/admin/reports?type=members-not-called' },
      { id: 'irregular-members', label: 'Irregular Members', href: '/admin/reports?type=irregular-members' },
      { id: 'active-clients-summary', label: 'Active Clients Summary', href: '/admin/reports?type=active-clients-summary' },
      { id: 'inactive-clients-summary', label: 'Inactive Clients Summary', href: '/admin/reports?type=inactive-clients-summary' },
      { id: 'multiclub-clients', label: 'Multiclub Clients', href: '/admin/reports?type=multiclub-clients' },
      { id: 'archived-clients', label: 'Archived Clients', href: '/admin/reports?type=archived-clients' },
      { id: 'freeze-change-date', label: 'Freeze & Change Date', href: '/admin/reports?type=freeze-change-date' },
      { id: 'suspensions', label: 'Suspensions', href: '/admin/reports?type=suspensions' },
      { id: 'attendance-heat-map', label: 'Attendance Heat Map', href: '/admin/reports?type=attendance-heat-map' },
      { id: 'transfer-service', label: 'Transfer Service', href: '/admin/reports?type=transfer-service' },
      { id: 'client-birthday-anniversary', label: 'Client Birthday & Anniversary', href: '/admin/reports?type=client-birthday-anniversary' },
      { id: 'client-attendance', label: 'Client Attendance', href: '/admin/reports?type=client-attendance' },
      { id: 'data-hygiene-report', label: 'Data Hygiene Report', href: '/admin/reports?type=data-hygiene-report' },
      { id: 'additional-information', label: 'Additional Information', href: '/admin/reports?type=additional-information' },
      { id: 'membership-retention', label: 'Membership Retention', href: '/admin/reports?type=membership-retention' },
      { id: 'cancellation-report', label: 'Cancellation Report', href: '/admin/reports?type=cancellation-report' },
      { id: 'support-requests', label: 'Support Requests', href: '/admin/reports?type=support-requests' },
      { id: 'profile-change-report', label: 'Profile Change Report', href: '/admin/reports?type=profile-change-report' },
      { id: 'referrers', label: 'Referrers', href: '/admin/reports?type=referrers' },
      { id: 'one-time-purchasers', label: 'One Time Purchasers', href: '/admin/reports?type=one-time-purchasers' },
      { id: 'average-lifetime-value', label: 'Average Lifetime Value', href: '/admin/reports?type=average-lifetime-value' },
      { id: 'referral-bonus', label: 'Referral Bonus', href: '/admin/reports?type=referral-bonus' },
    ],
  },
  {
    id: 'staff',
    name: 'Staff',
    items: [
      { id: 'staff-check-ins', label: 'Staff Check-Ins', href: '/admin/reports?type=staff-check-ins' },
      { id: 'staff-leave', label: 'Staff Leave', href: '/admin/reports?type=staff-leave' },
      { id: 'staff-attendance-register', label: 'Attendance Register', href: '/admin/reports?type=staff-attendance-register' },
      { id: 'biometric-staff', label: 'Biometric Staff', href: '/admin/reports?type=biometric-staff' },
      { id: 'trial-utilisation', label: 'Trial Utilisation', href: '/admin/reports?type=trial-utilisation' },
      { id: 'class-usage-report', label: 'Class Usage Report', href: '/admin/reports?type=class-usage-report' },
      { id: 'class-no-show-report', label: 'Class No Show Report', href: '/admin/reports?type=class-no-show-report' },
      { id: 'view-staff-substitution', label: 'View Staff Substitution', href: '/admin/reports?type=view-staff-substitution' },
      { id: 'staff-birthday-anniversary', label: 'Staff Birthday & Anniversary', href: '/admin/reports?type=staff-birthday-anniversary' },
      { id: 'staff-data-hygiene-report', label: 'Data Hygiene Report', href: '/admin/reports?type=staff-data-hygiene-report' },
      { id: 'staff-wise-collection-report', label: 'Staff Wise Collection Report', href: '/admin/reports?type=staff-wise-collection-report' },
      { id: 'call-log-report', label: 'Call Log Report', href: '/admin/reports?type=call-log-report' },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    items: [
      { id: 'stock-movement', label: 'Stock Movement', href: '/admin/reports?type=stock-movement' },
      { id: 'product-reorder-alert', label: 'Product Reorder Alert', href: '/admin/reports?type=product-reorder-alert' },
      { id: 'supplier', label: 'Supplier', href: '/admin/reports?type=supplier' },
      { id: 'internal', label: 'Internal', href: '/admin/reports?type=internal' },
      { id: 'rental', label: 'Rental', href: '/admin/reports?type=rental' },
      { id: 'product-expiry', label: 'Product Expiry', href: '/admin/reports?type=product-expiry' },
      { id: 'product-in-use', label: 'Product In Use', href: '/admin/reports?type=product-in-use' },
      { id: 'product-consumption', label: 'Product Consumption', href: '/admin/reports?type=product-consumption' },
      { id: 'products-offered', label: 'Products Offered', href: '/admin/reports?type=products-offered' },
      { id: 'new-joiner-vs-products-offered', label: 'New Joiner Vs Products Offered', href: '/admin/reports?type=new-joiner-vs-products-offered' },
    ],
  },
  {
    id: 'expense',
    name: 'Expense',
    items: [
      { id: 'expense-report', label: 'Expense Report', href: '/admin/reports?type=expense-report' },
      { id: 'consolidated-expense-report', label: 'Consolidated Expense Report', href: '/admin/reports?type=consolidated-expense-report' },
      { id: 'approval-status', label: 'Approval Status', href: '/admin/reports?type=approval-status' },
      { id: 'reimbursements', label: 'Reimbursements', href: '/admin/reports?type=reimbursements' },
    ],
  },
  {
    id: 'training',
    name: 'Training',
    items: [
      { id: 'fitness-goal-report', label: 'Fitness Goal Report', href: '/admin/reports?type=fitness-goal-report' },
      { id: 'pt-conversion', label: 'PT Conversion', href: '/admin/reports?type=pt-conversion' },
      { id: 'pt-retention', label: 'PT Retention', href: '/admin/reports?type=pt-retention' },
    ],
  },
];

export const ReportsSidebar: React.FC<ReportsSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ general: true });

  // Handle click outside to close
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (sidebarRef.current && sidebarRef.current.contains(target)) return;
      if (target.closest('[data-nav-item="Reports"]')) return;
      onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleItemClick = (href: string) => {
    navigate(href);
    onClose();
  };

  // Filter categories/items by search query
  const filteredCategories = REPORT_CATEGORIES.map((cat) => {
    if (!searchQuery.trim()) return cat;
    const q = searchQuery.toLowerCase();
    if (cat.name.toLowerCase().includes(q)) return cat;
    const filteredItems = cat.items.filter((item) => item.label.toLowerCase().includes(q));
    if (filteredItems.length === 0) return null;
    return { ...cat, items: filteredItems };
  }).filter(Boolean) as ReportCategory[];

  // Auto-expand categories when searching
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const autoExpand: Record<string, boolean> = {};
      filteredCategories.forEach((cat) => { autoExpand[cat.id] = true; });
      setExpandedCategories(autoExpand);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-20"
        onClick={onClose}
      />

      {/* Sidebar panel - appears to the right of the icon sidebar (left: 96px = w-24) */}
      <div
        ref={sidebarRef}
        className="fixed top-0 left-24 h-full w-64 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-xl"
        style={{ animation: 'slideInFromLeft 0.15s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-800 dark:text-white">Reports</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
            />
          </div>
        </div>

        {/* Categories list */}
        <div className="flex-1 overflow-y-auto py-1">
          {filteredCategories.map((cat) => {
            const isExpanded = Boolean(expandedCategories[cat.id]);

            return (
              <div key={cat.id}>
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                    isExpanded
                      ? 'text-orange-500 bg-orange-50/60 dark:bg-orange-950/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-orange-500'
                  }`}
                >
                  <span>{cat.name}</span>
                  {isExpanded ? (
                    <ChevronDown size={13} className={isExpanded ? 'text-orange-400 flex-shrink-0' : 'text-gray-400 flex-shrink-0'} />
                  ) : (
                    <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Category items */}
                {isExpanded && (
                  <div>
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item.href)}
                        className="w-full text-left px-7 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 cursor-pointer transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Downloaded Files — standalone link at bottom */}
          <button
            type="button"
            onClick={() => handleItemClick('/admin/reports?type=downloaded-files')}
            className="w-full flex items-center px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-orange-500 cursor-pointer transition-colors"
          >
            Downloaded Files
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};
