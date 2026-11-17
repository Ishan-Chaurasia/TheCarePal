import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on start
  useEffect(() => {
    async function loadSession() {
      try {
        const res = await apiRequest('/auth/me');
        if (res.user) {
          setUser(res.user);
          setPatient(res.patient);
        }
      } catch (err) {
        setUser(null);
        setPatient(null);
        localStorage.removeItem('carepal_token');
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
    return res;
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setPatient(null);
      localStorage.removeItem('carepal_token');
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
