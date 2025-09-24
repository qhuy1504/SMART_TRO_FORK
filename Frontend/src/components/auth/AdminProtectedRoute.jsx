import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiUtils } from '../../services/api';

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  

  // Kiểm tra authentication
  const isAuthenticated = user || apiUtils.isAuthenticated();
  
  if (!isAuthenticated) {
    // Redirect về login với thông tin trang hiện tại để sau khi login có thể quay lại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Kiểm tra role admin
  const userRole = user?.role || apiUtils.getUserRole();
  
  if (userRole !== 'admin') {
    // Nếu không phải admin, redirect về trang chủ với thông báo lỗi
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          background: '#ffd2d2ff', 
          border: '1px solid #ffa093ff',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '500px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <i className="fa fa-exclamation-triangle" style={{ 
            fontSize: '48px', 
            color: '#be0000ff', 
            marginBottom: '15px' 
          }}></i>
          <h3 style={{ color: '#ff0000ff', margin: '15px 0' }}>
            Quyền truy cập bị từ chối
          </h3>
          <p style={{ color: '#ff0000ff', lineHeight: '1.5' }}>
            Bạn không có quyền truy cập vào trang quản trị này. 
            Chỉ có quản trị viên mới được phép truy cập.
          </p>
          <button
            onClick={() => window.history.back()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              marginTop: '15px'
            }}
          >
            <i className="fa fa-arrow-left" style={{ marginRight: '8px' }}></i>
            Quay lại
          </button>
        </div>
      </div>
    );
  }
  
  // Nếu đã đăng nhập và là admin, render children
  return children;
};

export default AdminProtectedRoute;
