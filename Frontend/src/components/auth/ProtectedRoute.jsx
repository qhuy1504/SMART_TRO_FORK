import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiUtils } from '../../services/api';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Kiểm tra authentication
  const isAuthenticated = user || apiUtils.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirect về login với thông tin trang hiện tại để sau khi login có thể quay lại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Nếu đã đăng nhập, render children
  return children;
};

export default ProtectedRoute;
