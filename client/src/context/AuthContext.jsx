import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('splitwise_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('splitwise_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('splitwise_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Failed to verify token', err);
          setUser(null);
          localStorage.removeItem('splitwise_token');
          localStorage.removeItem('splitwise_user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('splitwise_token', token);
    localStorage.setItem('splitwise_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, avatar) => {
    const res = await api.post('/auth/register', { name, email, password, avatar });
    const { token, ...userData } = res.data;
    localStorage.setItem('splitwise_token', token);
    localStorage.setItem('splitwise_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('splitwise_token');
    localStorage.removeItem('splitwise_user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/me', data);
    const { token, ...userData } = res.data;
    if (token) {
      localStorage.setItem('splitwise_token', token);
    }
    localStorage.setItem('splitwise_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
