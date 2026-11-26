import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useServices, ServiceItem, ServiceVariation } from '../../hooks/useServices';
import { Plus, Info, ChevronDown, X, Trash2, Edit2, Search, PlusSquare } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const ServiceManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const srvId = searchParams.get('srv');

  const {
    services,
    loading,
    fetchServices,
    createService,
    updateService,
    deleteService,
    togglePromote,
    toggleStatus,
    addVariation,
    deleteVariation,
    toggleVariationStatus,
  } = useServices();

  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Variations Page Filters
  const [variationTypeFilter, setVariationTypeFilter] = useState<string>('All Type');
  const [variationSearchTerm, setVariationSearchTerm] = useState<string>('');
  const [activeVariationDropdownId, setActiveVariationDropdownId] = useState<string | null>(null);

  // Modals state
  const [isAddServiceOpen, setIsAddServiceOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceFormName, setServiceFormName] = useState<string>('');
  const [serviceFormDesc, setServiceFormDesc] = useState<string>('');
  const [serviceFormPromote, setServiceFormPromote] = useState<boolean>(true);
  const [serviceFormStatus, setServiceFormStatus] = useState<boolean>(true);

  // Variation modals
  const [isAddVariationOpen, setIsAddVariationOpen] = useState<boolean>(false);
  const [selectedServiceForVariation, setSelectedServiceForVariation] = useState<ServiceItem | null>(null);
  const [editingVariation, setEditingVariation] = useState<ServiceVariation | null>(null);
  const [variationForm, setVariationForm] = useState({
    name: '',
    serviceType: 'Membership',
    price: '1',
    timeHours: '0',
    timeMinutes: '15',
    numberOfSessions: '2',
    daysPerWeek: '1 Day Per week',
    months: '1',
    validityInDays: '1',
    maxMembers: '1',
    tax: 'No Tax',
    accessType: 'Individual',
    category: 'General Membership',
    otpVerification: false,
    upgradable: true,
    transferable: false,
    appointmentsApplicable: false,
    allowFreeze: true,
    maxFreezeDays: '0',
    minFreezeDays: '1',
    registrationFee: false,
    minFeeLimit: '0',
    maxFeeLimit: '0',
    eligibleForReferralBonus: false,
    referralBonusFromPurchase: false,
    termBatchDate: false,
    promoteOnWebsite: false,
  });

  // View variations modal
  const [isViewVariationsOpen, setIsViewVariationsOpen] = useState<boolean>(false);
  const [selectedServiceForView, setSelectedServiceForView] = useState<ServiceItem | null>(null);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Handle Search
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchServices(searchTerm);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.options-dropdown-container')) {
        setActiveDropdownId(null);
        setActiveVariationDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Open Add Service
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceFormName('');
    setServiceFormDesc('');
    setServiceFormPromote(true);
    setServiceFormStatus(true);
    setIsAddServiceOpen(true);
  };

  // Open Edit Service
  const handleOpenEditService = (service: ServiceItem) => {
    setEditingService(service);
    setServiceFormName(service.name);
    setServiceFormDesc(service.description || '');
    setServiceFormPromote(service.promote);
    setServiceFormStatus(service.status);
    setIsAddServiceOpen(true);
    setActiveDropdownId(null);
  };

  // Save Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceFormName.trim()) {
      showToast('Service name is required', 'error');
      return;
    }

    // Close modal immediately so UI is never blocked
    setIsAddServiceOpen(false);

    // Fire API in background
    if (editingService) {
      const res = await updateService(editingService._id, {
        name: serviceFormName.trim(),
        description: serviceFormDesc,
        promote: serviceFormPromote,
        status: serviceFormStatus,
      });
      if (res.success) {
        showToast('Service updated successfully', 'success');
        await fetchServices();
      } else {
        showToast(res.message || 'Failed to update service', 'error');
      }
    } else {
      const res = await createService({
        name: serviceFormName.trim(),
        description: serviceFormDesc,
        promote: serviceFormPromote,
        status: serviceFormStatus,
      });
      if (res.success) {
        showToast('Service created successfully', 'success');
        await fetchServices();
      } else {
        showToast(res.message || 'Failed to create service', 'error');
      }
    }
  };

  // Delete Service
  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const res = await deleteService(serviceId);
      if (res.success) {
        showToast('Service deleted successfully', 'success');
      } else {
        showToast(res.message || 'Failed to delete service', 'error');
      }
    }
    setActiveDropdownId(null);
  };

  // Open Add Variation
  const handleOpenAddVariation = (service: ServiceItem) => {
    setSelectedServiceForVariation(service);
    setEditingVariation(null);
    setVariationForm({
      name: '',
      serviceType: 'Multiple Sessions',
      price: '1',
      timeHours: '0',
      timeMinutes: '15',
      numberOfSessions: '2',
      daysPerWeek: '1 Day Per week',
      months: '1',
      validityInDays: '1',
      maxMembers: '1',
      tax: 'No Tax',
      accessType: 'Individual',
      category: 'General Membership',
      otpVerification: false,
      upgradable: true,
      transferable: false,
      appointmentsApplicable: false,
      allowFreeze: true,
      maxFreezeDays: '0',
      minFreezeDays: '1',
      registrationFee: false,
      minFeeLimit: '0',
      maxFeeLimit: '0',
      eligibleForReferralBonus: false,
      referralBonusFromPurchase: false,
      termBatchDate: false,
      promoteOnWebsite: false,
    });
    setIsAddVariationOpen(true);
    setActiveDropdownId(null);
  };

  // Open Edit Variation
  const handleOpenEditVariation = (service: ServiceItem, variation: ServiceVariation) => {
    setSelectedServiceForVariation(service);
    setEditingVariation(variation);
    setVariationForm({
      name: variation.name || '',
      serviceType: variation.serviceType || 'Membership',
      price: String(variation.price ?? '1'),
      timeHours: String(variation.timeHours ?? '0'),
      timeMinutes: String(variation.timeMinutes ?? '15'),
      numberOfSessions: String(variation.sessions || '2'),
      daysPerWeek: variation.daysPerWeek || '1 Day Per week',
      months: String(variation.months ?? '1'),
      validityInDays: String(variation.validityInDays ?? '1'),
      maxMembers: String(variation.maxMembers ?? '1'),
      tax: variation.tax || 'No Tax',
      accessType: variation.accessType || 'Individual',
      category: variation.category || 'General Membership',
      otpVerification: variation.otpVerification || false,
      upgradable: variation.upgradable !== undefined ? variation.upgradable : true,
      transferable: variation.transferable || false,
      appointmentsApplicable: variation.appointmentsApplicable || false,
      allowFreeze: variation.allowFreeze !== undefined ? variation.allowFreeze : true,
      maxFreezeDays: String(variation.maxFreezeDays ?? '0'),
      minFreezeDays: String(variation.minFreezeDays ?? '1'),
      registrationFee: variation.registrationFee || false,
      minFeeLimit: String(variation.minFeeLimit ?? '0'),
      maxFeeLimit: String(variation.maxFeeLimit ?? '0'),
      eligibleForReferralBonus: variation.eligibleForReferralBonus || false,
      referralBonusFromPurchase: variation.referralBonusFromPurchase || false,
      termBatchDate: variation.termBatchDate || false,
      promoteOnWebsite: variation.promoteOnWebsite || false,
    });
    setIsAddVariationOpen(true);
    setActiveVariationDropdownId(null);
  };

  // Save Variation
  const handleSaveVariation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variationForm.name.trim()) {
      showToast('Service Variations Name is required', 'error');
      return;
    }
    if (variationForm.serviceType === 'Select' || !variationForm.serviceType) {
      showToast('Please choose a Service Type', 'error');
      return;
    }

    if (selectedServiceForVariation) {
      // Close modal immediately so UI is never blocked
      setIsAddVariationOpen(false);
      setSearchParams({ srv: selectedServiceForVariation._id });

      const durationStr =
        variationForm.serviceType === 'Membership'
          ? `${variationForm.months} Month${Number(variationForm.months) > 1 ? 's' : ''}`
          : `${variationForm.validityInDays} Day(s)`;

      const sessionsVal =
        variationForm.serviceType === '1 Session'
          ? '1'
          : variationForm.serviceType === 'Multiple Sessions'
          ? variationForm.numberOfSessions
          : 'NaN';

      // Fire API in background
      const res = await addVariation(selectedServiceForVariation._id, {
        name: variationForm.name.trim(),
        duration: durationStr,
        price: Number(variationForm.price) || 0,
        sessions: sessionsVal,
        sacCode: selectedServiceForVariation.sacCode || '9997',
        serviceType: variationForm.serviceType,
        timeHours: Number(variationForm.timeHours) || 0,
        timeMinutes: Number(variationForm.timeMinutes) || 0,
        daysPerWeek: variationForm.daysPerWeek,
        months: Number(variationForm.months) || 1,
        validityInDays:
          variationForm.serviceType === 'Membership'
            ? (Number(variationForm.months) || 1) * 30
            : Number(variationForm.validityInDays) || 1,
        maxMembers: Number(variationForm.maxMembers) || 1,
        tax: variationForm.tax,
        accessType: variationForm.serviceType === '1 Session' ? 'Individual' : variationForm.accessType,
        category: variationForm.category,
        otpVerification: variationForm.otpVerification,
        upgradable: variationForm.upgradable,
        transferable: variationForm.transferable,
        appointmentsApplicable: variationForm.appointmentsApplicable,
        allowFreeze: variationForm.allowFreeze,
        maxFreezeDays: Number(variationForm.maxFreezeDays) || 0,
        minFreezeDays: Number(variationForm.minFreezeDays) || 1,
        registrationFee: variationForm.registrationFee,
        minFeeLimit: Number(variationForm.minFeeLimit) || 0,
        maxFeeLimit: Number(variationForm.maxFeeLimit) || 0,
        eligibleForReferralBonus: variationForm.eligibleForReferralBonus,
        referralBonusFromPurchase: variationForm.referralBonusFromPurchase,
        termBatchDate: variationForm.termBatchDate,
        promoteOnWebsite: variationForm.promoteOnWebsite,
      });
      if (res.success) {
        showToast('Variation added successfully', 'success');
        await fetchServices();
      } else {
        showToast(res.message || 'Failed to add variation', 'error');
      }
    }
  };

  // Open View Variations
  const handleOpenViewVariations = (service: ServiceItem) => {
    setSearchParams({ srv: service._id });
  };

  // Delete single variation
  const handleDeleteVariation = async (serviceId: string, variationId: string) => {
    if (window.confirm('Are you sure you want to remove this variation?')) {
      const res = await deleteVariation(serviceId, variationId);
      if (res.success) {
        showToast('Variation removed', 'success');
        await fetchServices();
      } else {
        showToast(res.message || 'Failed to remove variation', 'error');
      }
    }
  };

  const currentService = services.find((s) => s._id === srvId);

  // Filter variations for current service view
  const filteredVariations = currentService
    ? (currentService.variations || []).filter((v) => {
        const matchesType =
          variationTypeFilter === 'All Type' || v.serviceType === variationTypeFilter;
        const matchesSearch =
          !variationSearchTerm.trim() ||
          v.name.toLowerCase().includes(variationSearchTerm.toLowerCase()) ||
          (v.serviceType && v.serviceType.toLowerCase().includes(variationSearchTerm.toLowerCase())) ||
          (v.price && String(v.price).includes(variationSearchTerm));
        return matchesType && matchesSearch;
      })
    : [];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 p-4 sm:p-6 space-y-6">
      
      {/* Breadcrumb Navigation */}
      <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 gap-2">
        <Link to="/admin/dashboard" className="hover:text-gray-700 dark:hover:text-gray-200">
          Home
        </Link>
        <span>/</span>
        <span>Setup</span>
        <span>/</span>
        <span>General</span>
        <span>/</span>
        <span className="text-[#ff5e28] font-semibold">Service Management</span>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200/80 dark:border-gray-700 p-5 sm:p-6 space-y-6">
        
        {/* ========================================================================= */}
        {/* VIEW 1: SERVICE VARIATIONS PAGE (when ?srv=<serviceId> is active) */}
        {/* ========================================================================= */}
        {currentService ? (
          <div className="space-y-6">
            {/* Top Controls: Back Button, Service Selector, Type Dropdown, Search, Add Variation */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded shadow-2xs transition-colors cursor-pointer"
                >
                  Back
                </button>

                {/* Service Selector Dropdown */}
                <div className="relative">
                  <select
                    value={currentService._id}
                    onChange={(e) => setSearchParams({ srv: e.target.value })}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border-2 border-[#38bdf8] rounded bg-[#e0f7fa] dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-xs"
                  >
                    {services.map((s) => (
                      <option
                        key={s._id}
                        value={s._id}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                      >
                        {s.name.toUpperCase()}{s.status === false ? ' (Disabled)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* All Type Filter Dropdown */}
                <select
                  value={variationTypeFilter}
                  onChange={(e) => setVariationTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs cursor-pointer min-w-[110px]"
                >
                  <option value="All Type">All Type</option>
                  <option value="Membership">Membership</option>
                  <option value="1 Session">1 Session</option>
                  <option value="Multiple Sessions">Multiple Sessions</option>
                  <option value="1 Day pass">1 Day pass</option>
                  <option value="Multiple Day pass">Multiple Day pass</option>
                  <option value="Admin fee">Admin fee</option>
                </select>

                {/* Search Input & Go Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search"
                    value={variationSearchTerm}
                    onChange={(e) => setVariationSearchTerm(e.target.value)}
                    className="px-3.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs w-44 sm:w-56"
                  />
                  <button
                    type="button"
                    className="px-5 py-1.5 text-xs font-semibold text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded transition-colors shadow-2xs cursor-pointer"
                  >
                    Go
                  </button>
                </div>
              </div>

              {/* Right: Add Variation Button */}
              <div>
                <button
                  type="button"
                  disabled={!currentService.status}
                  onClick={() => handleOpenAddVariation(currentService)}
                  className={`px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-2xs transition-colors ${
                    currentService.status
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  title={currentService.status ? 'Add Variation' : 'Activate this service to add variations'}
                >
                  Add Variation
                </button>
              </div>
            </div>

            {!currentService.status && (
              <div className="px-4 py-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 font-medium">
                This service is currently disabled (Status: Off). Variations under this service cannot be used until the service is turned On.
              </div>
            )}

            {/* Variations Table */}
            <div className="overflow-x-auto border border-gray-200/80 dark:border-gray-700 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 font-bold text-gray-800 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-750">
                    <th className="py-3 px-4 w-16 text-center">S.No</th>
                    <th className="py-3 px-4">Variation Id</th>
                    <th className="py-3 px-4">Service Variations</th>
                    <th className="py-3 px-4">Service Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Service Fee</th>
                    <th className="py-3 px-4 text-center">Online Sale</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center w-24">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {filteredVariations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        No variations found. Click "Add Variation" to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredVariations.map((v, index) => (
                      <tr
                        key={v._id || index}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors"
                      >
                        {/* S.No with orange plus */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-bold">
                            <span className="text-[#ff5e28] text-base leading-none">+</span>
                            <span className="text-gray-900 dark:text-white">{index + 1}</span>
                          </span>
                        </td>

                        {/* Variation Id */}
                        <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                          {108886 + index}
                        </td>

                        {/* Service Variations Name */}
                        <td className="py-3.5 px-4 font-semibold text-gray-900 dark:text-white">
                          {v.name}
                        </td>

                        {/* Service Type */}
                        <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                          {v.serviceType || 'Membership'}
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                          {v.serviceType === 'Membership'
                            ? `${v.daysPerWeek || '6 Days Per week'}. Valid for ${v.months || 1} month(s).`
                            : v.serviceType === '1 Day pass'
                            ? 'Valid for 1 day(s)'
                            : v.serviceType === 'Multiple Day pass'
                            ? `Valid for ${v.validityInDays || 2} day(s)`
                            : v.validityInDays
                            ? `Valid for ${v.validityInDays} day(s)`
                            : v.sessions && v.sessions !== 'NaN'
                            ? `${v.sessions} sessions`
                            : v.duration || '-'}
                        </td>

                        {/* Service Fee */}
                        <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                          ₹ {Number(v.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Online Sale */}
                        <td className="py-3.5 px-4 text-center text-gray-700 dark:text-gray-300">
                          {v.promoteOnWebsite ? 'Yes' : 'No'}
                        </td>

                        {/* Status Switch */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            disabled={!currentService.status}
                            onClick={() => toggleVariationStatus(currentService._id, v._id)}
                            className={`inline-flex items-center justify-between w-14 h-7 px-1.5 rounded transition-colors border ${
                              !currentService.status ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                            }${
                              v.status !== false
                                ? 'bg-[#00a82d] border-[#009226] text-white'
                                : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 flex-row-reverse'
                            }`}
                          >
                            <span className="text-[11px] font-bold tracking-wide">
                              {v.status !== false ? 'On' : 'Off'}
                            </span>
                            <span className="w-4 h-5 bg-white rounded-xs shadow-xs" />
                          </button>
                        </td>

                        {/* Options: Dropdown button */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="relative inline-block text-left options-dropdown-container">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveVariationDropdownId(
                                  activeVariationDropdownId === v._id ? null : v._id
                                );
                              }}
                              className="px-2.5 py-1.5 text-white bg-[#1e293b] hover:bg-[#0f172a] rounded transition-colors cursor-pointer text-xs"
                            >
                              <ChevronDown size={14} />
                            </button>

                            {activeVariationDropdownId === v._id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded shadow-xl border border-gray-200 dark:border-gray-700 py-1.5 z-40 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVariationDropdownId(null);
                                    handleOpenEditVariation(currentService, v);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Edit2 size={13} className="text-[#0ea5e9]" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVariationDropdownId(null);
                                    handleDeleteVariation(currentService._id, v._id);
                                  }}
                                  className="w-full px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} className="text-[#ef4444]" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveVariationDropdownId(null);
                                    showToast(`Add products to "${v.name}"`, 'info');
                                  }}
                                  className="w-full px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <PlusSquare size={13} className="text-gray-700 dark:text-gray-300" />
                                  <span>Add Products</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: MAIN SERVICES LIST PAGE */
          /* ========================================================================= */
          <>
            {/* Top Controls: Search Bar on Left, Action Buttons on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search Box */}
              <form onSubmit={handleSearch} className="flex items-center gap-2.5 max-w-md w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-semibold text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded-md transition-colors shadow-2xs cursor-pointer"
                >
                  Go
                </button>
              </form>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/services/new')}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  Add New Service
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  Playgrounds
                </button>
              </div>
            </div>

            {/* Services Table */}
            <div className="overflow-x-auto border border-gray-200/80 dark:border-gray-700 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 font-bold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800">
                    <th className="py-4 px-6 w-24 text-center">S.No</th>
                    <th className="py-4 px-6">Service Name</th>
                    <th className="py-4 px-6 text-center">Service Variations</th>
                    <th className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <span>Promote</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 dark:bg-slate-300 inline-block" />
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center w-52">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        Loading services...
                      </td>
                    </tr>
                  ) : services.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        No services found. Click "Add New Service" to create one.
                      </td>
                    </tr>
                  ) : (
                    services.map((service, index) => {
                      const isDisabled = !service.status;
                      return (
                      <tr
                        key={service._id}
                        className={`transition-colors ${
                          isDisabled
                            ? 'bg-gray-50/80 dark:bg-gray-800/60 opacity-75'
                            : 'hover:bg-gray-50/50 dark:hover:bg-gray-750'
                        }`}
                      >
                        {/* S.No with orange plus */}
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            <span className="text-[#ff5e28] text-base leading-none">+</span>
                            <span className="text-gray-900 dark:text-white">{index + 1}</span>
                          </span>
                        </td>

                        {/* Service Name */}
                        <td className="py-4 px-6 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className={isDisabled ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}>
                              {service.name}
                            </span>
                            {isDisabled && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                Disabled
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Service Variations */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenViewVariations(service)}
                            className="inline-flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-300 hover:opacity-80 transition-opacity cursor-pointer font-medium"
                          >
                            <span className="text-gray-800 dark:text-gray-200">{service.variations?.length || 0}</span>
                            <span className="text-[#ff5e28] font-medium">View</span>
                          </button>
                        </td>

                        {/* Promote Switch */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            disabled={isDisabled}
                            onClick={() => togglePromote(service._id)}
                            className={`inline-flex items-center justify-between w-14 h-7 px-1.5 rounded transition-colors border ${
                              isDisabled ? 'opacity-50 cursor-not-allowed ' : 'cursor-pointer '
                            }${
                              service.promote
                                ? 'bg-[#00a82d] border-[#009226] text-white'
                                : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 flex-row-reverse'
                            }`}
                          >
                            <span className="text-[11px] font-bold tracking-wide">
                              {service.promote ? 'On' : 'Off'}
                            </span>
                            <span className="w-4 h-5 bg-white rounded-xs shadow-xs" />
                          </button>
                        </td>

                        {/* Status Switch */}
                        <td className="py-4 px-6 text-center">
                          <button
                            type="button"
                            onClick={() => toggleStatus(service._id)}
                            className={`inline-flex items-center justify-between w-14 h-7 px-1.5 rounded transition-colors cursor-pointer border ${
                              service.status
                                ? 'bg-[#00a82d] border-[#009226] text-white'
                                : 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 flex-row-reverse'
                            }`}
                          >
                            <span className="text-[11px] font-bold tracking-wide">
                              {service.status ? 'On' : 'Off'}
                            </span>
                            <span className="w-4 h-5 bg-white rounded-xs shadow-xs" />
                          </button>
                        </td>

                        {/* Options: Split button */}
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center rounded-md shadow-2xs options-dropdown-container relative">
                            {/* Add Variation Button */}
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => handleOpenAddVariation(service)}
                              className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-l-md transition-colors whitespace-nowrap ${
                                isDisabled
                                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                                  : 'bg-[#ff5e28] hover:bg-[#ea4f1b] cursor-pointer'
                              }`}
                              title={isDisabled ? 'Activate service to add variations' : 'Add Variation'}
                            >
                              + Add Variation
                            </button>

                            {/* Dropdown Toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdownId(
                                  activeDropdownId === service._id ? null : service._id
                                );
                              }}
                              className="px-2 py-1.5 text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-r-md transition-colors cursor-pointer border-l border-slate-700"
                            >
                              <ChevronDown size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownId === service._id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-30 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    navigate(`/admin/services/edit/${service._id}`);
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  <Edit2 size={12} /> Edit Service
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleStatus(service._id)}
                                  className="w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                  {service.status ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteService(service._id)}
                                  className="w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 size={12} /> Delete Service
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 1. Modal: Add / Edit Service */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gym Membership, Diet, Freezing"
                  value={serviceFormName}
                  onChange={(e) => setServiceFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional description"
                  value={serviceFormDesc}
                  onChange={(e) => setServiceFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={serviceFormPromote}
                    onChange={(e) => setServiceFormPromote(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  Promote by default
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={serviceFormStatus}
                    onChange={(e) => setServiceFormStatus(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded shadow-xs transition-colors cursor-pointer"
                >
                  {editingService ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Add Variation */}
      {isAddVariationOpen && selectedServiceForVariation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 my-auto max-h-[95vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="px-6 py-3.5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                Add Service Variation for <span className="uppercase">{selectedServiceForVariation.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddVariationOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Choose Service Type bar */}
            <div className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Choose Service type <span className="text-red-500">*</span>
              </span>
              <select
                value={variationForm.serviceType}
                onChange={(e) => {
                  const newType = e.target.value;
                  setVariationForm((prev) => ({
                    ...prev,
                    serviceType: newType,
                    validityInDays: newType === 'Multiple Day pass' ? '2' : newType === '1 Day pass' ? '1' : prev.validityInDays,
                  }));
                }}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500 min-w-[160px]"
              >
                <option value="Select">Select</option>
                <option value="1 Session">1 Session</option>
                <option value="Membership">Membership</option>
                <option value="Multiple Sessions">Multiple Sessions</option>
                <option value="1 Day pass">1 Day pass</option>
                <option value="Multiple Day pass">Multiple Day pass</option>
                <option value="Admin fee">Admin fee</option>
              </select>
            </div>

            <form onSubmit={handleSaveVariation} className="flex-1 overflow-y-auto flex flex-col justify-between">
              {/* Form Content 2-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-6 p-6">
                
                {/* Left Column */}
                <div className="space-y-3.5 text-xs sm:text-sm">
                  {/* Service Variations Name */}
                  <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                    <label className="font-bold text-gray-800 dark:text-gray-200">
                      Service Variations Name<span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={variationForm.name}
                        onChange={(e) => setVariationForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                      <span className="text-red-500 font-bold">*</span>
                      <div
                        className="w-4 h-4 rounded-full bg-[#0088ff] text-white flex items-center justify-center text-[11px] font-bold shrink-0 cursor-help"
                        title="Enter the name for this service variation"
                      >
                        ?
                      </div>
                    </div>
                  </div>

                  {/* Service Fee */}
                  <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                    <label className="font-bold text-gray-800 dark:text-gray-200">
                      Service Fee
                    </label>
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={variationForm.price}
                        onChange={(e) => setVariationForm((prev) => ({ ...prev, price: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Time (Hours) & Time (Minutes) - for 1 Session and Multiple Sessions */}
                  {(variationForm.serviceType === '1 Session' || variationForm.serviceType === 'Multiple Sessions') && (
                    <>
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Time (Hours)
                        </label>
                        <div>
                          <select
                            value={variationForm.timeHours}
                            onChange={(e) => setVariationForm((prev) => ({ ...prev, timeHours: e.target.value }))}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Time (Minutes)
                        </label>
                        <div>
                          <select
                            value={variationForm.timeMinutes}
                            onChange={(e) => setVariationForm((prev) => ({ ...prev, timeMinutes: e.target.value }))}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Multiple Sessions Specific: Number of Sessions */}
                  {variationForm.serviceType === 'Multiple Sessions' && (
                    <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                      <label className="font-bold text-gray-800 dark:text-gray-200">
                        Number of Sessions
                      </label>
                      <div>
                        <select
                          value={variationForm.numberOfSessions}
                          onChange={(e) => setVariationForm((prev) => ({ ...prev, numberOfSessions: e.target.value }))}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          {[
                            ...Array.from({ length: 999 }, (_, i) => String(i + 2)),
                            '1095',
                            'Unlimited',
                          ].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Middle section fields - hidden for Admin fee */}
                  {variationForm.serviceType !== 'Admin fee' && (
                    <>
                      {/* Membership Specific: No.of Days Per Week & Month(s) */}
                      {variationForm.serviceType === 'Membership' && (
                        <>
                          <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800 dark:text-gray-200">
                              No.of Days Per Week<span className="text-red-500">*</span>
                            </label>
                            <div>
                              <select
                                value={variationForm.daysPerWeek}
                                onChange={(e) => setVariationForm((prev) => ({ ...prev, daysPerWeek: e.target.value }))}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                <option value="1 Day Per week">1 Day Per week</option>
                                <option value="2 Days Per week">2 Days Per week</option>
                                <option value="3 Days Per week">3 Days Per week</option>
                                <option value="4 Days Per week">4 Days Per week</option>
                                <option value="5 Days Per week">5 Days Per week</option>
                                <option value="6 Days Per week">6 Days Per week</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800 dark:text-gray-200">
                              Month(s)<span className="text-red-500">*</span>
                            </label>
                            <div>
                              <select
                                value={variationForm.months}
                                onChange={(e) => setVariationForm((prev) => ({ ...prev, months: e.target.value }))}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                {Array.from({ length: 100 }, (_, i) => i + 1).map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Validity in day(s) - for non-Membership and non-Admin fee types */}
                      {variationForm.serviceType !== 'Membership' && (
                        <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                          <label className="font-bold text-gray-800 dark:text-gray-200">
                            Validity in day(s)<span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {variationForm.serviceType === '1 Day pass' ? (
                              <select
                                value={variationForm.validityInDays}
                                onChange={(e) => setVariationForm((prev) => ({ ...prev, validityInDays: e.target.value }))}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                <option value="1">1</option>
                              </select>
                            ) : variationForm.serviceType === 'Multiple Day pass' ? (
                              <select
                                value={variationForm.validityInDays}
                                onChange={(e) => setVariationForm((prev) => ({ ...prev, validityInDays: e.target.value }))}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                              >
                                {Array.from({ length: 364 }, (_, i) => i + 2).map((d) => (
                                  <option key={d} value={d}>
                                    {d}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="number"
                                min="1"
                                value={variationForm.validityInDays}
                                onChange={(e) => setVariationForm((prev) => ({ ...prev, validityInDays: e.target.value }))}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                required
                              />
                            )}
                            {variationForm.serviceType !== '1 Day pass' && variationForm.serviceType !== 'Multiple Day pass' && (
                              <span className="text-red-500 font-bold">*</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Maximum Member(s) / Member(s) */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          {variationForm.serviceType === 'Membership' ? 'Member(s)' : 'Maximum Member(s)'}
                        </label>
                        <div>
                          <input
                            type="number"
                            value={variationForm.maxMembers}
                            disabled
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Tax */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Tax
                        </label>
                        <div>
                          <select
                            value={variationForm.tax}
                            onChange={(e) => setVariationForm((prev) => ({ ...prev, tax: e.target.value }))}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            <option value="No Tax">No Tax</option>
                            <option value="GST 5%">GST 5%</option>
                            <option value="GST 12%">GST 12%</option>
                            <option value="GST 18%">GST 18%</option>
                            <option value="GST 28%">GST 28%</option>
                          </select>
                        </div>
                      </div>

                      {/* Access Type - hidden when 1 Session is chosen */}
                      {variationForm.serviceType !== '1 Session' && (
                        <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                          <label className="font-bold text-gray-800 dark:text-gray-200">
                            Access Type<span className="text-red-500">*</span>
                          </label>
                          <div>
                            <select
                              value={variationForm.accessType}
                              onChange={(e) => setVariationForm((prev) => ({ ...prev, accessType: e.target.value }))}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="Select Access Type">Select Access Type</option>
                              <option value="Individual">Individual</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Choose Category */}
                      <div className="grid grid-cols-[170px_1fr] items-start gap-2 pt-1">
                        <label className="font-bold text-gray-800 dark:text-gray-200 pt-0.5">
                          Choose Category<span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-xs sm:text-sm">
                          {[
                            ['General Membership', 'Personal Training'],
                            ['Group Training', 'Nutrition Counselling'],
                            ['Teachers Training', 'Workshop/Event'],
                            ['Trial', 'PT Trial'],
                          ].map(([cat1, cat2]) => (
                            <React.Fragment key={cat1}>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="variationCategory"
                                  value={cat1}
                                  checked={variationForm.category === cat1}
                                  onChange={() => setVariationForm((prev) => ({ ...prev, category: cat1 }))}
                                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                                />
                                <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{cat1}</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="variationCategory"
                                  value={cat2}
                                  checked={variationForm.category === cat2}
                                  onChange={() => setVariationForm((prev) => ({ ...prev, category: cat2 }))}
                                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                                />
                                <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{cat2}</span>
                              </label>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* OTP Verification for Check-in */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2 pt-1">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          OTP Verification for Check-in
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="otpVerification"
                              checked={variationForm.otpVerification === true}
                              onChange={() => setVariationForm((prev) => ({ ...prev, otpVerification: true }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="otpVerification"
                              checked={variationForm.otpVerification === false}
                              onChange={() => setVariationForm((prev) => ({ ...prev, otpVerification: false }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {/* Upgradable */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Upgradable<span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="upgradable"
                              checked={variationForm.upgradable === true}
                              onChange={() => setVariationForm((prev) => ({ ...prev, upgradable: true }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="upgradable"
                              checked={variationForm.upgradable === false}
                              onChange={() => setVariationForm((prev) => ({ ...prev, upgradable: false }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {/* Transferable */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Transferable<span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="transferable"
                              checked={variationForm.transferable === true}
                              onChange={() => setVariationForm((prev) => ({ ...prev, transferable: true }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="transferable"
                              checked={variationForm.transferable === false}
                              onChange={() => setVariationForm((prev) => ({ ...prev, transferable: false }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {/* Allow Freeze & Freeze days - for Membership and Multiple Sessions */}
                      {(variationForm.serviceType === 'Membership' || variationForm.serviceType === 'Multiple Sessions') && (
                        <>
                          <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                            <label className="font-bold text-gray-800 dark:text-gray-200">
                              Allow Freeze<span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="allowFreeze"
                                  checked={variationForm.allowFreeze === true}
                                  onChange={() => setVariationForm((prev) => ({ ...prev, allowFreeze: true }))}
                                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="allowFreeze"
                                  checked={variationForm.allowFreeze === false}
                                  onChange={() => setVariationForm((prev) => ({ ...prev, allowFreeze: false }))}
                                  className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                                />
                                <span className="text-gray-700 dark:text-gray-300">No</span>
                              </label>
                            </div>
                          </div>

                          {variationForm.allowFreeze && (
                            <>
                              <div className="grid grid-cols-[170px_1fr] items-start gap-2">
                                <label className="font-bold text-gray-800 dark:text-gray-200 pt-1.5">
                                  Max freeze days
                                </label>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variationForm.maxFreezeDays}
                                    onChange={(e) => setVariationForm((prev) => ({ ...prev, maxFreezeDays: e.target.value }))}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                  <span className="text-xs text-red-500 block mt-0.5 font-medium">(0= Unlimited)</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-[170px_1fr] items-start gap-2">
                                <label className="font-bold text-gray-800 dark:text-gray-200 pt-1.5">
                                  Min freeze days
                                </label>
                                <div>
                                  <input
                                    type="number"
                                    min="1"
                                    value={variationForm.minFreezeDays}
                                    onChange={(e) => setVariationForm((prev) => ({ ...prev, minFreezeDays: e.target.value }))}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                  <span className="text-xs text-red-500 block mt-0.5 font-medium">(Minimum 1 Day)</span>
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* Appointments Applicable - for 1 Session and Multiple Sessions */}
                      {(variationForm.serviceType === '1 Session' || variationForm.serviceType === 'Multiple Sessions') && (
                        <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                          <label className="font-bold text-gray-800 dark:text-gray-200">
                            Appointments Applicable<span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="appointmentsApplicable"
                                checked={variationForm.appointmentsApplicable === true}
                                onChange={() => setVariationForm((prev) => ({ ...prev, appointmentsApplicable: true }))}
                                className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                              />
                              <span className="text-gray-700 dark:text-gray-300">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="appointmentsApplicable"
                                checked={variationForm.appointmentsApplicable === false}
                                onChange={() => setVariationForm((prev) => ({ ...prev, appointmentsApplicable: false }))}
                                className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                              />
                              <span className="text-gray-700 dark:text-gray-300">No</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Registration fee */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Registration fee<span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="registrationFee"
                              checked={variationForm.registrationFee === true}
                              onChange={() => setVariationForm((prev) => ({ ...prev, registrationFee: true }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="registrationFee"
                              checked={variationForm.registrationFee === false}
                              onChange={() => setVariationForm((prev) => ({ ...prev, registrationFee: false }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">No</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Minimum Fee Limit */}
                  <div className="grid grid-cols-[170px_1fr] items-start gap-2">
                    <label className="font-bold text-gray-800 dark:text-gray-200 pt-1.5">
                      Minimum Fee Limit
                    </label>
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={variationForm.minFeeLimit}
                        onChange={(e) => setVariationForm((prev) => ({ ...prev, minFeeLimit: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-xs text-red-500 block mt-0.5 font-medium">(0= Unlimited)</span>
                    </div>
                  </div>

                  {/* Maximum Fee Limit */}
                  <div className="grid grid-cols-[170px_1fr] items-start gap-2">
                    <label className="font-bold text-gray-800 dark:text-gray-200 pt-1.5">
                      Maximum Fee Limit
                    </label>
                    <div>
                      <input
                        type="number"
                        min="0"
                        value={variationForm.maxFeeLimit}
                        onChange={(e) => setVariationForm((prev) => ({ ...prev, maxFeeLimit: e.target.value }))}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-xs text-red-500 block mt-0.5 font-medium">(0= Unlimited)</span>
                    </div>
                  </div>

                  {/* Referral bonus fields - hidden for Admin fee */}
                  {variationForm.serviceType !== 'Admin fee' && (
                    <>
                      {/* Eligible for referral bonus */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Eligible for referral bonus<span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="eligibleForReferralBonus"
                              checked={variationForm.eligibleForReferralBonus === true}
                              onChange={() => setVariationForm((prev) => ({ ...prev, eligibleForReferralBonus: true }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="eligibleForReferralBonus"
                              checked={variationForm.eligibleForReferralBonus === false}
                              onChange={() => setVariationForm((prev) => ({ ...prev, eligibleForReferralBonus: false }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">No</span>
                          </label>
                        </div>
                      </div>

                      {/* Referral Bonus from this Purchase */}
                      <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                        <label className="font-bold text-gray-800 dark:text-gray-200">
                          Referral Bonus from this Purchase<span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="referralBonusFromPurchase"
                              checked={variationForm.referralBonusFromPurchase === true}
                              onChange={() => setVariationForm((prev) => ({ ...prev, referralBonusFromPurchase: true }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="referralBonusFromPurchase"
                              checked={variationForm.referralBonusFromPurchase === false}
                              onChange={() => setVariationForm((prev) => ({ ...prev, referralBonusFromPurchase: false }))}
                              className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                            />
                            <span className="text-gray-700 dark:text-gray-300">No</span>
                          </label>
                          <div
                            className="w-4 h-4 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-serif cursor-help shrink-0"
                            title="Referral Bonus info"
                          >
                            i
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Term / Batch Date - for Membership, Multiple Sessions, and 1 Day pass */}
                  {(variationForm.serviceType === 'Membership' || variationForm.serviceType === 'Multiple Sessions' || variationForm.serviceType === '1 Day pass') && (
                    <div className="grid grid-cols-[170px_1fr] items-center gap-2">
                      <label className="font-bold text-gray-800 dark:text-gray-200">
                        Term / Batch Date
                      </label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="termBatchDate"
                            checked={variationForm.termBatchDate === true}
                            onChange={() => setVariationForm((prev) => ({ ...prev, termBatchDate: true }))}
                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="termBatchDate"
                            checked={variationForm.termBatchDate === false}
                            onChange={() => setVariationForm((prev) => ({ ...prev, termBatchDate: false }))}
                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                          />
                          <span className="text-gray-700 dark:text-gray-300">No</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Promotion Tab */}
                <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 md:pl-8 pt-4 md:pt-0">
                  <div className="border-b-2 border-gray-400 dark:border-gray-500 pb-1.5 mb-6 inline-block pr-8">
                    <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">Promotion</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-bold text-gray-800 dark:text-gray-200 mb-3 text-xs sm:text-sm">
                        Promote on Website/Member App/Plug-in<span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="promoteOnWebsite"
                            checked={variationForm.promoteOnWebsite === true}
                            onChange={() => setVariationForm((prev) => ({ ...prev, promoteOnWebsite: true }))}
                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="promoteOnWebsite"
                            checked={variationForm.promoteOnWebsite === false}
                            onChange={() => setVariationForm((prev) => ({ ...prev, promoteOnWebsite: false }))}
                            className="w-4 h-4 text-cyan-500 focus:ring-cyan-400"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                <button
                  type="submit"
                  className="px-10 py-2 text-sm font-semibold text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded shadow-xs transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddVariationOpen(false)}
                  className="px-10 py-2 text-sm font-semibold text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded shadow-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServiceManagementPage;

