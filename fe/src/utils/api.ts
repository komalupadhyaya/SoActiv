import axios from 'axios';

const baseApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_URL = baseApi.endsWith('/api/v1') ? baseApi : `${baseApi}/api/v1`;

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token to every request
api.interceptors.request.use(
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

// Response interceptor - handle 401 & 403 errors (session/gym invalidation)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            // Check if current user is superadmin
            const isSuperAdmin = window.location.pathname.startsWith('/super-admin');

            // Session invalid/expired/deleted - clear all browser storage
            localStorage.clear();

            // Redirect to appropriate login page if not already there
            const targetLogin = isSuperAdmin ? '/super-admin/login' : '/login';
            if (!window.location.pathname.includes('/login')) {
                window.location.href = targetLogin;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
