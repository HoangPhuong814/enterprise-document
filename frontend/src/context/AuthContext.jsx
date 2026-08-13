import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

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
    const { token: jwtToken } = response.result;
    
    // Lưu token
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);

    // Lấy thông tin user (ở dự án này, sau đăng nhập, ta có thể giải mã token hoặc lấy qua API)
    // Để đơn giản và tối ưu, ta lưu email & role của user vào localStorage từ response
    // Giả lập lưu email thành name/role (trong thực tế có API get info hoặc decode JWT)
    const userPayload = { email };
    localStorage.setItem('user', JSON.stringify(userPayload));
    setUser(userPayload);

    return response;
  };

  const register = async (email, name, password) => {
    return await api.post('/users/create', { email, name, password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
