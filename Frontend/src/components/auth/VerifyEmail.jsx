import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI, apiUtils } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import './auth.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Đang xác thực email...');
    const { setUserData } = useAuth();
    const hasVerifiedRef = useRef(false); // Sử dụng useRef thay vì useState
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Ngăn chặn multiple verification calls
        if (hasVerifiedRef.current) {
            console.log('Đã xác thực rồi, bỏ qua...');
            return;
        }

        const verifyEmail = async () => {
            const token = searchParams.get('token');

            if (!token) {
                console.log('Không có token trong URL');
                setStatus('error');
                setMessage('Token xác thực không hợp lệ');
                hasVerifiedRef.current = true;
                return;
            }

            try {

                hasVerifiedRef.current = true; // Đánh dấu đã bắt đầu verify

                const response = await authAPI.verifyEmail(token);


                if (response.data && response.data.success) {
                    const { user, token: authToken, sessionToken } = response.data.data;

                    // Tạm thời comment để test - chỉ set auth data vào localStorage
                    apiUtils.setAuthData(authToken, user._id, user.role, sessionToken);
                    // setUserData(user); // ← COMMENT để test
                    
                    // Hiển thị spinner 2 giây trước
                    setTimeout(() => {
                        setStatus('success');
                        setMessage('Xác thực email thành công!');
                        toast.success(`Chào mừng ${user.fullName}! Đang chuyển về trang chủ...`);

                        // Countdown 5 giây cho màn hình thành công
                        let timeLeft = 5;
                        setCountdown(timeLeft);

                        const countdownInterval = setInterval(() => {
                            timeLeft -= 1;
                            setCountdown(timeLeft);

                            if (timeLeft <= 0) {
                                clearInterval(countdownInterval);
                                // Chỉ set user data khi countdown xong
                                setUserData(user);
                                navigate('/'); // Chuyển về trang chủ
                            }
                        }, 1000);
                    }, 2000); // 2 giây delay cho spinner
                }
                else {

                    setStatus('error');
                    setMessage(response.data?.message || 'Xác thực email thất bại');
                }
            } catch (error) {
                console.error('Lỗi khi gọi API xác thực:', error);
                console.error('Error details:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                });
                setStatus('error');
                setMessage(error.response?.data?.message || 'Xác thực email thất bại');
            }
        };

        verifyEmail();
    }, [searchParams, navigate, setUserData]); // Loại bỏ hasVerified khỏi dependencies

    return (
        <section className="auth">
            <div className="container">
                <div className="form-box modern-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
                    {status === 'verifying' && (
                        <>
                            <div style={{
                                fontSize: '48px',
                                color: '#007bff',
                                marginBottom: '20px',
                                animation: 'spin 1s linear infinite'
                            }}>
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                            <h2 style={{ color: '#007bff' }}>Đang xác thực...</h2>
                            <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div style={{
                                fontSize: '48px',
                                color: '#28a745',
                                marginBottom: '20px'
                            }}>
                                <div className="check-icon" role="img" aria-label="Xác thực thành công">
                                    <span className="visually-hidden">Xác thực thành công</span>
                                </div>
                            </div>
                            <h2 style={{ color: '#28a745' }}>Xác thực thành công!</h2>
                            <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
                            <div style={{
                                backgroundColor: '#d4edda',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid #c3e6cb',
                                marginBottom: '20px'
                            }}>
                                <p style={{ margin: '0', color: '#155724' }}>
                                    Tài khoản của bạn đã được kích hoạt và đăng nhập thành công!
                                </p>
                            </div>
                            <div style={{
                                backgroundColor: '#e7f3ff',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid #b3d9ff',
                                marginBottom: '20px'
                            }}>
                                <p style={{ margin: '0', color: '#0056b3', fontSize: '16px', fontWeight: '500' }}>
                                    Đang chuyển hướng về trang chủ trong {countdown} giây...
                                </p>
                            </div>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div style={{
                                fontSize: '48px',
                                color: '#dc3545',
                                marginBottom: '20px'
                            }}>

                            </div>
                            <h2 style={{ color: '#dc3545' }}>Xác thực thất bại</h2>
                            <p style={{ color: '#666', marginBottom: '30px' }}>{message}</p>
                            <div style={{
                                backgroundColor: '#f8d7da',
                                padding: '15px',
                                borderRadius: '8px',
                                border: '1px solid #f5c6cb',
                                marginBottom: '20px'
                            }}>
                                <p style={{ margin: '0', color: '#721c24' }}>
                                    Token có thể đã hết hạn hoặc đã được sử dụng. Vui lòng đăng ký lại hoặc liên hệ hỗ trợ.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/register')}
                                className="btn-primary"
                                style={{ marginRight: '10px', marginBottom: '20px' }}
                            >
                                Đăng ký lại
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary"
                                style={{ backgroundColor: '#6c757d' }}
                            >
                                Đăng nhập
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </section>
    );
};

export default VerifyEmail;
