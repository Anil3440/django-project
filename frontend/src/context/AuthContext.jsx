import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const data = await api.getMe();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await api.login({ username, password });
    if (res.user) {
      setUser(res.user);
      await checkAuth();
    }
    return res;
  };

  const signup = async (username, email, password) => {
    const res = await api.signup({ username, email, password });
    if (res.user) {
      setUser(res.user);
      await checkAuth();
    }
    return res;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const isOfficer = user && (user.role === 'Officer' || user.role === 'Admin' || user.is_superuser);
  const isAdmin = user && (user.role === 'Admin' || user.is_superuser);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOfficer,
        isAdmin,
        login,
        signup,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

