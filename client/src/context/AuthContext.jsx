import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('carepal_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [patient, setPatient] = useState(() => {
    try {
      const saved = localStorage.getItem('carepal_patient');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Fast-path: If no token exists, user is definitely logged out; show login immediately with 0ms delay
  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('carepal_token');
    const savedUser = localStorage.getItem('carepal_user');
    return !!(token && !savedUser);
  });

  // Verify / refresh session in background
  useEffect(() => {
    const token = localStorage.getItem('carepal_token');
    if (!token) {
      setLoading(false);
      return;
    }

    async function loadSession() {
      try {
        const res = await apiRequest('/auth/me');
        if (res.user) {
          setUser(res.user);
          setPatient(res.patient);
          localStorage.setItem('carepal_user', JSON.stringify(res.user));
          if (res.patient) {
            localStorage.setItem('carepal_patient', JSON.stringify(res.patient));
          }
        }
      } catch (err) {
        setUser(null);
        setPatient(null);
        localStorage.removeItem('carepal_token');
        localStorage.removeItem('carepal_user');
        localStorage.removeItem('carepal_patient');
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  const login = async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setUser(res.user);
    setPatient(res.patient);
    if (res.token) {
      localStorage.setItem('carepal_token', res.token);
    }
    localStorage.setItem('carepal_user', JSON.stringify(res.user));
    if (res.patient) {
      localStorage.setItem('carepal_patient', JSON.stringify(res.patient));
    }
    return res;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setPatient(null);
      localStorage.removeItem('carepal_token');
      localStorage.removeItem('carepal_user');
      localStorage.removeItem('carepal_patient');
    }
  };

  // Quick switch for smooth screen recording demo
  const quickSwitchDemoRole = async () => {
    if (user?.role === 'nurse') {
      return login('family@thecarepal.com', 'FamilyPass123!');
    } else {
      return login('nurse@thecarepal.com', 'NursePass123!');
    }
  };

  const value = {
    user,
    patient,
    loading,
    login,
    logout,
    quickSwitchDemoRole,
    isNurse: user?.role === 'nurse',
    isFamily: user?.role === 'family'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
