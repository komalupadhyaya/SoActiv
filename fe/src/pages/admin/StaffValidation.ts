export interface StaffFormData {
    fullName: string;
    position: string;
    email: string;
    contactNumber: string;
    countryCode?: string;
    gender?: 'Male' | 'Female' | 'Other' | string;
    vaccinated?: 'Yes' | 'No' | string;
    loginAccess?: boolean;
    password?: string;
    resume?: string | null;
    resumeName?: string;
    employeeCategory?: string;
    payoutType?: string;
    grade?: string;
    dob?: string;
    anniversary?: string;
    joiningDate: string;
    salary: number | string;
    jobDesignation?: string;
    adminRights?: string;
    attendanceId?: string;
    panCard?: string;
    gstNumber?: string;
    accountNo?: string;
    ifsc?: string;
    hrmsId?: string;
    avatar?: string;
    status: 'active' | 'inactive';
    notifications?: {
        sms: boolean;
        email: boolean;
        push: boolean;
        whatsapp: boolean;
    };
}

export const validateStaffForm = (data: StaffFormData): string | null => {
    // Required fields check
    if (!data.fullName?.trim()) return 'Full Name is required';
    if (!data.contactNumber?.trim()) return 'Contact number is required';
    if (!data.email?.trim()) return 'Email is required';

    // Phone validation (at least 10 digits)
    const phoneDigits = data.contactNumber.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        return 'Contact number must be at least 10 digits';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return 'Please enter a valid email address';
    }

    return null;
};

export const isStaffFormValid = (data: StaffFormData): boolean => {
    return !validateStaffForm(data);
};
