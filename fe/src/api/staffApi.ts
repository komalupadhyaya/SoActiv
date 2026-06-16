/**
 * Staff API Utilities
 * Handles all staff-related API calls with automatic JWT token injection
 */

import axios from 'axios';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

// Create axios instance with default config
const staffApi = axios.create({
    baseURL: `${API_URL}/staff`,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add JWT token
staffApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
staffApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/**
 * Staff Data Interface
 */
export interface CreateStaffData {
    fullName: string;
    email: string;
    position: string;
    contactNumber: string;
    joiningDate: string | Date;
    salary: number;
    status?: 'active' | 'inactive';
    notifications?: {
        sms: boolean;
        email: boolean;
        push: boolean;
        whatsapp: boolean;
    };
}

/**
 * Staff Creation Response
 */
export interface StaffCreationResponse {
    success: boolean;
    message: string;
    data: {
        staff: any;
        user: {
            id: string;
            email: string;
            fullname: string;
            role: string;
        };
        emailSent: boolean;
    };
}

/**
 * Create a new staff member
 * Automatically creates user account and sends welcome email
 */
export const createStaff = async (staffData: CreateStaffData): Promise<StaffCreationResponse> => {
    try {
        const response = await staffApi.post('/', staffData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create staff member');
    }
};

/**
 * Get all staff members
 */
export const getAllStaff = async (filters?: {
    search?: string;
    role?: string;
    status?: 'active' | 'inactive';
}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters?.search) queryParams.append('search', filters.search);
        if (filters?.role) queryParams.append('role', filters.role);
        if (filters?.status) queryParams.append('status', filters.status);

        const response = await staffApi.get(`/?${queryParams.toString()}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch staff');
    }
};

/**
 * Get staff member by ID
 */
export const getStaffById = async (id: string) => {
    try {
        const response = await staffApi.get(`/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch staff member');
    }
};

/**
 * Update staff member
 */
export const updateStaff = async (id: string, staffData: Partial<CreateStaffData>) => {
    try {
        const response = await staffApi.put(`/${id}`, staffData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update staff member');
    }
};

/**
 * Delete staff member
 */
export const deleteStaff = async (id: string) => {
    try {
        const response = await staffApi.delete(`/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to delete staff member');
    }
};

/**
 * Approve staff CRUD request
 */
export const approveStaff = async (id: string) => {
    try {
        const response = await staffApi.patch(`/${id}/approve`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to approve staff request');
    }
};

/**
 * Reject staff CRUD request
 */
export const rejectStaff = async (id: string) => {
    try {
        const response = await staffApi.patch(`/${id}/reject`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to reject staff request');
    }
};

export default staffApi;
