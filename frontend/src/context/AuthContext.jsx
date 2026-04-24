import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('goalpath_token');
    if (!token) return null;

    const res = await getMe();
    localStorage.setItem('goalpath_user', JSON.stringify(res.data));
    setUser(res.data);
    return res.data;
  };

  useEffect(() => {
    const token = localStorage.getItem('goalpath_token');
    if (token) {
      refreshUser()
        .catch(() => {
          localStorage.removeItem('goalpath_token');
          localStorage.removeItem('goalpath_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('goalpath_token', token);
    localStorage.setItem('goalpath_user', JSON.stringify(userData));
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}! 🎯`);
    return userData;
  };

  const register = async (formData) => {
    const res = await registerUser(formData);
    const { token, ...userData } = res.data;
    localStorage.setItem('goalpath_token', token);
    localStorage.setItem('goalpath_user', JSON.stringify(userData));
    setUser(userData);
    toast.success(`Account created! Let's build your path 🚀`);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('goalpath_token');
    localStorage.removeItem('goalpath_user');
    setUser(null);
    toast('Logged out. See you soon! 👋');
  };

  const updateUser = (updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('goalpath_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
