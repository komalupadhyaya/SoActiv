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
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  googleSignIn: (idToken: string, gymId?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser) as User);
        } catch {
          localStorage.removeItem('user');
        }
      }

      try {
        const res = await fetch(`${API_URL}/getCurrentUser`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const freshUser = data.data as User;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    const userData = data.data as User;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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

    const res = await fetch(`${API_URL}/register`, {
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
    const res = await fetch(`${API_URL}/google-signin`, {
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
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleSignIn, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
