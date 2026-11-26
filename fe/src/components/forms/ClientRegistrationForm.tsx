import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { User, Phone, Mail, MapPin, UserCheck, Camera } from 'lucide-react';
import { useStaff } from '../../hooks/useStaff';
import { usePT } from '../../hooks/usePT';
import { ProFormaInvoiceModal } from '../modals/ProFormaInvoiceModal';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface ClientRegistrationFormProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<{ success: boolean; message?: string; data?: any }>;
  initialData?: any;
}

export const ClientRegistrationForm: React.FC<ClientRegistrationFormProps> = ({ onClose, onSubmit, initialData }) => {
  const { staff, loading: staffLoading, fetchAllStaff } = useStaff();
  const { fetchPlans: fetchPTPlans, fetchAssignments } = usePT();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profileImage, setProfileImage] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isProFormaOpen, setIsProFormaOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load staff on component mount
  useEffect(() => {
    fetchAllStaff();
    fetchPTPlans();
    fetchAssignments();
  }, [fetchAllStaff, fetchPTPlans, fetchAssignments]);

  const [formData, setFormData] = useState({
    fullName: '',
    countryCode: '+1',
    contactNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    profileImage: '',

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactRelation: '',

    // Staff Assignment
    salesRep: '',
    memberManager: '',
    trainer: '',

    // Club Info
    attendanceId: '',
    clubId: '',
    gstNo: '',

    // Notifications
    notifications: {
      sms: true,
      email: true,
      push: true,
      whatsapp: true,
    },
  });

  // Populate form with initialData when editing or converting from enquiry
  useEffect(() => {
    if (initialData) {
      const contactNumber = initialData.contactNumber || '';
      let countryCode = initialData.countryCode || '+91';
      let phoneNumber = contactNumber;

      if (contactNumber.startsWith('+')) {
        const match = contactNumber.match(/^(\+\d{1,3})(.*)$/);
        if (match) {
          countryCode = match[1];
          phoneNumber = match[2];
        }
      }

      const img = initialData.profileImage || '';
      setProfileImage(img);

      setFormData({
        fullName: initialData.fullName || '',
        countryCode: countryCode,
        contactNumber: phoneNumber,
        email: initialData.email || '',
        gender: initialData.gender || '',
        dateOfBirth: initialData.dateOfBirth ? new Date(initialData.dateOfBirth).toISOString().split('T')[0] : '',
        address: initialData.address || '',
        profileImage: img,
        emergencyContactName: initialData.emergencyContactName || '',
        emergencyContactNumber: initialData.emergencyContactNumber || '',
        emergencyContactRelation: initialData.emergencyContactRelation || '',
        salesRep: (initialData.salesRep && typeof initialData.salesRep === 'object') ? (initialData.salesRep._id || '') : (initialData.salesRep || ''),
        memberManager: (initialData.memberManager && typeof initialData.memberManager === 'object') ? (initialData.memberManager._id || '') : (initialData.memberManager || ''),
        trainer: (initialData.trainer && typeof initialData.trainer === 'object') ? (initialData.trainer._id || '') : (initialData.trainer || ''),
        attendanceId: initialData.attendanceId || '',
        clubId: initialData.clubId || '',
        gstNo: initialData.gstNo || '',
        notifications: initialData.notifications || {
          sms: true,
          email: true,
          push: true,
          whatsapp: true,
        },
      });
    }
  }, [initialData]);

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        setFormData((prev) => ({ ...prev, profileImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera start / capture / stop
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera access error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setProfileImage(dataUrl);
        setFormData((prev) => ({ ...prev, profileImage: dataUrl }));
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const validateForm = () => {
    const formErrors: Record<string, string> = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      formErrors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z0-9\s.'-]+$/.test(formData.fullName.trim())) {
      formErrors.fullName = 'Full name contains invalid characters';
    }
    if (formData.contactNumber.length !== 10) {
      formErrors.contactNumber = 'Contact number must be exactly 10 digits';
    }
    if (formData.emergencyContactNumber && formData.emergencyContactNumber.length !== 10) {
      formErrors.emergencyContactNumber = 'Emergency contact number must be exactly 10 digits';
    }
    if (formData.emergencyContactName && !/^[a-zA-Z\s]+$/.test(formData.emergencyContactName.trim())) {
      formErrors.emergencyContactName = 'Emergency contact name must contain only alphabetical characters and spaces';
    }

    const todayStr = getLocalDateString();
    if (formData.dateOfBirth && formData.dateOfBirth > todayStr) {
      formErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleOpenProForma = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsProFormaOpen(true);
  };

  const handleSaveProFormaInvoice = async (invoiceData: any) => {
    const fallbackName = formData.fullName.trim() || invoiceData.memberSearchText?.split('-')[0]?.trim() || 'New Member';
    const fallbackPhone = formData.contactNumber || '0000000000';

    const firstItem = invoiceData.items?.[0];
    const sDate = firstItem?.startDate || (formData as any).startDate || new Date().toISOString().split('T')[0];
    let eDate = firstItem?.expiryDate;
    if (!eDate && sDate) {
      const d = new Date(sDate);
      if (firstItem?.duration?.includes('Month')) {
        const m = parseInt(firstItem.duration, 10) || 1;
        d.setMonth(d.getMonth() + m);
      } else if (firstItem?.duration?.includes('Year')) {
        const y = parseInt(firstItem.duration, 10) || 1;
        d.setFullYear(d.getFullYear() + y);
      } else if (firstItem?.duration?.includes('Day') || firstItem?.duration?.includes('Week')) {
        const days = firstItem.duration.includes('Week')
          ? (parseInt(firstItem.duration, 10) || 1) * 7
          : (parseInt(firstItem.duration, 10) || 30);
        d.setDate(d.getDate() + days);
      } else {
        d.setMonth(d.getMonth() + 1);
      }
      eDate = d.toISOString().split('T')[0];
    }

    const dateObj = new Date();
    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
    const yearStr = dateObj.getFullYear();
    const randomNum = Math.floor(Math.random() * 90) + 10;
    const invoiceNo = invoiceData.invoiceNo || `${monthStr}${randomNum}-${yearStr}`;

    const totalDue = Number(invoiceData.totalDue) || Number(invoiceData.subTotal) || 0;
    const totalPaid =
      invoiceData.paid !== undefined && !isNaN(Number(invoiceData.paid))
        ? Number(invoiceData.paid)
        : invoiceData.totalPaid !== undefined && !isNaN(Number(invoiceData.totalPaid))
        ? Number(invoiceData.totalPaid)
        : (invoiceData.paymentModes || []).reduce((acc: number, pm: any) => acc + (Number(pm.amount) || 0), 0);
    const pendingAmount =
      invoiceData.pending !== undefined && !isNaN(Number(invoiceData.pending))
        ? Number(invoiceData.pending)
        : invoiceData.pendingAmount !== undefined && !isNaN(Number(invoiceData.pendingAmount))
        ? Number(invoiceData.pendingAmount)
        : Math.max(0, totalDue - totalPaid);

    const fullInvoice = {
      ...invoiceData,
      invoiceNo,
      date: invoiceData.invoiceDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      amount: totalDue,
      net: totalDue,
      totalDue,
      paid: totalPaid,
      totalPaid,
      pending: pendingAmount,
      pendingAmount,
      status: pendingAmount > 0 ? (totalPaid > 0 ? 'Partially Paid' : 'Pending') : 'Paid',
      mode:
        invoiceData.paymentModes?.find((pm: any) => pm.mode && pm.mode !== 'Select')?.mode ||
        'Google Pay',
    };

    const payload = {
      fullName: fallbackName,
      email: formData.email,
      contactNumber: formData.contactNumber ? (formData.countryCode + formData.contactNumber) : ('+91' + fallbackPhone),
      gender: formData.gender || 'other',
      dateOfBirth: formData.dateOfBirth || undefined,
      address: formData.address || undefined,
      profileImage: profileImage || formData.profileImage || '',
      emergencyContactName: formData.emergencyContactName?.trim() || undefined,
      emergencyContactNumber: formData.emergencyContactNumber?.trim() || undefined,
      emergencyContactRelation: formData.emergencyContactRelation ? formData.emergencyContactRelation.toLowerCase() : undefined,
      salesRep: invoiceData.salesRep || formData.salesRep || undefined,
      memberManager: formData.memberManager || undefined,
      trainer: formData.trainer || undefined,
      attendanceId: formData.attendanceId?.trim() || undefined,
      clubId: formData.clubId?.trim() || undefined,
      gstNo: formData.gstNo?.trim() || undefined,
      startDate: sDate,
      endDate: eDate,
      timing: (initialData?.timing || (formData as any).timing) || 'morning',
      plan: (initialData?.plan || (formData as any).plan) || 'basic',
      packagePrice: totalDue,
      paymentMode: fullInvoice.mode,
      invoice: fullInvoice,
      invoices: [fullInvoice],
      notifications: formData.notifications,
    };

    const result = await onSubmit(payload);
    if (result.success) {
      setIsProFormaOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      contactNumber: formData.countryCode + formData.contactNumber,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth || undefined,
      address: formData.address || undefined,
      profileImage: profileImage || formData.profileImage || '',
      emergencyContactName: formData.emergencyContactName?.trim() || undefined,
      emergencyContactNumber: formData.emergencyContactNumber?.trim() || undefined,
      emergencyContactRelation: formData.emergencyContactRelation ? formData.emergencyContactRelation.toLowerCase() : undefined,
      salesRep: formData.salesRep || undefined,
      memberManager: formData.memberManager || undefined,
      trainer: formData.trainer || undefined,
      attendanceId: formData.attendanceId?.trim() || undefined,
      clubId: formData.clubId?.trim() || undefined,
      gstNo: formData.gstNo?.trim() || undefined,
      timing: (initialData?.timing || (formData as any).timing) || 'morning',
      plan: (initialData?.plan || (formData as any).plan) || 'basic',
      notifications: formData.notifications,
    };

    const result = await onSubmit(payload);
    if (result.success) onClose();
  };

  const handleAddToTransfer = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      contactNumber: formData.countryCode + formData.contactNumber,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth || undefined,
      address: formData.address || undefined,
      profileImage: profileImage || formData.profileImage || '',
      emergencyContactName: formData.emergencyContactName?.trim() || undefined,
      emergencyContactNumber: formData.emergencyContactNumber?.trim() || undefined,
      emergencyContactRelation: formData.emergencyContactRelation ? formData.emergencyContactRelation.toLowerCase() : undefined,
      salesRep: formData.salesRep || undefined,
      memberManager: formData.memberManager || undefined,
      trainer: formData.trainer || undefined,
      attendanceId: formData.attendanceId?.trim() || undefined,
      clubId: formData.clubId?.trim() || undefined,
      gstNo: formData.gstNo?.trim() || undefined,
      status: 'inactive',
      isTransfer: true,
      remainingDays: 0,
      packagePrice: 0,
      timing: (initialData?.timing || (formData as any).timing) || 'morning',
      plan: (initialData?.plan || (formData as any).plan) || 'basic',
      notifications: formData.notifications,
    };

    const result = await onSubmit(payload);
    if (result.success) onClose();
  };

  const handleNotificationChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [type]: checked },
    }));
  };

  const salesReps = staff
    .filter((s) => s.position?.toLowerCase().includes('sales'))
    .map((s) => ({ value: s._id, label: s.fullName }));

  const memberManagers = staff
    .filter((s) => s.position?.toLowerCase().includes('manager'))
    .map((s) => ({ value: s._id, label: s.fullName }));

  const trainers = staff
    .filter((s) => s.position?.toLowerCase().includes('trainer'))
    .map((s) => ({ value: s._id, label: s.fullName }));

  const allStaffOptions = staff.map((s) => ({ value: s._id, label: `${s.fullName} (${s.position || 'Staff'})` }));

  const handleInputChange = (field: string, value: string) => {
    let finalValue = value;
    if (field === 'contactNumber' || field === 'emergencyContactNumber') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    } else if (field === 'dateOfBirth') {
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };

  if (staffLoading && staff.length === 0) return <div className="p-6 text-center">Loading staff...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        
        {/* Personal Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <User size={18} className="mr-2" /> Personal Details
          </h3>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Left: Avatar & Action Buttons */}
            <div className="flex flex-col items-center shrink-0 w-36 sm:w-40 mx-auto sm:mx-0">
              <div className="w-32 h-36 sm:w-36 sm:h-38 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden relative group shadow-inner">
                {profileImage ? (
                  <img src={profileImage} alt="Member Avatar" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
                {profileImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileImage('');
                      setFormData((prev) => ({ ...prev, profileImage: '' }));
                    }}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove Photo"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div className="flex flex-col gap-2 w-full mt-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors text-center cursor-pointer shadow-sm"
                >
                  Upload Image
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors text-center cursor-pointer shadow-sm"
                >
                  Capture Image
                </button>
              </div>
            </div>

            {/* Right: Personal Info Fields (2 fields per line) */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Enter full name"
                leftIcon={<User size={16} />}
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                error={errors.fullName}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, countryCode: e.target.value }))}
                    className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+971">+971 (UAE)</option>
                  </select>
                  <div className="flex-1">
                    <Input
                      placeholder="10-digit number"
                      leftIcon={<Phone size={16} />}
                      value={formData.contactNumber}
                      onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                      required
                      error={errors.contactNumber}
                    />
                  </div>
                </div>
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                leftIcon={<Mail size={16} />}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />

              <Select
                label="Gender"
                options={[
                  { value: '', label: 'Select Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                value={formData.gender}
                onChange={(value) => handleInputChange('gender', value)}
                required
              />

              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                max={getLocalDateString()}
                error={errors.dateOfBirth}
              />

              <Input
                label="Address"
                placeholder="Enter street address"
                leftIcon={<MapPin size={16} />}
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <UserCheck size={18} className="mr-2" /> Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Name"
              placeholder="Emergency contact name"
              leftIcon={<UserCheck size={16} />}
              value={formData.emergencyContactName}
              onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              error={errors.emergencyContactName}
            />
            <Input
              label="Contact Number"
              placeholder="Emergency contact number"
              leftIcon={<Phone size={16} />}
              value={formData.emergencyContactNumber}
              onChange={(e) => handleInputChange('emergencyContactNumber', e.target.value)}
              error={errors.emergencyContactNumber}
            />
            <Select
              label="Relationship"
              options={[
                { value: '', label: 'Select' },
                { value: 'parent', label: 'Parent' },
                { value: 'spouse', label: 'Spouse' },
                { value: 'other', label: 'Other' },
              ]}
              value={formData.emergencyContactRelation}
              onChange={(value) => handleInputChange('emergencyContactRelation', value)}
            />
          </div>
        </div>

        {/* Staff Assignment */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Staff Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Sales Rep"
              options={[{ value: '', label: 'Select Sales Rep' }, ...(salesReps.length ? salesReps : allStaffOptions)]}
              value={formData.salesRep}
              onChange={(value) => handleInputChange('salesRep', value)}
            />
            <Select
              label="Member Manager"
              options={[{ value: '', label: 'Select Manager' }, ...(memberManagers.length ? memberManagers : allStaffOptions)]}
              value={formData.memberManager}
              onChange={(value) => handleInputChange('memberManager', value)}
            />
            <Select
              label="Trainer (Optional)"
              options={[{ value: '', label: 'Select Trainer' }, ...(trainers.length ? trainers : allStaffOptions)]}
              value={formData.trainer}
              onChange={(value) => handleInputChange('trainer', value)}
            />
          </div>
        </div>

        {/* IDs Section in a single row */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">IDs</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Attendance ID"
              placeholder="Enter attendance ID"
              value={formData.attendanceId}
              onChange={(e) => handleInputChange('attendanceId', e.target.value)}
            />
            <Input
              label="Club ID"
              placeholder="Enter club ID"
              value={formData.clubId}
              onChange={(e) => handleInputChange('clubId', e.target.value)}
            />
            <Input
              label="GST No"
              placeholder="Enter GST number"
              value={formData.gstNo}
              onChange={(e) => handleInputChange('gstNo', e.target.value)}
            />
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(formData.notifications).map(([type, enabled]) => (
              <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => handleNotificationChange(type, e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 focus:ring-2"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleOpenProForma}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded transition-colors shadow-sm cursor-pointer"
          >
            Add Member & Bill
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded transition-colors shadow-sm cursor-pointer"
          >
            Add Advance Payment
          </button>
          <button
            type="button"
            onClick={handleAddToTransfer}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded transition-colors shadow-sm cursor-pointer"
          >
            Add to Transfer
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded transition-colors shadow-sm cursor-pointer"
          >
            Sell Product
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ff5e28] hover:bg-[#ea4f1b] rounded transition-colors shadow-sm cursor-pointer"
          >
            Estimate
          </button>
        </div>
      </div>

      {/* Pro Forma Invoice Modal */}
      <ProFormaInvoiceModal
        isOpen={isProFormaOpen}
        onClose={() => setIsProFormaOpen(false)}
        onSave={handleSaveProFormaInvoice}
        memberData={{
          fullName: formData.fullName,
          contactNumber: formData.countryCode + formData.contactNumber,
          email: formData.email,
          salesRep: formData.salesRep,
        }}
        staffList={staff}
      />

      {/* Live Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera size={18} className="text-orange-500" /> Capture Member Photo
              </h3>
              <button
                type="button"
                onClick={stopCamera}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <div className="relative w-full aspect-4/3 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3 mt-4 w-full">
                <Button type="button" variant="outline" onClick={stopCamera} className="flex-1">
                  Cancel
                </Button>
                <Button type="button" onClick={capturePhoto} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                  Take Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ClientRegistrationForm;