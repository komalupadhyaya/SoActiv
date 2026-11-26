import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Search, Trash2, ChevronDown } from 'lucide-react';
import { useServices, ServiceItem, ServiceVariation } from '../../hooks/useServices';
import { useStaff } from '../../hooks/useStaff';

export interface ProFormaItem {
  id: string;
  serviceName: string;
  baseServiceName?: string;
  serviceVariationName?: string;
  daysPerWeek?: string;
  serviceType?: string;
  startDate: string;
  expiryDate: string;
  sessions: string;
  sacCode: string;
  duration: string;
  quantity: number | string;
  fee: number | string;
  discount: number;
  discountType: 'percentage' | 'flat';
  taxRate: number; // 0, 5, 10, 12, 18, 28
}

export interface PaymentModeEntry {
  id: string;
  mode: string;
  amount: number;
  rrnOrLast4?: string;
  chequeNumber?: string;
  draftNumber?: string;
  txnId?: string;
  thirdPartyName?: string;
  payrollRef?: string;
  accountTransferNotes?: string;
  bankName?: string;
}

interface ProFormaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceData: any) => Promise<void> | void;
  memberData?: {
    fullName?: string;
    contactNumber?: string;
    email?: string;
    salesRep?: string;
    salesRepName?: string;
    packagePrice?: string | number;
    serviceName?: string;
    serviceVariationName?: string;
    duration?: string;
    startDate?: string;
    expiryDate?: string;
    invoiceDate?: string;
    personalTrainer?: string;
    makePtAsSalesRep?: boolean;
    paymentMode?: string;
    paymentMethod?: string;
    paymentModes?: PaymentModeEntry[];
    activeServiceText?: string;
  };
  initialItems?: ProFormaItem[];
  initialPaymentModes?: PaymentModeEntry[];
  recentPurchasedServices?: any[];
  staffList?: Array<{ _id: string; fullName: string; position?: string }>;
  gymInfo?: {
    name?: string;
    address?: string;
    phone?: string;
  };
}

const getLocalDateISO = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateExpiryDate = (startDateStr: string, months?: number, days?: number) => {
  if (!startDateStr) return '';
  const date = new Date(startDateStr);
  if (isNaN(date.getTime())) return '';

  if (months && months > 0) {
    date.setMonth(date.getMonth() + months);
  } else if (days && days > 0) {
    date.setDate(date.getDate() + days);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
};

const parseTaxRate = (taxStr?: string) => {
  if (!taxStr || taxStr === 'No Tax') return 0;
  if (taxStr.includes('5%')) return 5;
  if (taxStr.includes('10%')) return 10;
  if (taxStr.includes('12%')) return 12;
  if (taxStr.includes('18%')) return 18;
  if (taxStr.includes('28%')) return 28;
  return 0;
};

export const ProFormaInvoiceModal: React.FC<ProFormaInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberData,
  initialItems,
  initialPaymentModes,
  recentPurchasedServices,
  staffList = [],
  gymInfo,
}) => {
  const { services, fetchServices } = useServices();
  const { staff, fetchAllStaff } = useStaff();

  const [invoiceType, setInvoiceType] = useState<'service' | 'package' | 'deal'>('service');
  const [invoiceDate, setInvoiceDate] = useState<string>(getLocalDateISO());
  const [salesRep, setSalesRep] = useState<string>('');
  const [personalTrainer, setPersonalTrainer] = useState<string>('');
  const [makePtAsSalesRep, setMakePtAsSalesRep] = useState<boolean>(false);
  const [memberSearchText, setMemberSearchText] = useState<string>('');

  // Service Dropdown and Search Modal states
  const [openServiceDropdownIdx, setOpenServiceDropdownIdx] = useState<number | null>(null);
  const [isSearchServiceModalOpen, setIsSearchServiceModalOpen] = useState<boolean>(false);
  const [activeItemIndexForModal, setActiveItemIndexForModal] = useState<number>(0);
  const [modalSearchTerm, setModalSearchTerm] = useState<string>('');

  const [items, setItems] = useState<ProFormaItem[]>([
    {
      id: '1',
      serviceName: '',
      startDate: getLocalDateISO(),
      expiryDate: '',
      sessions: 'NaN',
      sacCode: '',
      duration: '',
      quantity: '',
      fee: '',
      discount: 0,
      discountType: 'percentage',
      taxRate: 0,
    },
  ]);

  const allStaff = useMemo(() => {
    if (staffList && staffList.length > 0) return staffList;
    if (staff && staff.length > 0) return staff;
    return [];
  }, [staffList, staff]);

  // Check if any selected item is a Personal Session / Personal Training / PT service
  const hasPersonalSession = useMemo(() => {
    return items.some((item) => {
      const name = (item.serviceName || '').toLowerCase();
      return (
        name.includes('personal session') ||
        name.includes('personal training') ||
        name.includes('personal') ||
        name.includes('pt')
      );
    });
  }, [items]);

  const [paymentModes, setPaymentModes] = useState<PaymentModeEntry[]>([
    { id: '1', mode: 'Select', amount: 0 },
  ]);

  const [discountReason, setDiscountReason] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isConfirmSaveModalOpen, setIsConfirmSaveModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchServices(undefined, true);
      fetchAllStaff?.();
    }
  }, [isOpen, fetchServices, fetchAllStaff]);

  // Close service dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.service-dropdown-container')) {
        setOpenServiceDropdownIdx(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (memberData || recentPurchasedServices) {
      if (memberData) {
        const name = memberData.fullName || '';
        const phone = memberData.contactNumber || '';
        setMemberSearchText(name && phone ? `${name} - ${phone}` : name || phone);
        if (memberData.salesRep) {
          setSalesRep(memberData.salesRep);
        }
        if (memberData.invoiceDate) {
          setInvoiceDate(memberData.invoiceDate);
        } else {
          setInvoiceDate(getLocalDateISO());
        }
        if (memberData.personalTrainer) {
          setPersonalTrainer(memberData.personalTrainer);
        } else {
          setPersonalTrainer('');
        }
        if (memberData.makePtAsSalesRep) {
          setMakePtAsSalesRep(true);
        } else {
          setMakePtAsSalesRep(false);
        }
      }

      if (initialItems && initialItems.length > 0) {
        setItems(initialItems);
        if (initialPaymentModes && initialPaymentModes.length > 0) {
          setPaymentModes(initialPaymentModes);
        } else {
          const totalFee = initialItems.reduce((acc, it) => acc + (Number(it.fee) || 0), 0);
          setPaymentModes([{ id: '1', mode: 'Cash', amount: totalFee }]);
        }
      } else if (recentPurchasedServices && recentPurchasedServices.length > 0) {
        setItems(
          recentPurchasedServices.map((svc: any, idx: number) => ({
            id: String(idx + 1),
            serviceName: svc.serviceName || svc.name || '',
            baseServiceName: svc.baseServiceName,
            serviceVariationName: svc.serviceVariationName,
            daysPerWeek: svc.daysPerWeek,
            serviceType: svc.serviceType,
            startDate: svc.startDate || getLocalDateISO(),
            expiryDate: svc.expiryDate || svc.endDate || '',
            sessions: svc.sessions || 'NaN',
            sacCode: svc.sacCode || '',
            duration: svc.duration || svc.serviceVariationName || '',
            quantity: svc.quantity || 1,
            fee: Number(svc.fee) || Number(svc.price) || Number(memberData?.packagePrice) || 0,
            discount: svc.discount || 0,
            discountType: svc.discountType || 'percentage',
            taxRate: svc.taxRate || 0,
          }))
        );

        const totalAmount = Number(recentPurchasedServices[0]?.fee) || Number(recentPurchasedServices[0]?.price) || Number(memberData?.packagePrice) || 0;
        const clientPaymentMode = (memberData as any)?.paymentMode || (memberData as any)?.paymentMethod || (recentPurchasedServices[0]?.paymentMode) || 'Cash';

        if ((memberData as any)?.paymentModes && (memberData as any).paymentModes.length > 0) {
          setPaymentModes((memberData as any).paymentModes);
        } else {
          setPaymentModes([
            { id: '1', mode: clientPaymentMode, amount: totalAmount },
          ]);
        }
      } else if (memberData?.serviceName) {
        setItems([
          {
            id: '1',
            serviceName: memberData.serviceName,
            startDate: memberData.startDate || getLocalDateISO(),
            expiryDate: memberData.expiryDate || '',
            sessions: 'NaN',
            sacCode: '',
            duration: memberData.duration || memberData.serviceVariationName || '',
            quantity: 1,
            fee: Number(memberData.packagePrice) || 0,
            discount: 0,
            discountType: 'percentage',
            taxRate: 0,
          },
        ]);

        const totalAmount = Number(memberData.packagePrice) || 0;
        const clientPaymentMode = (memberData as any)?.paymentMode || 'Cash';
        setPaymentModes([
          { id: '1', mode: clientPaymentMode, amount: totalAmount },
        ]);
      } else {
        // Brand new client / invoice: clean empty initial row with no prefilled service
        setItems([
          {
            id: '1',
            serviceName: '',
            startDate: getLocalDateISO(),
            expiryDate: '',
            sessions: 'NaN',
            sacCode: '',
            duration: '',
            quantity: '',
            fee: '',
            discount: 0,
            discountType: 'percentage',
            taxRate: 0,
          },
        ]);
        setPaymentModes([
          { id: '1', mode: 'Select', amount: 0 },
        ]);
      }
    }
  }, [memberData, recentPurchasedServices, isOpen]);

  const activeServices = useMemo(
    () => services.filter((s) => s.status !== false),
    [services]
  );

  if (!isOpen) return null;

  // Row operations
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        serviceName: '',
        startDate: getLocalDateISO(),
        expiryDate: '',
        sessions: 'NaN',
        sacCode: '',
        duration: '',
        quantity: '',
        fee: '',
        discount: 0,
        discountType: 'percentage',
        taxRate: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProFormaItem, value: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Select variation for row
  const handleSelectVariationForInvoice = (
    rowIndex: number,
    service: ServiceItem,
    variation: ServiceVariation,
    durationStr: string
  ) => {
    const variationTaxRate = parseTaxRate(variation.tax);
    const selectedTaxRate = variationTaxRate > 0 ? variationTaxRate : (items[rowIndex]?.taxRate ?? 0);
    const isFeeOrNoDates =
      durationStr === '-' ||
      (service.name || '').toLowerCase().includes('transfer fee') ||
      (variation.name || '').toLowerCase().includes('transfer fee') ||
      (service.name || '').toLowerCase().includes('fee') ||
      variation.serviceType === 'Addon' ||
      variation.serviceType === 'Fee';

    const startDate = items[rowIndex]?.startDate || getLocalDateISO();
    const expiryDate = isFeeOrNoDates
      ? ''
      : calculateExpiryDate(
          startDate,
          variation.serviceType === 'Membership' ? variation.months : undefined,
          variation.validityInDays
        );

    setItems((prev) =>
      prev.map((item, i) =>
        i === rowIndex
          ? {
              ...item,
              serviceName: `${service.name} - ${variation.name}`,
              baseServiceName: service.name,
              serviceVariationName: variation.name,
              daysPerWeek: variation.daysPerWeek || '6 Days Per week',
              serviceType: variation.serviceType || 'Membership',
              duration: isFeeOrNoDates ? '-' : durationStr,
              fee: Number(variation.price) || 0,
              sessions: variation.sessions && variation.sessions !== 'NaN' ? String(variation.sessions) : 'NaN',
              sacCode: service.sacCode || variation.sacCode || '9997',
              taxRate: selectedTaxRate,
              startDate: startDate,
              expiryDate: expiryDate,
            }
          : item
      )
    );
  };

  // Get all variations combined across all active services
  const allVariationsWithService = activeServices.flatMap((s) =>
    (s.variations || [])
      .filter((v) => v.status !== false)
      .map((v) => ({
        service: s,
        variation: v,
      }))
  );

  const filteredModalVariations = allVariationsWithService.filter(({ service, variation }) => {
    if (!modalSearchTerm.trim()) return true;
    const term = modalSearchTerm.toLowerCase();
    return (
      service.name.toLowerCase().includes(term) ||
      variation.name.toLowerCase().includes(term) ||
      (variation.serviceType && variation.serviceType.toLowerCase().includes(term)) ||
      (variation.duration && variation.duration.toLowerCase().includes(term)) ||
      String(variation.price).includes(term)
    );
  });

  // Payment mode operations
  const handleAddPaymentMode = () => {
    setPaymentModes((prev) => [
      ...prev,
      { id: Date.now().toString(), mode: 'Select', amount: 0 },
    ]);
  };

  const handleRemovePaymentMode = (index: number) => {
    if (paymentModes.length <= 1) return;
    setPaymentModes((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaymentModeChange = (index: number, field: keyof PaymentModeEntry, value: any) => {
    setPaymentModes((prev) =>
      prev.map((pm, i) => (i === index ? { ...pm, [field]: value } : pm))
    );
  };

  // Calculations
  const calculateItemBaseTaxable = (item: ProFormaItem) => {
    const fee = Number(item.fee) || 0;
    const qty = Number(item.quantity) || 1;
    const base = fee * qty;
    let discountAmount = 0;
    if (item.discountType === 'percentage') {
      discountAmount = (base * (Number(item.discount) || 0)) / 100;
    } else {
      discountAmount = Number(item.discount) || 0;
    }
    return Math.max(0, base - discountAmount);
  };

  const calculateItemTaxAmount = (item: ProFormaItem) => {
    const discounted = calculateItemBaseTaxable(item);
    const taxRate = Number(item.taxRate) || 0;
    if (taxRate > 0) {
      return (discounted * taxRate) / 100;
    }
    return 0;
  };

  const calculateSubTotal = () => {
    return items.reduce((acc, item) => acc + calculateItemBaseTaxable(item), 0);
  };

  const calculateTaxDue = () => {
    return items.reduce((acc, item) => acc + calculateItemTaxAmount(item), 0);
  };

  const subTotal = calculateSubTotal();
  const taxDue = calculateTaxDue();
  const totalExact = subTotal + taxDue;
  const rounding = Math.round(totalExact) - totalExact;
  const totalDue = Math.round(totalExact);

  const totalPaid = paymentModes.reduce((acc, pm) => acc + (Number(pm.amount) || 0), 0);
  const pendingAmount = Math.max(0, totalDue - totalPaid);

  const handleSaveClick = () => {
    setIsConfirmSaveModalOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmSaveModalOpen(false);
    setIsSaving(true);
    try {
      await onSave({
        invoiceType,
        invoiceDate,
        salesRep,
        personalTrainer,
        makePtAsSalesRep,
        memberSearchText,
        items,
        subTotal,
        taxDue,
        totalDue,
        rounding,
        paymentModes,
        totalPaid,
        paid: totalPaid,
        pending: pendingAmount,
        pendingAmount,
        discountReason,
        customerNotes,
        internalNotes,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const defaultGymName = gymInfo?.name || 'Pro Ultimate Gyms';
  const defaultGymAddress = gymInfo?.address || 'SCO 9 & 10 First Floor, Hollywood Plaza Market, VIP Road Zirakpur';
  const defaultGymPhone = gymInfo?.phone || '+91 9876543210';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Add Pro Forma Invoice
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-lg font-bold p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-gray-800 dark:text-gray-200 text-sm">
          
          {/* Radio Buttons: Service, Package, Deal */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="radio"
                name="invoiceType"
                value="service"
                checked={invoiceType === 'service'}
                onChange={() => setInvoiceType('service')}
                className="w-4 h-4 text-sky-600 focus:ring-sky-500"
              />
              Service
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="radio"
                name="invoiceType"
                value="package"
                checked={invoiceType === 'package'}
                onChange={() => setInvoiceType('package')}
                className="w-4 h-4 text-sky-600 focus:ring-sky-500"
              />
              Package
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="radio"
                name="invoiceType"
                value="deal"
                checked={invoiceType === 'deal'}
                onChange={() => setInvoiceType('deal')}
                className="w-4 h-4 text-sky-600 focus:ring-sky-500"
              />
              Deal
            </label>
          </div>

          {/* Top Info Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pt-2">
            {/* Left Gym Details */}
            <div className="space-y-1">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {defaultGymName}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {defaultGymAddress}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Phone : {defaultGymPhone}
              </p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-24 shrink-0">
                  Name/Mobile Number
                </span>
                <input
                  type="text"
                  placeholder="Name/Mobile Number"
                  value={memberSearchText}
                  onChange={(e) => setMemberSearchText(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1"
                />
              </div>
              {memberData?.activeServiceText && (
                <div className="pt-1.5 text-xs font-semibold text-red-500">
                  {memberData.activeServiceText}
                </div>
              )}
            </div>

            {/* Center Pro Forma Invoice Title */}
            <div className="text-center md:pt-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pro Forma Invoice
              </h2>
            </div>

            {/* Right Invoice Date & Sales Rep */}
            <div className="space-y-2.5 md:pl-6">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-28 shrink-0">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onClick={(e) => {
                    try {
                      (e.target as any).showPicker?.();
                    } catch (_) {}
                  }}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1 cursor-pointer"
                />
              </div>

              {/* Shown when Personal Session is selected */}
              {hasPersonalSession && (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-28 shrink-0">
                      Personal Trainer
                    </label>
                    <select
                      value={personalTrainer}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPersonalTrainer(val);
                        if (makePtAsSalesRep && val) {
                          setSalesRep(val);
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1"
                    >
                      <option value="">Select</option>
                      {allStaff.map((s: any) => (
                        <option key={s._id} value={s._id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pl-28">
                    <input
                      type="checkbox"
                      id="makePtAsSalesRep"
                      checked={makePtAsSalesRep}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setMakePtAsSalesRep(checked);
                        if (checked && personalTrainer) {
                          setSalesRep(personalTrainer);
                        }
                      }}
                      className="w-3.5 h-3.5 text-sky-600 rounded border-gray-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="makePtAsSalesRep" className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                      Make PT as Sales Rep
                    </label>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 w-28 shrink-0">
                  Sales Rep
                </label>
                <select
                  value={salesRep}
                  onChange={(e) => setSalesRep(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 flex-1"
                >
                  <option value="">Select Sales Rep</option>
                  {allStaff.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Items / Description Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700/70 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                    <th className="py-2.5 px-3 w-12 border-r border-gray-200 dark:border-gray-700">S.NO</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">DESCRIPTION</th>
                    <th className="py-2.5 px-3 w-28 border-r border-gray-200 dark:border-gray-700">DURATION</th>
                    <th className="py-2.5 px-3 w-20 border-r border-gray-200 dark:border-gray-700">QUANTITY</th>
                    <th className="py-2.5 px-3 w-56 border-r border-gray-200 dark:border-gray-700">SERVICE FEE</th>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="p-1 bg-white dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded text-gray-700 dark:text-white font-bold transition-colors cursor-pointer"
                        title="Add Row"
                      >
                        <Plus size={14} />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="align-top hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                      {/* S.No */}
                      <td className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 text-center font-medium text-gray-700 dark:text-gray-300">
                        {idx + 1}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="relative service-dropdown-container">
                          <div className="flex items-center gap-1.5">
                            <div
                              onClick={() => setOpenServiceDropdownIdx(openServiceDropdownIdx === idx ? null : idx)}
                              className="flex-1 flex items-center justify-between px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer select-none text-xs hover:border-gray-400"
                            >
                              <span className={item.serviceName ? 'text-gray-900 dark:text-white font-medium truncate' : 'text-gray-400'}>
                                {item.serviceName || 'Select service'}
                              </span>
                              <ChevronDown size={14} className="text-gray-500 shrink-0 ml-1" />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenServiceDropdownIdx(null);
                                setActiveItemIndexForModal(idx);
                                setModalSearchTerm('');
                                setIsSearchServiceModalOpen(true);
                              }}
                              className="p-1.5 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-pointer shrink-0 transition-colors"
                              title="Search Service Variation"
                            >
                              <Search size={14} />
                            </button>
                          </div>

                          {/* Image 1: Dark dropdown listing all active services */}
                          {openServiceDropdownIdx === idx && (
                            <div className="absolute left-0 top-full mt-1 w-56 bg-[#1f1d1d] dark:bg-[#18181b] text-gray-100 rounded shadow-2xl py-1.5 z-50 border border-neutral-700 max-h-60 overflow-y-auto">
                              {activeServices.length === 0 ? (
                                <div className="px-3.5 py-2 text-xs text-gray-400">No active services available</div>
                              ) : (
                                activeServices.map((s) => (
                                  <div
                                    key={s._id}
                                    onClick={() => {
                                      setOpenServiceDropdownIdx(null);
                                      setActiveItemIndexForModal(idx);
                                      setModalSearchTerm(s.name);
                                      setIsSearchServiceModalOpen(true);
                                    }}
                                    className="px-3.5 py-2 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-700 hover:text-[#ff5e28] cursor-pointer transition-colors uppercase tracking-wide"
                                  >
                                    {s.name}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                        {item.duration !== '-' && !(item.serviceName || '').toLowerCase().includes('transfer fee') && !(item.serviceName || '').toLowerCase().includes('registration fee') && (
                          <>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <span>Start date :</span>
                                <input
                                  type="date"
                                  value={item.startDate}
                                  onClick={(e) => {
                                    try {
                                      (e.target as any).showPicker?.();
                                    } catch (_) {}
                                  }}
                                  onChange={(e) => handleItemChange(idx, 'startDate', e.target.value)}
                                  className="px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-[11px] cursor-pointer"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Expiry date :</span>
                                <input
                                  type="date"
                                  value={item.expiryDate}
                                  onClick={(e) => {
                                    try {
                                      (e.target as any).showPicker?.();
                                    } catch (_) {}
                                  }}
                                  onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                                  className="px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-[11px] cursor-pointer"
                                />
                              </div>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-0.5">
                              <p>Number of sessions : {item.sessions}</p>
                              <p>SAC Code : {item.sacCode || '-'}</p>
                            </div>
                          </>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 border-r border-gray-200 dark:border-gray-700">
                        <input
                          type="text"
                          placeholder="e.g. 1 Month"
                          value={item.duration}
                          onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 border-r border-gray-200 dark:border-gray-700">
                        <input
                          type="number"
                          min="1"
                          placeholder=""
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </td>

                      {/* Service Fee & Discounts */}
                      <td className="py-3 px-3 border-r border-gray-200 dark:border-gray-700 space-y-2">
                        <input
                          type="number"
                          placeholder="0"
                          value={item.fee}
                          onChange={(e) => handleItemChange(idx, 'fee', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-gray-600 dark:text-gray-400 shrink-0">Discount :</span>
                          <input
                            type="number"
                            min="0"
                            value={item.discount || ''}
                            onChange={(e) => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right text-xs"
                          />
                          <select
                            value={item.discountType}
                            onChange={(e) => handleItemChange(idx, 'discountType', e.target.value as any)}
                            className="px-1 py-0.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                          >
                            <option value="percentage">%</option>
                            <option value="flat">₹</option>
                          </select>
                        </div>
                        <div className="w-full px-2 py-1 bg-[#d9d9d9] dark:bg-gray-700 text-gray-900 dark:text-white rounded border border-gray-300 dark:border-gray-600 text-right text-xs font-normal">
                          {item.fee ? calculateItemBaseTaxable(item).toFixed(0) : ''}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Sub Total */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} rowSpan={9} className="border-r border-gray-300 dark:border-gray-600 bg-transparent"></td>
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Sub Total
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <div className="w-full px-3 py-1.5 bg-[#adadad] text-gray-900 rounded-sm text-sm font-normal text-left">
                        {subTotal.toFixed(0)}
                      </div>
                    </td>
                  </tr>

                  {/* Tax due */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      <div className="flex items-center justify-between">
                        <span>Tax due</span>
                        <select
                          value={items[0]?.taxRate ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setItems((prev) => prev.map((it) => ({ ...it, taxRate: val })));
                          }}
                          className="px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                        >
                          <option value={0}>No Tax</option>
                          <option value={5}>GST 5%</option>
                          <option value={10}>GST 10%</option>
                          <option value={12}>GST 12%</option>
                          <option value={18}>GST 18%</option>
                          <option value={28}>GST 28%</option>
                        </select>
                      </div>
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <div className="w-full px-3 py-1.5 bg-[#adadad] text-gray-900 rounded-sm text-sm font-normal text-left">
                        {taxDue.toFixed(0)}
                      </div>
                    </td>
                  </tr>

                  {/* Total Due */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Total Due
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <div className="w-full px-3 py-1.5 bg-[#adadad] text-gray-900 rounded-sm text-sm font-normal text-left">
                        {totalDue.toFixed(0)}
                      </div>
                    </td>
                  </tr>

                  {/* Rounding */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Rounding
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <div className="w-full px-3 py-1.5 bg-[#adadad] text-gray-900 rounded-sm text-sm font-normal text-left">
                        {rounding.toFixed(0)}
                      </div>
                    </td>
                  </tr>

                  {/* MODE OF PAYMENT */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={4} className="p-3">
                      <div className="text-center font-bold text-gray-900 dark:text-white text-xs tracking-wider mb-2">
                        MODE OF PAYMENT
                      </div>
                      <div className="space-y-2">
                        {paymentModes.map((pm, pmIdx) => (
                          <div key={pm.id} className="p-2 border border-gray-300 dark:border-gray-600 rounded flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <select
                              value={pm.mode}
                              onChange={(e) => handlePaymentModeChange(pmIdx, 'mode', e.target.value)}
                              className={`${
                                pm.mode === 'Credit Card' || pm.mode === 'Debit Card' || pm.mode === 'Cheque' || pm.mode === 'Draft' || pm.mode === 'Online Payment' || pm.mode === 'Auto/Direct Debit' || pm.mode === 'Third Party' || pm.mode === 'Payroll' || pm.mode === 'Account Transfer'
                                  ? 'w-auto min-w-[120px]'
                                  : 'w-1/2'
                              } px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer`}
                            >
                              <option value="Select">Select</option>
                              <option value="Cash">Cash</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Debit Card">Debit Card</option>
                              <option value="Cheque">Cheque</option>
                              <option value="Draft">Draft</option>
                              <option value="Online Payment">Online Payment</option>
                              <option value="Auto/Direct Debit">Auto/Direct Debit</option>
                              <option value="Third Party">Third Party</option>
                              <option value="Payroll">Payroll</option>
                              <option value="Account Transfer">Account Transfer</option>
                              <option value="Google Pay">Google Pay</option>
                              <option value="Paytm">Paytm</option>
                              <option value="Phone pay">Phone pay</option>
                              <option value="UPI">UPI</option>
                            </select>

                            {/* Credit Card / Debit Card fields */}
                            {(pm.mode === 'Credit Card' || pm.mode === 'Debit Card') && (
                              <>
                                <input
                                  type="text"
                                  placeholder="RRN/last 4 digit"
                                  value={pm.rrnOrLast4 || ''}
                                  onChange={(e) => handlePaymentModeChange(pmIdx, 'rrnOrLast4', e.target.value)}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Bank Name"
                                  value={pm.bankName || ''}
                                  onChange={(e) => handlePaymentModeChange(pmIdx, 'bankName', e.target.value)}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </>
                            )}

                            {/* Cheque fields */}
                            {pm.mode === 'Cheque' && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Cheque Number"
                                  value={pm.chequeNumber || ''}
                                  onChange={(e) => handlePaymentModeChange(pmIdx, 'chequeNumber', e.target.value)}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Bank Name"
                                  value={pm.bankName || ''}
                                  onChange={(e) => handlePaymentModeChange(pmIdx, 'bankName', e.target.value)}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </>
                            )}

                            {/* Draft fields */}
                            {pm.mode === 'Draft' && (
                              <>
                                <input
                                  type="text"
                                  placeholder="Draft Number"
                                  value={pm.draftNumber || ''}
                                  onChange={(e) => handlePaymentModeChange(pmIdx, 'draftNumber', e.target.value)}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Bank Name"
                                  value={pm.bankName || ''}
                                  onChange={(e) => handlePaymentModeChange(pmIdx, 'bankName', e.target.value)}
                                  className="w-28 sm:w-32 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </>
                            )}

                            {/* Online Payment & Auto/Direct Debit fields */}
                            {(pm.mode === 'Online Payment' || pm.mode === 'Auto/Direct Debit') && (
                              <input
                                type="text"
                                placeholder="TXN"
                                value={pm.txnId || ''}
                                onChange={(e) => handlePaymentModeChange(pmIdx, 'txnId', e.target.value)}
                                className="w-28 sm:w-36 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            )}

                            {/* Third Party fields */}
                            {pm.mode === 'Third Party' && (
                              <input
                                type="text"
                                placeholder="Third Party - Name"
                                value={pm.thirdPartyName || ''}
                                onChange={(e) => handlePaymentModeChange(pmIdx, 'thirdPartyName', e.target.value)}
                                className="w-32 sm:w-44 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            )}

                            {/* Payroll fields */}
                            {pm.mode === 'Payroll' && (
                              <input
                                type="text"
                                placeholder="Payroll"
                                value={pm.payrollRef || ''}
                                onChange={(e) => handlePaymentModeChange(pmIdx, 'payrollRef', e.target.value)}
                                className="w-28 sm:w-36 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            )}

                            {/* Account Transfer fields */}
                            {pm.mode === 'Account Transfer' && (
                              <input
                                type="text"
                                placeholder="Notes"
                                value={pm.accountTransferNotes || ''}
                                onChange={(e) => handlePaymentModeChange(pmIdx, 'accountTransferNotes', e.target.value)}
                                className="w-28 sm:w-36 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                            )}

                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={pm.amount || ''}
                              onChange={(e) => handlePaymentModeChange(pmIdx, 'amount', parseFloat(e.target.value) || 0)}
                              className="flex-1 min-w-[70px] px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 text-left"
                            />
                            <button
                              type="button"
                              onClick={handleAddPaymentMode}
                              className="p-1.5 text-gray-800 dark:text-gray-200 hover:text-orange-600 font-bold transition-colors cursor-pointer"
                              title="Add payment mode"
                            >
                              <Plus size={18} className="stroke-[2.5]" />
                            </button>
                            {paymentModes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePaymentMode(pmIdx)}
                                className="p-1.5 text-red-500 hover:text-red-700 transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>

                  {/* Pending */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Pending
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <div className="w-full px-3 py-1.5 bg-[#adadad] text-gray-900 rounded-sm text-sm font-normal text-left">
                        {pendingAmount.toFixed(0)}
                      </div>
                    </td>
                  </tr>

                  {/* Discount Reason */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Discount Reason
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <input
                        type="text"
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                  </tr>

                  {/* Notes for Customer */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Notes for Customer: (This will appear in the invoice copy)
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <input
                        type="text"
                        maxLength={240}
                        placeholder="Maximum 240 characters"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                  </tr>

                  {/* Internal Notes */}
                  <tr className="border-t border-gray-300 dark:border-gray-600">
                    <td colSpan={2} className="py-2 px-4 border-r border-gray-300 dark:border-gray-600 text-sm font-normal text-gray-800 dark:text-gray-200">
                      Internal Notes:
                    </td>
                    <td colSpan={2} className="py-1.5 px-3">
                      <input
                        type="text"
                        maxLength={240}
                        placeholder="Maximum 240 characters"
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden mt-4">
            <div className="bg-gray-100 dark:bg-gray-700/70 px-3 py-1.5 font-bold text-xs text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              TERMS AND CONDITIONS
            </div>
            <div className="p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1 bg-white dark:bg-gray-800">
              <p>FEES ONCE PAID IS NOT REFUNDABLE</p>
              <p>TRANSFER & FREEZING CHARGES ARE APPLICABLE</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveClick}
            className="px-6 py-2 text-xs font-semibold text-white bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 rounded shadow-sm transition-colors cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>

      {/* Save Confirmation Modal Popup (matching screenshot) */}
      {isConfirmSaveModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-24 sm:pt-28 bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-[#242424] text-white rounded-md shadow-2xl w-full max-w-md p-5 border border-neutral-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-sm font-medium text-gray-200 mb-2">
              {gymInfo?.name || 'Confirm Invoice'}
            </div>
            <div className="text-sm text-gray-300 mb-6">
              Would you like to save this bill?
            </div>
            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmSaveModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-neutral-700/60 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-1.5 text-xs font-semibold text-gray-900 bg-[#7c9ee8] hover:bg-[#6b8ed8] rounded shadow-sm transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image 2: Search Service Modal */}
      {isSearchServiceModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[88vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-[#f1f5f9] dark:bg-gray-800">
              <h3 className="font-semibold text-sm sm:text-base text-gray-700 dark:text-gray-200">
                Search Service
              </h3>
              <button
                type="button"
                onClick={() => setIsSearchServiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              {/* Search input */}
              <div className="max-w-xs">
                <input
                  type="text"
                  placeholder="Search Service Variation"
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Variations Table */}
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[#0284c7] font-semibold">
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Service Name</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Service Variation</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Duration</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Service Type</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Reg Fee</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Amount</th>
                      <th className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700">Session(s)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredModalVariations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400">
                          No matching service variations found
                        </td>
                      </tr>
                    ) : (
                      filteredModalVariations.map(({ service, variation }, vIdx) => {
                        const durationStr =
                          variation.duration ||
                          (variation.months ? `${variation.months} Month${variation.months > 1 ? 's' : ''}` : '') ||
                          '1 Month';
                        return (
                          <tr key={`${service._id}-${vIdx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                              {service.name}
                            </td>
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {variation.name}
                            </td>
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {durationStr}
                            </td>
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {variation.serviceType || 'Membership'}
                            </td>
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {variation.registrationFee ? 'Yes' : '-'}
                            </td>
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white">
                              {variation.price}
                            </td>
                            <td className="py-2.5 px-3 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                              {variation.sessions && variation.sessions !== 'NaN' ? variation.sessions : 'NA'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectVariationForInvoice(activeItemIndexForModal, service, variation, durationStr);
                                  setIsSearchServiceModalOpen(false);
                                }}
                                className="text-red-500 hover:text-red-700 hover:underline font-semibold text-xs cursor-pointer"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
