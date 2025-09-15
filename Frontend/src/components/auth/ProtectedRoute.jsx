import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiUtils } from '../../services/api';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Nếu đang loading, hiển thị loading
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px' 
      }}>
        <i className="fa fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
        Đang kiểm tra đăng nhập...
      </div>
    );
  }
  
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
