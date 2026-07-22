export interface StaffFormData {
    fullName: string;
    position: string;
    email: string;
    contactNumber: string;
    joiningDate: string;
    salary: number | string;
    status: 'active' | 'inactive';
    notifications: {
        sms: boolean;
        email: boolean;
        push: boolean;
        whatsapp: boolean;
    };
}

export const validateStaffForm = (data: StaffFormData): string | null => {
    // Required fields check
    if (!data.fullName?.trim()) return 'Full Name is required';
    if (!/^[a-zA-Z\s]+$/.test(data.fullName.trim())) {
        return 'Full Name must contain only alphabetical characters and spaces';
    }
    if (!data.position) return 'Position is required';
    if (!data.email?.trim()) return 'Email is required';
    if (!data.contactNumber?.trim()) return 'Contact number is required';
    if (!data.joiningDate) return 'Joining date is required';
    if (!data.salary) return 'Salary is required';

    // Phone validation (exactly 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(data.contactNumber)) {
        return 'Contact number must be exactly 10 digits';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        return 'Please enter a valid email address';
    }

    // Salary validation
    const salaryNum = Number(data.salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
        return 'Salary must be a valid number greater than 0';
    }

    return null;
};

export const isStaffFormValid = (data: StaffFormData): boolean => {
    return !validateStaffForm(data);
};
