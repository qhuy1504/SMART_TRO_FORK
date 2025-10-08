import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PropertiesPackageAPI from '../../../services/PropertiesPackageAPI.js';
import './PropertiesPackage.css';
import { name } from 'dayjs/locale/vi.js';

const PropertiesPackage = () => {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const navigate = useNavigate();

  // State management
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [durationType, setDurationType] = useState('daily');
  const [duration, setDuration] = useState(3);
  const [addFastRent, setAddFastRent] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('sepay_qr');

  // Load packages on component mount
  useEffect(() => {
    loadPackages();
  }, []);

  // Reload packages when page becomes visible (in case data was updated in admin)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Always reload when page becomes visible to get latest data
        loadPackages();
      }
    };

    const handleFocus = () => {
      // Reload when window gains focus
      loadPackages();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Recalculate price when selections change
  useEffect(() => {
    if (selectedPackage && duration > 0) {
      calculatePrice();
    }
  }, [selectedPackage, durationType, duration, addFastRent]);

  // Load available packages
  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await PropertiesPackageAPI.getAllPackages();
      
      if (response.success) {
        console.log('Raw packages data:', response.data);
        console.log('Total packages received:', response.data?.length);
        
        // Filter active packages only (no duplicate removal since each package has unique _id)
        const activePackages = response.data.filter(pkg => pkg.isActive);
        console.log('Active packages:', activePackages.length, activePackages);
        
        const uniquePackages = activePackages
          .sort((a, b) => a.priority - b.priority); // Sort by priority
          
        console.log('Final filtered packages:', uniquePackages.length, uniquePackages);
        setPackages(uniquePackages);
        
        // Auto-select first package if none selected
        if (uniquePackages.length > 0 && !selectedPackage) {
          setSelectedPackage(uniquePackages[0]._id);
        }
      } else {
        toast.error('Không thể tải danh sách gói tin đăng');
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Lỗi khi tải danh sách gói tin đăng');
    } finally {
      setLoading(false);
    }
  };

  // Calculate package price based on selections
  const calculatePrice = async () => {
    try {
      const currentPkg = getCurrentPackage();
      if (!currentPkg) return;
      
      const response = await PropertiesPackageAPI.calculatePrice(
        currentPkg._id, // Use package ID for API call to get accurate pricing
        duration,
        durationType,
        addFastRent
      );
      console.log('Price calculation response:', response);
      
      if (response.success) {
        setPricing(response.data);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      toast.error('Lỗi khi tính giá gói tin đăng');
    }
  };

  // Get package details
  const getCurrentPackage = () => {
    return packages.find(pkg => pkg._id === selectedPackage);
  };

  // Handle duration type change
  const handleDurationTypeChange = (type) => {
    setDurationType(type);
    
    // Adjust minimum duration based on type
    switch (type) {
      case 'daily':
        setDuration(Math.max(3, duration));
        break;
      case 'weekly':
        setDuration(Math.max(1, Math.ceil(duration / 7)));
        break;
      case 'monthly':
        // Tính số tháng dựa trên tổng số ngày thực tế
        let estimatedMonths = 1;
        if (durationType === 'daily' && duration > 31) {
          // Ước lượng từ số ngày: sử dụng trung bình 30.4 ngày/tháng
          estimatedMonths = Math.ceil(duration / 30.4);
        } else if (durationType === 'weekly') {
          // Ước lượng từ số tuần: 1 tháng ≈ 4.3 tuần
          estimatedMonths = Math.ceil(duration / 4.3);
        }
        setDuration(Math.max(1, estimatedMonths));
        break;
      default:
        break;
    }
  };

  // Handle payment
  const handlePayment = () => {
    if (!pricing) {
      toast.error('Vui lòng chọn gói tin đăng');
      return;
    }

    if (!currentPackage) {
      toast.error('Vui lòng chọn gói tin đăng');
      return;
    }

    toast.info('Đang chuyển hướng đến trang thanh toán...');
    
    // Prepare payment data
    const paymentData = {
      propertyId,
      packageInfo: {
        ...pricing.packageInfo,
        packageId: currentPackage._id, // Ensure we have package ID
        _id: currentPackage._id,
        name: currentPackage.name,
        displayName: currentPackage.displayName,
        dailyPrice: currentPackage.dailyPrice,
      },
      pricing: pricing.pricing,
      timeline: {
        ...pricing.timeline,
        duration,
        durationType,
        durationDisplay: formatDurationDisplay()
      },
      paymentMethod: selectedPayment
    };
    
    console.log('Payment data:', paymentData);
    
    // Navigate to payment page
    navigate('/profile/payment', { state: paymentData });
  };

  // Back to my posts
  const handleBack = () => {
    navigate('/profile/my-posts');
  };

  // Render stars
  const renderStars = (count) => {
    return Array.from({ length: count }, (_, i) => (
      <i key={i} className="fa fa-star star-icon" style={{ color: '#ffc107' }}></i>
    ));
  };

  // Format duration display
  const formatDurationDisplay = () => {
    switch (durationType) {
      case 'daily':
        return `${duration} ngày`;
      case 'weekly':
        return `${duration} tuần (${duration * 7} ngày)`;
      case 'monthly':
        // Tính số ngày thực tế cho từng tháng (giống logic backend)
        let totalDaysInMonths = 0;
        const currentDate = new Date();
        
        for (let i = 0; i < duration; i++) {
          const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0);
          totalDaysInMonths += targetMonth.getDate();
        }
        
        return `${duration} tháng (${totalDaysInMonths} ngày)`;
      default:
        return `${duration} ngày`;
    }
  };

  if (loading) {
    return (
      <div className="profile-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin gói tin đăng...</p>
        </div>
      </div>
    );
  }

  const currentPackage = getCurrentPackage();

  return (
    <div className="profile-content">
      <div className="property-package-container">
          {/* Back Button - Top Left */}
          <div className="top-back-button">
            <button className="btn-back-top" onClick={handleBack}>
              <i className="fa fa-arrow-left"></i>
              Quay lại danh sách tin
            </button>
          </div>

          <div className="package-main-content">
            <div className="page-header-admin">
              <h2>
                <i className="fa fa-credit-card"></i>
                Thanh toán đăng tin
              </h2>
              <p>Chọn gói tin đăng phù hợp với nhu cầu của bạn</p>
            </div>

            {/* Package Selection */}
            <div className="package-selection-section">
              <h3>Chọn gói tin đăng</h3>
              
              {/* Duration Type Selection */}
              <div className="form-group">
                <label>Gói thời gian:</label>
                <select 
                  value={durationType} 
                  onChange={(e) => handleDurationTypeChange(e.target.value)}
                  className="form-select"
                >
                  <option value="daily">Đăng theo ngày</option>
                  <option value="weekly">Đăng theo tuần (giảm 10%)</option>
                  <option value="monthly">Đăng theo tháng (giảm 20%)</option>
                </select>
              </div>

              {/* Package Type Selection */}
              <div className="form-group">
                <label>Chọn loại tin:</label>
                <select 
                  value={selectedPackage} 
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="form-select"
                >
                  {packages.map((pkg, index) => (
                    <option key={pkg._id || `${pkg.name}-${index}`} value={pkg._id}>
                      {pkg.displayName} - {PropertiesPackageAPI.formatPrice(pkg.dailyPrice)}₫/ngày
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration Selection */}
              <div className="form-group">
                <label>
                  Số {durationType === 'daily' ? 'ngày' : durationType === 'weekly' ? 'tuần' : 'tháng'}:
                </label>
                <input
                  type="number"
                  min={durationType === 'daily' ? 3 : 1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  className="form-input"
                />
                <small className="form-help">
                  {durationType === 'daily' && 'Tối thiểu 3 ngày'}
                  {durationType === 'weekly' && 'Giảm 10% so với giá ngày'}
                  {durationType === 'monthly' && 'Giảm 20% so với giá ngày'}
                </small>
              </div>

            </div>

            {/* Package Preview */}
            {currentPackage && (
              <div className="package-preview-section">
                 <div className="preview-sample">
                    <button className="btn-preview">Xem trước mẫu {currentPackage.displayName}</button>
                  </div>
                <div className="package-preview">
                  <h4 style={{ color: currentPackage.color, textTransform: currentPackage.textStyle }}>
                    {currentPackage.displayName}
                    {currentPackage.stars > 0 && (
                      <span className="package-stars">
                        {renderStars(currentPackage.stars)}
                      </span>
                    )}
                  </h4>
                  <p>{currentPackage.description}</p>
                  
                  <ul className="package-features">
                    {currentPackage.features && currentPackage.features.map((feature, index) => (
                      <li key={index}>✓ {feature}</li>
                    ))}
                  </ul>
                  
                
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="payment-method-section">
              <h3>Chọn phương thức thanh toán</h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="sepay_qr"
                    checked={selectedPayment === 'sepay_qr'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                  />
                  <span className="payment-label">
                    <i className="fa fa-qrcode"></i>
                    Thanh toán quét mã QR Code Sepay
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-button-payment">
              <button className="btn-payment" onClick={handlePayment} disabled={!pricing}>
                <i className="fa fa-credit-card"></i>
                Thanh toán
              </button>
            </div>
          </div>

          {/* Sidebar - Payment Summary */}
          <div className="package-sidebar">
            <div className="payment-summary">
              <h3>Thông tin thanh toán</h3>
              
              {pricing ? (
                <div className="summary-details">
                  <div className="summary-row">
                    <span>Loại tin:</span>
                    <span style={{ 
                      color: currentPackage?.color || pricing.packageInfo.color, 
                      fontWeight: 'bold' 
                    }}>
                      {currentPackage?.displayName || pricing.packageInfo.name}
                    </span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Gói thời gian:</span>
                    <span>
                      {durationType === 'daily' && 'Đăng theo ngày'}
                      {durationType === 'weekly' && 'Đăng theo tuần'}
                      {durationType === 'monthly' && 'Đăng theo tháng'}
                    </span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Đơn giá:</span>
                    <span>{PropertiesPackageAPI.formatPrice(currentPackage?.dailyPrice || pricing.packageInfo.dailyPrice)}₫/ngày</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Thời gian VIP:</span>
                    <span>{formatDurationDisplay()}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>Ngày hết hạn:</span>
                    <span>
                      {pricing.timeline.expiryTime}, {PropertiesPackageAPI.formatDate(pricing.timeline.expiryDate)}
                    </span>
                  </div>

                  {addFastRent && (
                    <div className="summary-row">
                      <span>Phí cho thuê nhanh:</span>
                      <span>{PropertiesPackageAPI.formatPrice(pricing.pricing.fastRentFee)}₫</span>
                    </div>
                  )}
                  
                  <div className="summary-row">
                    <span>Thuế VAT (8%):</span>
                    <span>{PropertiesPackageAPI.formatPrice(pricing.pricing.vatAmount)}₫</span>
                  </div>
                  
                  <div className="summary-row total-row">
                    <span>Thành tiền:</span>
                    <span className="total-price">
                      {PropertiesPackageAPI.formatPrice(pricing.pricing.totalPrice)}₫
                    </span>
                  </div>
                </div>
              ) : (
                <div className="summary-placeholder">
                  <p>Chọn gói tin đăng để xem chi tiết giá cả</p>
                </div>
              )}
            </div>

            {/* Free Posts Notice */}
            <div className="free-posts-notice">
              <div className="notice-icon">
                <i className="fa fa-gift"></i>
              </div>
              <div className="notice-content">
                <h4>Ưu đãi đặc biệt!</h4>
                <p>3 tin đăng đầu tiên được miễn phí. Từ tin thứ 4 trở đi mới bắt đầu tính phí.</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default PropertiesPackage;