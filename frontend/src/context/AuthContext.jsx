import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMyInfo = async (jwtToken) => {
    try {
      const response = await api.get('/users/my-info');
      const userProfile = response.result;
      localStorage.setItem('user', JSON.stringify(userProfile));
      setUser(userProfile);
      return userProfile;
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      throw err;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    const initAuth = async () => {
      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            // ignore
          }
        }
        try {
          await fetchMyInfo(savedToken);
        } catch (e) {
          // Token is likely invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();

    // Lắng nghe sự kiện logout từ API client
    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: jwtToken, refreshToken } = response.result;
    
    // Lưu token
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('refreshToken', refreshToken);
    setToken(jwtToken);

    try {
      await fetchMyInfo(jwtToken);
    } catch (e) {
      const userPayload = { email };
      localStorage.setItem('user', JSON.stringify(userPayload));
      setUser(userPayload);
    }

    return response;
  };

  const register = async (email, name, password) => {
    return await api.post('/users/create', { email, name, password });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (e) {
        console.error("Logout request failed", e);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, fetchMyInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
