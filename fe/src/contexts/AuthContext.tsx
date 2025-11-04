import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔐 On mount: restore user from localStorage immediately
  useEffect(() => {
    const initializeAuth = async () => {
      // ✅ Step 1: Restore user from localStorage instantly
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          setUser(parsedUser); // show UI fast
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      // ✅ Step 2: Ask backend to validate session via cookie
      try {
        const res = await fetch(`${API_URL}/getCurrentUser`, {
          method: 'GET',
          credentials: 'include', // 👉 sends cookie to backend
        });

        if (res.ok) {
          const data = await res.json();
          const freshUser = data.data as User;

          // ✅ Sync: update state & cache
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
          // ❌ Session invalid → clear client state
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('[Auth] Network error during auth check:', error);
        // Keep cached user only if you want "offline" UX
        // But safest: assume session lost
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
      credentials: 'include', // receive cookie
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    const userData = data.data as User;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // ✅ cache
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        avatar: userData.name.charAt(0).toUpperCase(),
      }),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    const user = data.data as User;
    setUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const googleSignIn = async (idToken: string) => {
    const res = await fetch(`${API_URL}/google-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
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
    } catch (error) {
      console.warn('Logout request failed, clearing session anyway', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user'); // ✅ clear cache
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