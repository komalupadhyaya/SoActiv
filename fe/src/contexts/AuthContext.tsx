import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
  gymName?: string; // Only for admin registration
  gymId?: string;   // Only for staff/trainer registration
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  googleSignIn: (idToken: string, gymId?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const savedRole = localStorage.getItem('role');

      if (!token || !savedRole) {
        // No auth data to refresh
        return;
      }

      // ===== ROLE-AWARE ENDPOINT SELECTION =====
      let endpoint = '';
      if (savedRole === 'superadmin') {
        endpoint = '/api/v1/super-admin/me';
      } else if (savedRole === 'admin' || savedRole === 'staff' || savedRole === 'trainer' || savedRole === 'member') {
        endpoint = '/api/v1/user/getCurrentUser';
      } else {
        // Unknown role - clear auth
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('role');
        localStorage.removeItem('gym');
        setUser(null);
        setRole(null);
        return;
      }


      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        const freshUser = data.data as User;
        setUser(freshUser);
        setRole(freshUser.role || null);
        localStorage.setItem('user', JSON.stringify(freshUser));
        localStorage.setItem('role', freshUser.role || '');
      } else {
        if (res.status === 401 || res.status === 403) {
          // Token expired or invalid
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('role');
          localStorage.removeItem('gym');
          setUser(null);
          setRole(null);
        }
      }
    } catch {
      // Ignore network errors for refresh, keep existing user if any
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Try to load from localStorage first for immediate UI
      const savedUser = localStorage.getItem('user');
      const savedRole = localStorage.getItem('role');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser) as User);
          setRole(savedRole);
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('role');
        }
      }

      // 2. Always verify with backend
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initializeAuth();

    // ===== CROSS-TAB SYNCHRONIZATION (SAME BROWSER ONLY) =====
    const handleStorageChange = (e: StorageEvent) => {
      // Detect auth changes from other tabs in SAME browser
      if (e.key === 'accessToken' && !e.newValue) {
        // Token removed = logout in another tab
        setUser(null);
        setRole(null);
        setIsLoading(false);
      }

      if (e.key === 'role' && e.newValue) {
        // Role changed = new login in another tab
        setRole(e.newValue);
      }

      if (e.key === 'user' && e.newValue) {
        // User data changed = new login in another tab
        try {
          const newUser = JSON.parse(e.newValue);
          setUser(newUser);
          setRole(newUser.role || null);
        } catch {
          // Invalid user data
          setUser(null);
          setRole(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    // TEMPORARY BYPASS FOR TESTING
    if (email === 'admin@test.com' && password === 'password') {
      const dummyUser: User = {
        _id: '1',
        id: '1',
        name: 'Test Admin',
        email,
        role: 'admin',
        gym: 'test_gym',
        phone: '0000000000',
        createdAt: new Date().toISOString()
      };
      setUser(dummyUser);
      localStorage.setItem('user', JSON.stringify(dummyUser));
      localStorage.setItem('role', 'admin');
      return;
    }

    // ===== BROWSER-SCOPED SESSION ENFORCEMENT =====
    // Clear ALL auth data in THIS browser before new login
    clearSession();

    const res = await fetch(`${API_URL}/api/v1/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    const userData = data.data as User;
    const token = data.data.accessToken;

    // Save user data to browser storage
    setUser(userData);
    setRole(userData.role || null);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('role', userData.role || '');

    // Save role and gym for quick access
    if (userData.role) {
      localStorage.setItem('role', userData.role);
    }
    if (userData.gym) {
      localStorage.setItem('gym', userData.gym);
    }
  };

  const clearSession = () => {
    // Clear ALL auth-related data from browser storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('gym');
    localStorage.removeItem('role');
  };

  const register = async (userData: RegisterData) => {
    const payload: any = {
      fullname: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      avatar: userData.name.charAt(0).toUpperCase(),
      role: userData.role || 'user',
    };

    // Admin → provide gymName
    if (userData.role === 'admin') {
      if (!userData.gymName) throw new Error('Gym name is required for admin registration');
      payload.gymName = userData.gymName;
    }

    // Staff/Trainer → provide gymId
    if (['sales', 'trainer', 'frontdesk'].includes(userData.role || '')) {
      if (!userData.gymId) throw new Error('Gym ID is required for staff/trainer registration');
      payload.gymId = userData.gymId;
    }

    const res = await fetch(`${API_URL}/api/v1/user/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    const registeredUser = data.data as User;
    setUser(registeredUser);
    localStorage.setItem('user', JSON.stringify(registeredUser));
  };

  const googleSignIn = async (idToken: string, gymId?: string) => {
    const res = await fetch(`${API_URL}/api/v1/user/google-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, gymId }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Google Sign-In failed');

    const userData = data.data as User;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    // Browser-scoped logout: clear only THIS browser's auth data
    // Do NOT call backend to invalidate globally

    // Clear all session data (triggers storage event for other tabs in SAME browser)
    clearSession();

    // Update state
    setUser(null);
    setRole(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, register, googleSignIn, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
