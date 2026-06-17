import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, notifyExtensionLogin, notifyExtensionLogout } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify JWT and load user
  useEffect(() => {
    const token = localStorage.getItem('cf_token');
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((res) => {
        if (res.data?.success) {
          setUser(res.data.data);
          notifyExtensionLogin(token, res.data.data);
        } else {
          localStorage.removeItem('cf_token');
          localStorage.removeItem('cf_user');
        }
      })
      .catch(() => {
        localStorage.removeItem('cf_token');
        localStorage.removeItem('cf_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('cf_token', token);
    localStorage.setItem('cf_user', JSON.stringify(userData));
    setUser(userData);
    notifyExtensionLogin(token, userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    setUser(null);
    notifyExtensionLogout();
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cf_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
