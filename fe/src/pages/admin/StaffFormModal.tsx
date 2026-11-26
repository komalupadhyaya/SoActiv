import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Eye, EyeOff } from 'lucide-react';
import { StaffFormData, validateStaffForm } from './StaffValidation';
import { useToast } from '../../contexts/ToastContext';
import type { Staff } from '../../hooks/useStaff';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
  initialData?: StaffFormData | any;
  isSubmitting: boolean;
  existingStaff?: Staff[];
}

const getNextUniqueAttendanceId = (existingStaff: Staff[] = []): string => {
  const existingSet = new Set(
    existingStaff.map((s) => (s.attendanceId || '').trim().toLowerCase()).filter(Boolean)
  );
  let num = 10001;
  while (existingSet.has(num.toString())) {
    num++;
  }
  return num.toString();
};

// Helper: Convert any date input to YYYY-MM-DD
const formatDateForInput = (date: string | Date | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

const JOB_DESIGNATION_OPTIONS = [
  'Business Partner',
  'Center Manager',
  'Client Relationship Executive',
  'Client Relationship Manager',
  'Club Manager',
  'Diet Coach',
  'Director',
  'Fitness Coach',
  'Fitness Manager',
  'Fitness Trainer',
  'Front Desk',
  'General Trainer',
  'House Keeping',
  'Nutritionist',
  'Owner',
  'Personal Trainer',
  'Physiotherapist',
  'Sales Executive',
  'Sales Manager',
  'Sales Representative',
  'Sports Coach',
  'Trainer',
];

const ADMIN_RIGHTS_OPTIONS = [
  'Master Admin',
  'Admin',
  'Finance',
  'Training',
  'Sales',
  'Client Management',
  'Customer Service',
  'Housekeeping',
];

export const StaffFormModal: React.FC<StaffFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
  existingStaff = [],
}) => {
  const { isToastVisible } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<StaffFormData>({
    fullName: '',
    countryCode: '+91',
    contactNumber: '',
    email: '',
    gender: '',
    vaccinated: '',
    loginAccess: true,
    password: '',
    resume: null,
    resumeName: '',
    employeeCategory: '',
    payoutType: '',
    grade: '',
    dob: '',
    anniversary: '',
    salary: '',
    position: 'trainer',
    jobDesignation: '',
    adminRights: '',
    joiningDate: '',
    attendanceId: '',
    panCard: '',
    gstNumber: '',
    accountNo: '',
    ifsc: '',
    hrmsId: '',
    avatar: '',
    status: 'active',
    notifications: {
      sms: true,
      email: true,
      push: true,
      whatsapp: true,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          fullName: initialData.fullName || '',
          countryCode: initialData.countryCode || '+91',
          contactNumber: initialData.contactNumber || '',
          email: initialData.email || '',
          gender: initialData.gender || '',
          vaccinated: initialData.vaccinated || '',
          loginAccess: initialData.loginAccess !== undefined ? initialData.loginAccess : true,
          password: initialData.password || '',
          resume: initialData.resume || null,
          resumeName: initialData.resumeName || '',
          employeeCategory: initialData.employeeCategory || '',
          payoutType: initialData.payoutType || '',
          grade: initialData.grade || '',
          dob: formatDateForInput(initialData.dob),
          anniversary: formatDateForInput(initialData.anniversary),
          salary: initialData.salary || '',
          position: initialData.position || 'trainer',
          jobDesignation: initialData.jobDesignation || initialData.position || '',
          adminRights: initialData.adminRights || '',
          joiningDate: formatDateForInput(initialData.joiningDate),
          attendanceId: initialData.attendanceId || '',
          panCard: initialData.panCard || '',
          gstNumber: initialData.gstNumber || '',
          accountNo: initialData.accountNo || '',
          ifsc: initialData.ifsc || '',
          hrmsId: initialData.hrmsId || '',
          avatar: initialData.avatar || '',
          status: initialData.status || 'active',
          notifications: initialData.notifications || {
            sms: true,
            email: true,
            push: true,
            whatsapp: true,
          },
        });
      } else {
        // Reset form for new staff
        setFormData({
          fullName: '',
          countryCode: '+91',
          contactNumber: '',
          email: '',
          gender: '',
          vaccinated: '',
          loginAccess: true,
          password: '',
          resume: null,
          resumeName: '',
          employeeCategory: '',
          payoutType: '',
          grade: '',
          dob: '',
          anniversary: '',
          salary: '',
          position: 'trainer',
          jobDesignation: '',
          adminRights: '',
          joiningDate: '',
          attendanceId: getNextUniqueAttendanceId(existingStaff),
          panCard: '',
          gstNumber: '',
          accountNo: '',
          ifsc: '',
          hrmsId: '',
          avatar: '',
          status: 'active',
          notifications: {
            sms: true,
            email: true,
            push: true,
            whatsapp: true,
          },
        });
      }
      setValidationError(null);
      setShowPassword(false);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof StaffFormData, value: any) => {
    let finalValue = value;
    if (field === 'contactNumber' && typeof value === 'string') {
      finalValue = value.replace(/\D/g, '').slice(0, 10);
    }
    if (field === 'jobDesignation') {
      const lower = value.toLowerCase();
      let derivedPosition = 'trainer';
      if (lower.includes('manager') || lower.includes('partner') || lower.includes('director') || lower.includes('owner')) {
        derivedPosition = 'manager';
      } else if (lower.includes('desk') || lower.includes('receptionist') || lower.includes('relationship')) {
        derivedPosition = 'receptionist';
      } else if (lower.includes('sales')) {
        derivedPosition = 'sales';
      } else if (lower.includes('house') || lower.includes('cleaner')) {
        derivedPosition = 'cleaner';
      } else if (lower.includes('maintenance')) {
        derivedPosition = 'maintenance';
      }

      setFormData((prev) => ({
        ...prev,
        jobDesignation: value,
        position: derivedPosition,
      }));
      if (validationError) setValidationError(null);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: finalValue,
    }));
    if (validationError) setValidationError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        resumeName: file.name,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStaffForm(formData);
    if (error) {
      setValidationError(error);
      return;
    }

    // Check Attendance ID uniqueness among staff
    if (formData.attendanceId && formData.attendanceId.trim()) {
      const clean = formData.attendanceId.trim().toLowerCase();
      const collision = existingStaff.find(
        (s) =>
          s._id !== (initialData as any)?._id &&
          s.attendanceId &&
          s.attendanceId.trim().toLowerCase() === clean
      );
      if (collision) {
        setValidationError(
          `Attendance ID "${formData.attendanceId.trim()}" is already assigned to ${collision.fullName}. Every user must have a unique Attendance ID.`
        );
        return;
      }
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-md shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Staff' : 'Add Staff'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-bold p-1 rounded-sm cursor-pointer transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs text-gray-800 dark:text-gray-200 overflow-y-auto flex-1">
          {/* Main 3-Column / Flex Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[130px_1fr_1fr] gap-6 items-start">
            {/* 1. Left Column: Avatar Silhouette & Upload */}
            <div className="flex flex-col items-center">
              <div className="w-[120px] h-[115px] rounded-xs bg-[#f1f3f6] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Staff Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-20 h-20 text-[#8f9bb3] dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 w-[120px] py-1.5 px-2 bg-[#ff5e28] hover:bg-[#e04f1d] text-white text-xs font-semibold rounded-xs shadow-xs text-center cursor-pointer transition-colors"
              >
                Upload Image
              </button>
            </div>

            {/* 2. Middle Column: Fields */}
            <div className="space-y-3">
              {/* Full Name */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="First Name and Last Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Country Code */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Country Code
                </label>
                <select
                  value={formData.countryCode || '+91'}
                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="+91">India (+91)</option>
                  <option value="+1">USA (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+971">UAE (+971)</option>
                  <option value="+61">Australia (+61)</option>
                  <option value="+65">Singapore (+65)</option>
                  <option value="+1-ca">Canada (+1)</option>
                </select>
              </div>

              {/* Contact Number */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Contact Number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder=""
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Email */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Gender */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Gender<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === 'Male'}
                      onChange={() => handleInputChange('gender', 'Male')}
                      className="w-3.5 h-3.5 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span>Male</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === 'Female'}
                      onChange={() => handleInputChange('gender', 'Female')}
                      className="w-3.5 h-3.5 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span>Female</span>
                  </label>
                </div>
              </div>

              {/* Vaccinated */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Vaccinated
                </label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="vaccinated"
                      value="Yes"
                      checked={formData.vaccinated === 'Yes'}
                      onChange={() => handleInputChange('vaccinated', 'Yes')}
                      className="w-3.5 h-3.5 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="vaccinated"
                      value="No"
                      checked={formData.vaccinated === 'No'}
                      onChange={() => handleInputChange('vaccinated', 'No')}
                      className="w-3.5 h-3.5 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* Login Access */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Login Access
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('loginAccess', !formData.loginAccess)}
                    className={`w-[60px] h-[26px] rounded-xs border-2 bg-white dark:bg-gray-800 p-[1px] flex items-center transition-colors cursor-pointer select-none ${
                      formData.loginAccess ? 'border-[#00c853]' : 'border-[#fbc02d]'
                    }`}
                  >
                    <div
                      className={`w-[28px] h-full text-white text-[11px] font-bold flex items-center justify-center rounded-xs transition-transform duration-150 ${
                        formData.loginAccess
                          ? 'bg-[#00c853] translate-x-0'
                          : 'bg-[#fbc02d] translate-x-[26px]'
                      }`}
                    >
                      {formData.loginAccess ? 'Yes' : 'No'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Password{formData.loginAccess && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-2.5 py-1.5 pr-8 border border-gray-300 dark:border-gray-600 rounded-xs bg-[#eef2f7] dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Upload Resume */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Upload Resume
                </label>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xs overflow-hidden bg-white dark:bg-gray-800">
                  <input
                    type="file"
                    ref={resumeInputRef}
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-normal hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer shrink-0"
                  >
                    Choose File
                  </button>
                  <span className="px-2 text-gray-500 dark:text-gray-400 truncate flex-1">
                    {formData.resumeName || 'No file chosen'}
                  </span>
                </div>
              </div>

              {/* Employee Category */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Employee Category
                </label>
                <select
                  value={formData.employeeCategory || ''}
                  onChange={(e) => handleInputChange('employeeCategory', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="Employee">Employee</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Freelancer">Freelancer</option>
                </select>
              </div>

              {/* Payout type */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Payout type
                </label>
                <select
                  value={formData.payoutType || ''}
                  onChange={(e) => handleInputChange('payoutType', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Variable">Variable</option>
                  <option value="Fixed+Variable">Fixed+Variable</option>
                </select>
              </div>

              {/* Grade */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Grade
                </label>
                <select
                  value={formData.grade || ''}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select</option>
                </select>
              </div>
            </div>

            {/* 3. Right Column: Fields */}
            <div className="space-y-3">
              {/* Date of Birth */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Anniversary */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Anniversary
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.anniversary || ''}
                    onChange={(e) => handleInputChange('anniversary', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Salary */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Salary
                </label>
                <input
                  type="text"
                  placeholder="Salary"
                  value={formData.salary || ''}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Job Designation */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Job Designation<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.jobDesignation || ''}
                  onChange={(e) => handleInputChange('jobDesignation', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select</option>
                  {JOB_DESIGNATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Rights */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Admin Rights<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.adminRights || ''}
                  onChange={(e) => handleInputChange('adminRights', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="">Select</option>
                  {ADMIN_RIGHTS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Joining */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Date of Joining
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.joiningDate || ''}
                    onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Attendance ID */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Attendance ID
                </label>
                <div>
                  <input
                    type="text"
                    value={formData.attendanceId || ''}
                    onChange={(e) => handleInputChange('attendanceId', e.target.value)}
                    placeholder="e.g. 10001"
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    Must be unique per staff member (used for biometric machines & staff check-ins).
                  </p>
                </div>
              </div>

              {/* PAN Card */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  PAN Card
                </label>
                <input
                  type="text"
                  value={formData.panCard || ''}
                  onChange={(e) => handleInputChange('panCard', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* GST number */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  GST number
                </label>
                <input
                  type="text"
                  value={formData.gstNumber || ''}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Account No */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  Account No
                </label>
                <input
                  type="text"
                  value={formData.accountNo || ''}
                  onChange={(e) => handleInputChange('accountNo', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* IFSC */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  IFSC
                </label>
                <input
                  type="text"
                  value={formData.ifsc || ''}
                  onChange={(e) => handleInputChange('ifsc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* HRMS ID */}
              <div className="grid grid-cols-[115px_1fr] items-center gap-2">
                <label className="text-gray-800 dark:text-gray-200 font-medium">
                  HRMS ID
                </label>
                <input
                  type="text"
                  value={formData.hrmsId || ''}
                  onChange={(e) => handleInputChange('hrmsId', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xs bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="text-xs text-red-600 dark:text-red-400 font-medium text-center">
              {validationError}
            </div>
          )}

          {/* Centered Save Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isToastVisible}
              className="px-10 py-2 text-xs font-bold text-white bg-[#ff5e28] hover:bg-[#e04f1d] rounded-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
