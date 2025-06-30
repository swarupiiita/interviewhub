// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { User } from '../types/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Guest user data
const GUEST_USER: User = {
  id: 'guest-user-id',
  email: 'guest@iiita.ac.in',
  full_name: 'Guest',
  verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Try to load the current user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const guestMode = localStorage.getItem('guest_mode');
        
        if (guestMode === 'true') {
          // User is in guest mode
          setUser(GUEST_USER);
        } else if (token) {
          // Try to get authenticated user
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } else {
          // No token and not in guest mode - auto-login as guest
          await loginAsGuest();
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // If there's an error and no guest mode, auto-login as guest
        const guestMode = localStorage.getItem('guest_mode');
        if (guestMode !== 'true') {
          await loginAsGuest();
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Clear guest mode when signing in with real account
    localStorage.removeItem('guest_mode');
    
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', res.data.token);
    setUser(res.data.user);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Clear guest mode when signing up
    localStorage.removeItem('guest_mode');
    
    const res = await api.post('/auth/register', { email, password, fullName });
    localStorage.setItem('auth_token', res.data.token);
    setUser(res.data.user);
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('guest_mode');
    // After sign out, auto-login as guest
    await loginAsGuest();
  };

  const loginAsGuest = async () => {
    try {
      // Try to login with guest credentials
      const res = await api.post('/auth/login', { 
        email: 'guest@iiita.ac.in', 
        password: '12345678' 
      });
      localStorage.setItem('auth_token', res.data.token);
      localStorage.setItem('guest_mode', 'true');
      setUser({ ...res.data.user, full_name: 'Guest' });
    } catch (error) {
      console.error('Guest login failed:', error);
      // Fallback to local guest mode
      localStorage.setItem('guest_mode', 'true');
      localStorage.removeItem('auth_token');
      setUser(GUEST_USER);
    }
  };

  const sendOTP = (email: string) => api.post('/auth/send-otp', { email });

  const verifyOTP = (email: string, otp: string) =>
    api.post('/auth/verify-otp', { email, otp });

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendOTP,
    verifyOTP,
    loginAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};