import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import PaymentAPI from '../../../services/PaymentAPI.js';
import PropertiesPackageAPI from '../../../services/PropertiesPackageAPI.js';
import './Payment.css';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state;

  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [countdown, setCountdown] = useState(900); // 15 minutes
  const [isPolling, setIsPolling] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false); // Flag để tránh tạo order duplicate
  const orderCreationRef = useRef(false); // Ref để tránh duplicate trong StrictMode

  useEffect(() => {
    if (!paymentData) {
      toast.error('Thông tin thanh toán không hợp lệ');
      navigate('/profile/properties-package');
      return;
    }

    // Chỉ tạo order 1 lần duy nhất (double protection với ref)
    if (!orderCreated && !orderCreationRef.current) {
      orderCreationRef.current = true;
      createPaymentOrder();
    }
  }, [paymentData, navigate, orderCreated]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus === 'processing' && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else if (countdown <= 0) {
      setPaymentStatus('failed');
      toast.error('Đã hết thời gian thanh toán');
    }
  }, [paymentStatus, countdown]);

  // Tạo đơn hàng thanh toán
  const createPaymentOrder = async () => {
    // Tránh tạo duplicate order
    if (orderCreated || loading) {
      return;
    }

    try {
      setLoading(true);
      setOrderCreated(true); // Đánh dấu đã bắt đầu tạo order
      
      const orderRequest = {
        propertyId: paymentData.propertyId,
        packageId: paymentData.packageInfo.packageId || paymentData.packageInfo._id,
        duration: paymentData.timeline.duration,
        durationType: paymentData.timeline.durationType,
        totalAmount: paymentData.pricing.totalPrice,
        packageInfo: paymentData.packageInfo
      };

      console.log('Creating payment order:', orderRequest);
      
      const response = await PaymentAPI.createPaymentOrder(orderRequest);
      
      if (response.success) {
        setOrderData(response.data);
        setPaymentStatus('processing');
        
        // Bắt đầu polling kiểm tra trạng thái thanh toán
        startPaymentPolling(response.data.orderId);
        
        toast.success('Đơn hàng đã được tạo. Vui lòng thực hiện chuyển khoản!');
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tạo đơn hàng');
      setPaymentStatus('failed');
      setOrderCreated(false); // Reset flag nếu có lỗi để có thể thử lại
    } finally {
      setLoading(false);
    }
  };

  // Bắt đầu polling kiểm tra thanh toán
  const startPaymentPolling = async (orderId) => {
    if (isPolling) return;
    
    try {
      setIsPolling(true);
      const result = await PaymentAPI.pollPaymentStatus(orderId, 60, 5000); // 60 attempts, 5s interval
      
      setPaymentStatus('success');
      toast.success('Thanh toán thành công!');
      
      // Delay một chút rồi chuyển về trang quản lý tin
      setTimeout(() => {
        navigate('/profile/my-posts');
      }, 3000);
      
    } catch (error) {
      console.error('Payment polling error:', error);
      if (error.message === 'Payment timeout') {
        setPaymentStatus('failed');
        toast.error('Hết thời gian chờ thanh toán');
      }
    } finally {
      setIsPolling(false);
    }
  };

  // Format thời gian countdown
  const formatCountdown = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Sao chép nội dung chuyển khoản
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Đã sao chép vào clipboard');
    }).catch(() => {
      toast.error('Không thể sao chép');
    });
  };

  // Quay lại
  const handleBack = () => {
    navigate('/profile/properties-package', { 
      state: { propertyId: paymentData?.propertyId }
    });
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tạo đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="payment-container">
        <div className="payment-failed">
          <div className="status-icon failed">
            <i className="fa fa-times-circle"></i>
          </div>
          <h2>Thanh toán không thành công</h2>
          <p>Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.</p>
          <button className="btn-retry" onClick={handleBack}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="payment-container">
        <div className="payment-success">
          <div className="status-icon success">
            <i className="fa fa-check-circle"></i>
          </div>
          <h2>Thanh toán thành công!</h2>
          <p>Tin đăng của bạn đã được nâng cấp thành công.</p>
          <p>Đang chuyển hướng về trang quản lý tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-content">
        {/* Header */}
        <div className="payment-header">
          <button className="btn-back" onClick={handleBack}>
            <i className="fa fa-arrow-left"></i>
            Quay lại
          </button>
          
          <h2>Thanh toán đăng tin</h2>
          
          <div className="payment-timer">
            <i className="fa fa-clock-o"></i>
            <span>Thời gian còn lại: {formatCountdown(countdown)}</span>
          </div>
        </div>

        <div className="payment-body">
          {/* QR Code Section */}
          <div className="qr-section">
            <h3>Quét mã QR để thanh toán</h3>
            
            {orderData?.qrCode && (
              <div className="qr-container">
                <img src={orderData.qrCode} alt="QR Code" className="qr-image" />
                <p className="qr-note">
                  Mở app ngân hàng và quét mã QR này để thanh toán
                </p>
              </div>
            )}
          </div>

          {/* Bank Info Section */}
          <div className="bank-info-section">
            <h3>Hoặc chuyển khoản thủ công</h3>
            
            {orderData?.bankInfo && (
              <div className="bank-details">
                <div className="bank-row">
                  <span className="label">Ngân hàng:</span>
                  <span className="value">TPBank (Ngân hàng TMCP Tiên Phong)</span>
                </div>
                
                <div className="bank-row">
                  <span className="label">Số tài khoản:</span>
                  <div className="value-with-copy">
                    <span>10002322482</span>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard('10002322482')}
                    >
                      <i className="fa fa-copy"></i>
                    </button>
                  </div>
                </div>
                
                <div className="bank-row">
                  <span className="label">Tên tài khoản:</span>
                  <span className="value">TRAN QUOC HUY</span>
                </div>
                
                <div className="bank-row">
                  <span className="label">Số tiền:</span>
                  <div className="value-with-copy amount">
                    <span>{PaymentAPI.formatNumber(orderData.amount)}₫</span>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(orderData.amount.toString())}
                    >
                      <i className="fa fa-copy"></i>
                    </button>
                  </div>
                </div>
                
                <div className="bank-row">
                  <span className="label">Nội dung:</span>
                  <div className="value-with-copy">
                    <span className="transfer-content">{orderData.transferContent}</span>
                    <button 
                      className="btn-copy"
                      onClick={() => copyToClipboard(orderData.transferContent)}
                    >
                      <i className="fa fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="payment-warning">
              <i className="fa fa-exclamation-triangle"></i>
              <p>
                <strong>Lưu ý quan trọng:</strong> Vui lòng nhập chính xác nội dung chuyển khoản 
                để hệ thống có thể tự động xác nhận thanh toán của bạn.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="payment-summary-section">
          <h3>Thông tin đơn hàng</h3>
          <div className="summary-details">
            <div className="summary-row">
              <span>Gói tin:</span>
              {console.log(`paymentData`, paymentData)}
              <span>{paymentData?.packageInfo?.displayName}</span>
            </div>
            <div className="summary-row">
              <span>Thời gian:</span>
              <span>{paymentData?.timeline?.durationDisplay}</span>
            </div>
            <div className="summary-row">
              <span>Tổng tiền:</span>
              <span className="total-amount">
                {PropertiesPackageAPI.formatPrice(paymentData?.pricing?.totalPrice)}₫
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        {isPolling && (
          <div className="payment-status">
            <div className="status-loading">
              <div className="loading-spinner small"></div>
              <span>Đang kiểm tra thanh toán...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
