import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, apiUtils } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra trạng thái đăng nhập khi khởi tạo
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = apiUtils.getToken();
      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.data && response.data.success) {
            setUser(response.data.data);
          }
        } catch (error) {
          // Token không hợp lệ, xóa auth data
          apiUtils.clearAuthData();
          setUser(null);
        }
      }
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  const login = async (credentials, remember = false) => {
    try {
      const res = await authAPI.login(credentials);
      if (res.data && res.data.success) {
        const { token, user: userData } = res.data.data;
        apiUtils.setAuthData(token, userData._id, userData.role, remember);
        setUser(userData);
        return { success: true, user: userData };
      } else {
        return { success: false, message: res.data?.message, errors: res.data?.errors };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Đăng nhập thất bại',
        errors: error.response?.data?.errors 
      };
    }
  };

  const setUserData = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    apiUtils.clearAuthData();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    setUser,
    setUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
