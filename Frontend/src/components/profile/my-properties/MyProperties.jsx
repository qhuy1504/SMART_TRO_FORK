import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { myPropertiesAPI } from '../../../services/myPropertiesAPI';
import EditPropertyModal from '../edit-property-modal/EditPropertyModal';
import '../ProfilePages.css';
import './MyProperties.css';
import './PaymentTags.css';
import { FaEllipsisV, FaComment  } from "react-icons/fa";


const MyProperties = () => {
  const { t } = useTranslation();

  // States
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Filters & Search
  const [filters, setFilters] = useState({
    approvalStatus: 'all', // all, pending, approved, rejected, hidden .
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: ''
  });

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProperty, setDeletingProperty] = useState(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [togglingProperty, setTogglingProperty] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Package Info Modal
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Cancel Package Modal
  const [showCancelPackageModal, setShowCancelPackageModal] = useState(false);
  const [cancelingPackage, setCancelingPackage] = useState(null);

  // Rejected files state
  const [rejectedFiles, setRejectedFiles] = useState({ images: [], video: [] });

  // Dropdown menu state
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'Tất cả', icon: 'fa-list' },
    { value: 'pending', label: 'Chờ duyệt', icon: 'fa-clock-o' },
    { value: 'approved', label: 'Đã duyệt', icon: 'fa-check-circle' },
    { value: 'rejected', label: 'Bị từ chối', icon: 'fa-times-circle' },
    { value: 'hidden', label: 'Đã ẩn', icon: 'fa-eye-slash' }
  ];

  // Load properties on component mount and filter changes (bỏ filters.search để không tự động search)
  useEffect(() => {
    loadProperties();
  }, [filters.approvalStatus, filters.sortBy, filters.sortOrder, pagination.page]);

  // Load properties lần đầu khi component mount
  useEffect(() => {
    loadProperties();
  }, []);

  // State để lưu danh sách properties gốc
  const [originalProperties, setOriginalProperties] = useState([]);
  
  // State để lưu toàn bộ kết quả search
  const [searchResults, setSearchResults] = useState([]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.property-dropdown')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Load properties from API with custom parameters
  const loadPropertiesWithParams = async (customParams = null) => {
    try {
      setLoading(true);
      const params = customParams || {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      const response = await myPropertiesAPI.getMyProperties(params);
      if (response.success) {
        // console.log('Properties loaded:', response.data.properties);
        const loadedProperties = response.data.properties || [];
        setProperties(loadedProperties);
        
        // Lưu danh sách gốc khi không có search
        if (!params.search || params.search.trim() === '') {
          setOriginalProperties(loadedProperties);
        }
        
        // Cập nhật pagination với dữ liệu từ params nếu có
        setPagination(prev => ({
          ...prev,
          page: params.page || prev.page,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      } else {
        toast.error('Không thể tải danh sách tin đăng');
        setProperties([]);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Lỗi khi tải danh sách tin đăng');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Load properties from API (wrapper for backward compatibility)
  const loadProperties = async () => {
    await loadPropertiesWithParams();
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle search input change (chỉ update state, không search ngay)
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  // Handle search execution (thực hiện tìm kiếm)
  const executeSearch = () => {
    const searchTerm = filters.search.trim();
    
    if (!searchTerm) {
      // Nếu search rỗng, reset search results và load lại từ API
      setSearchResults([]);
      setProperties([]);
      
      const resetParams = {
        approvalStatus: filters.approvalStatus,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: '',
        page: 1,
        limit: pagination.limit
      };
      
      loadPropertiesWithParams(resetParams);
      return;
    }

    // Kiểm tra nếu là tìm kiếm theo mã tin (6 ký tự hex)
    if (searchTerm.length === 6 && /^[a-fA-F0-9]{6}$/i.test(searchTerm)) {
      // Tìm kiếm theo ID trong danh sách hiện tại trước
      const localResult = originalProperties.filter(property => 
        property._id.slice(-6).toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (localResult.length > 0) {
        handleSearchResults(localResult);
        return;
      }
    } else {
      // Tìm kiếm theo title trong danh sách hiện tại trước
      const localResult = originalProperties.filter(property =>
        property.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (localResult.length > 0) {
        handleSearchResults(localResult);
        return;
      }
    }

    // Nếu không tìm thấy local thì mới gọi API
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    loadProperties();
  };

  // Function để xử lý kết quả search và phân trang
  const handleSearchResults = (results) => {
    setSearchResults(results);
    const totalPages = Math.ceil(results.length / pagination.limit);
    
    // Cập nhật pagination
    setPagination(prev => ({
      ...prev,
      page: 1,
      total: results.length,
      totalPages: totalPages
    }));
    
    // Hiển thị kết quả của trang đầu tiên
    const startIndex = 0;
    const endIndex = pagination.limit;
    setProperties(results.slice(startIndex, endIndex));
  };

  // Handle clear search - reset về trang 1 và load lại toàn bộ danh sách
  const clearSearch = () => {
    // Reset search term
    setFilters(prev => ({ ...prev, search: '' }));
    
    // Reset search results
    setSearchResults([]);

    // Reset properties
    setProperties([]);
    
    // Load lại danh sách từ API với params reset
    const resetParams = {
      approvalStatus: filters.approvalStatus,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      search: '', // Reset search term
      page: 1,
      limit: pagination.limit
    };
    
    loadPropertiesWithParams(resetParams);
  };

  // Handle Enter key press
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // Handle edit property
  const handleEdit = async (property) => {
    try {
      const response = await myPropertiesAPI.getPropertyForEdit(property._id);
    
      if (response.success) {
        setEditingProperty(response.data);
        setShowEditModal(true);
      } else {
        toast.error('Không thể tải thông tin tin đăng để chỉnh sửa');
      }
    } catch (error) {
      console.error('Error loading property for edit:', error);
      toast.error('Lỗi khi tải thông tin tin đăng');
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (property) => {
    setDeletingProperty(property);
    setShowDeleteModal(true);
  };

  // Handle delete property
  const handleDelete = async () => {
    if (!deletingProperty) return;

    try {
      const response = await myPropertiesAPI.deleteProperty(deletingProperty._id);
      if (response.success) {
        toast.success('Đã xóa tin đăng thành công');
        setShowDeleteModal(false);
        setDeletingProperty(null);
        loadProperties(); // Reload list
      } else {
        toast.error(response.message || 'Không thể xóa tin đăng');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Lỗi khi xóa tin đăng');
    }
  };

  // Handle dropdown toggle
  const handleDropdownToggle = (propertyId) => {
    setActiveDropdown(activeDropdown === propertyId ? null : propertyId);
  };

  // Handle promote property to top
  const handlePromoteProperty = async (property) => {
    try {
      // Đóng dropdown
      setActiveDropdown(null);

      // Call API để promote property lên đầu trang
      const response = await myPropertiesAPI.promotePropertyToTop(property._id);
      if (response.success) {
        toast.success('Đã đưa tin đăng lên đầu trang thành công');
        loadProperties(); // Reload list
      } else {
        toast.error(response.message || 'Không thể đưa tin đăng lên đầu trang');
      }
    } catch (error) {
      console.error('Error promoting property:', error);
      toast.error('Lỗi khi đưa tin đăng lên đầu trang');
    }
  };

  // Handle payment - redirect to payment page
  const handlePayment = (property) => {
    // Đóng dropdown nếu đang mở
    setActiveDropdown(null);
    
    // Navigate to payment page với property ID
    window.location.href = `/profile/properties-package?propertyId=${property._id}`;
  };

  // Handle toggle status confirmation
  const handleToggleStatusConfirm = (property) => {
    setTogglingProperty(property);
    setShowToggleModal(true);
  };

  // Handle toggle status (hide/show)
  const handleToggleStatus = async () => {
    if (!togglingProperty) return;

    try {
      const response = await myPropertiesAPI.togglePropertyStatus(togglingProperty._id);
      if (response.success) {
        const action = togglingProperty.status === 'available' ? 'ẩn' : 'hiện';
        toast.success(`Đã ${action} tin đăng`);
        setShowToggleModal(false);
        setTogglingProperty(null);
        loadProperties(); // Reload list
      } else {
        toast.error(response.message || 'Không thể thay đổi trạng thái');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Lỗi khi thay đổi trạng thái');
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
    
    // Chỉ sử dụng search results khi có dữ liệu search và search term không rỗng
    if (searchResults.length > 0 && filters.search.trim()) {
      const startIndex = (newPage - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      setProperties(searchResults.slice(startIndex, endIndex));
    }
    // Nếu không có search results hoặc search rỗng, useEffect sẽ tự động load từ API
  };

  // Handle view property detail
  const handleViewDetail = (property) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
  };

  // Handle view package info
  const handleViewPackageInfo = (property) => {
    setSelectedPackage(property);
    setShowPackageModal(true);
  };

  // Handle cancel package confirmation
  const handleCancelPackageConfirm = (property) => {
    setCancelingPackage(property);
    setShowCancelPackageModal(true);
    setShowPackageModal(false); // Đóng modal thông tin gói
  };

  // Handle cancel package
  const handleCancelPackage = async () => {
    if (!cancelingPackage) return;

    try {
      const response = await myPropertiesAPI.cancelPropertyPackage(cancelingPackage._id);
      if (response.success) {
        toast.success('Đã hủy gói tin thành công');
        setShowCancelPackageModal(false);
        setCancelingPackage(null);
        loadProperties(); // Reload list để cập nhật trạng thái
      } else {
        toast.error(response.message || 'Không thể hủy gói tin');
      }
    } catch (error) {
      console.error('Error canceling package:', error);
      toast.error('Lỗi khi hủy gói tin');
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', text: 'Chờ duyệt', icon: 'fa-clock-o' },
      approved: { class: 'status-approved', text: 'Đã duyệt', icon: 'fa-check-circle' },
      rejected: { class: 'status-rejected', text: 'Bị từ chối', icon: 'fa-times-circle' },
      hidden: { class: 'status-hidden', text: 'Đã ẩn', icon: 'fa-eye-slash' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`status-badge-my-properties ${config.class}`}>
        <i className={`fa ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Format large numbers for stats (views, comments, favorites)
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days remaining until expiry
  const getDaysRemaining = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const diffTime = expiry - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Đã hết hạn';
    } else if (diffDays === 0) {
      return 'Hết hạn hôm nay';
    } else if (diffDays === 1) {
      return 'Còn 1 ngày';
    } else {
      return `Còn ${diffDays} ngày`;
    }
  };

  // Get CSS class based on days remaining
  const getDaysRemainingClass = (expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
    
    const diffTime = expiry - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 3) {
      return 'critical';
    } else if (diffDays <= 7) {
      return 'warning';
    } else {
      return 'safe';
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header-my-properties">
        <h2>
          <i className="fa fa-list"></i>
          Quản lý tin đăng của tôi
        </h2>
        <p>Xem và quản lý các tin đăng cho thuê phòng trọ của bạn</p>
      </div>

      <div className="content-card-my-properties">
        {/* Filters & Search */}
        <div className="properties-controls">
          <div className="controls-left">
            <div className="search-box">
              <i className="fa fa-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề hoặc mã tin (6 ký tự)..."
                value={filters.search}
                onChange={handleSearchInputChange}
                onKeyPress={handleSearchKeyPress}
                title="Nhập tiêu đề để tìm theo tên hoặc nhập 6 ký tự cuối của mã tin để tìm chính xác. Ấn Enter hoặc click nút tìm kiếm để thực hiện."
              />
              {filters.search && (
                <button 
                  type="button"
                  className="clear-search-btn-my-properties"
                  onClick={clearSearch}
                  title="Xóa tìm kiếm"
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
              <button 
                type="button"
                className="search-btn-my-properties"
                onClick={executeSearch}
                title="Tìm kiếm"
              >
                <i className="fa fa-search"></i>
              </button>
              {filters.search && filters.search.length === 6 && /^[a-fA-F0-9]{6}$/i.test(filters.search) && (
                <div className="search-hint">
                  <i className="fa fa-info-circle"></i>
                  <span>Đang tìm theo mã tin</span>
                </div>
              )}
            </div>
          </div>

          <div className="controls-right">
            <div className="filter-group">
              <label>Trạng thái:</label>
              <select
                value={filters.approvalStatus}
                onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sắp xếp:</label>
              <select
                value={`${filters.sortBy}_${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('_');
                  setFilters(prev => ({
                    ...prev,
                    sortBy,
                    sortOrder
                  }));
                }}
              >
                <option value="createdAt_desc">Mới nhất</option>
                <option value="createdAt_asc">Cũ nhất</option>
                <option value="title_asc">Tiêu đề A-Z</option>
                <option value="title_desc">Tiêu đề Z-A</option>
                <option value="rentPrice_desc">Giá cao nhất</option>
                <option value="rentPrice_asc">Giá thấp nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="properties-content">
          {loading ? (
            <div className="loading-state">
              <i className="fa fa-spinner fa-spin"></i>
              <p>Đang tải danh sách tin đăng...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <i className="fa fa-home"></i>
              <h3>Chưa có tin đăng nào</h3>
              <p>Bạn chưa có tin đăng nào. Hãy tạo tin đăng mới để bắt đầu!</p>
            </div>
          ) : (
            <>
              <div className="properties-grid">
                {properties.map(property => (
                  <div key={property._id} className="property-card">
                    <div className="property-image">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          onError={(e) => {
                            e.target.src = '/images/placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="no-image">
                          <i className="fa fa-home"></i>
                        </div>
                      )}

                      {/* Property ID Tag - Mã tin */}
                      <div className="property-id-tag">
                        <span className="id-tag">
                          <i className="fa fa-tag"></i>
                          {property._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="property-status">
                        {getStatusBadge(property.approvalStatus)}
                      </div>
                      {/* Payment Status Tag - hiển thị cho bài từ thứ 4 trở đi */}
                      {property.postOrder && property.postOrder > 3 && (
                        <div className="payment-status-tag">
                          {property.packageStatus === 'cancelled' ? (
                            <span className="cancelled-tag">
                              <i className="fa fa-ban"></i>
                              ĐÃ HỦY GÓI
                            </span>
                          ) : property.isPaid ? (
                            <span className="paid-tag">
                              <i className="fa fa-check-circle"></i>
                              ĐÃ THANH TOÁN
                            </span>
                          ) : (
                            <span className="unpaid-tag">
                              <i className="fa fa-exclamation-triangle"></i>
                              CHƯA THANH TOÁN
                            </span>
                          )}
                        </div>
                      )}                      {/* Dropdown Menu - hiện với pending, approved và rejected */}
                      {(property.approvalStatus === 'pending' || property.approvalStatus === 'approved' || property.approvalStatus === 'rejected') && (
                        <div className="property-dropdown">
                          <button
                            className="dropdown-toggle"
                            onClick={() => handleDropdownToggle(property._id)}
                          >
                            <FaEllipsisV className="text-black cursor-pointer" />
                          </button>

                          {activeDropdown === property._id && (
                            <div className="dropdown-menu">
                              {property.approvalStatus === 'approved' && (
                                <>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handlePromoteProperty(property)}
                                  >
                                    <i className="fa fa-arrow-up"></i>
                                    Đưa tin lên đầu trang
                                  </button>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleToggleStatusConfirm(property)}
                                  >
                                    <i className={`fa ${property.status === 'available' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    {property.status === 'available' ? 'Ẩn tin đăng' : 'Hiện tin đăng'}
                                  </button>
                                </>
                              )}
                              
                              {/* Nút xóa - hiển thị cho tất cả trạng thái */}
                              <button
                                className="dropdown-item delete-item"
                                onClick={() => handleDeleteConfirm(property)}
                              >
                                <i className="fa fa-trash"></i>
                                Xóa tin đăng
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="property-info">
                      <h3 className="property-title">{property.title}</h3>
                      <div className="property-details">
                        <div className="detail-item">
                          <i className="fa fa-money"></i>
                          <span>{formatPrice(property.rentPrice)}</span>
                          <span className="currency">VNĐ/tháng</span>
                        </div>
                        <div className="detail-item">
                          <i className="fa fa-expand"></i>
                          <span>{property.area}m²</span>
                        </div>
                        <div className="detail-item">
                          <i className="fa fa-map-marker"></i>
                          <span>{property.location?.detailAddress}, {property.location?.wardName}, {property.location?.districtName},{property.location?.provinceName}</span>
                        </div>
                        <div className="detail-item">
                          <i className="fa fa-calendar"></i>
                          <span>Đăng: {formatDate(property.createdAt)}</span>
                        </div>
                      </div>

                     

                      <div className="property-stats">
                        <div className="stat-item">
                          <i className="fa fa-eye"></i>
                          <span>{formatNumber(property.views || 0)} lượt xem</span>
                        </div>
                        <div className="stat-item">
                          <i className="fa fa-comment"></i>
                          <span>{formatNumber(property.comments || 0)} bình luận</span>
                        </div>
                        <div className="stat-item">
                          <i className="fa fa-heart"></i>
                          <span>{formatNumber(property.favorites || 0)} yêu thích</span>
                        </div>
                      </div>
                       {/* Fixed section cho package và payment status */}
                      <div className="package-payment-fixed-section">
                        {/* Package Info Button - chỉ hiển thị button khi có packageInfo, đã thanh toán và gói chưa bị hủy */}
                        {property.packageInfo && property.packageInfo.isActive && property.isPaid && property.packageStatus !== 'cancelled' && (
                          <div className="package-button-section">
                            <button
                              className="btn btn-package-info"
                              onClick={() => handleViewPackageInfo(property)}
                            >
                              <i className="fa fa-star"></i>
                              GÓI ĐANG SỬ DỤNG
                            </button>
                          </div>
                        )}

                      
                      </div>

                      <div className="property-actions">
                        {/* Nút Sửa - chỉ hiện ở pending và approved, không hiện ở rejected */}
                        {property.approvalStatus !== 'rejected' && (
                          <button
                            className="btn btn-outline btn-edit"
                            onClick={() => handleEdit(property)}
                          >
                            <i className="fa fa-edit"></i>
                            Sửa
                          </button>
                        )}

                        {/* Logic thanh toán dựa trên thứ tự bài đăng */}
                        {property.approvalStatus === 'pending' && (
                          <>
                            {/* 3 bài đầu: Miễn phí, không hiện nút thanh toán */}
                            {(!property.postOrder || property.postOrder <= 3) ? (
                              <div className="free-post-notice">
                                <span className="free-tag">
                                  <i className="fa fa-gift"></i>
                                  MIỄN PHÍ
                                </span>
                              </div>
                            ) : (
                              /* Từ bài thứ 4: Hiển thị nút thanh toán khi chưa thanh toán HOẶC đã hủy gói */
                              (!property.isPaid || property.packageStatus === 'cancelled') && (
                                <button
                                  className="btn btn-primary btn-payment"
                                  onClick={() => handlePayment(property)}
                                >
                                  <i className="fa fa-credit-card"></i>
                                  {property.packageStatus === 'cancelled' ? 'Chọn gói mới' : 'Thanh toán'}
                                </button>
                              )
                            )}
                          </>
                        )}

                        {/* Trạng thái rejected: chỉ Lý do + Dropdown */}
                        {property.approvalStatus === 'rejected' && (
                          <button
                            className="btn btn-info btn-view-detail"
                            onClick={() => handleViewDetail(property)}
                            title="Xem chi tiết và lý do từ chối"
                          >
                            <i className="fa fa-eye"></i>
                            Lý do
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination-container">
                  <div className="pagination">
                    <button
                      className="pagination-btn-my-properties"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      <i className="fa fa-chevron-left"></i>
                      Trước
                    </button>

                    <div className="pagination-info-my-properties">
                      Trang {pagination.page} / {pagination.totalPages}
                      <span className="total-info">
                        ({pagination.total} tin đăng)
                      </span>
                    </div>

                    <button
                      className="pagination-btn-my-properties"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Sau
                      <i className="fa fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Package Info Modal */}
      {showPackageModal && selectedPackage && (
        <div className="modal-overlay-package" onClick={() => setShowPackageModal(false)}>
          <div className="package-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-package">
              <h2>
                <i className="fa fa-star"></i>
                Thông tin gói tin
              </h2>
              <button
                className="close-btn-package"
                onClick={() => setShowPackageModal(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className="modal-content-package">
              <div className="package-detail-content">
        

                <div className="package-info-detail">
                  <div className="package-name-detail">
                    <span className={`package-badge-large priority-${selectedPackage.packageInfo.priority}`}>
                      {selectedPackage.packageInfo.displayName}
                    </span>
                    {selectedPackage.packageInfo.stars > 0 && (
                      <div className="package-stars-large">
                        {[...Array(selectedPackage.packageInfo.stars)].map((_, i) => (
                          <i key={i} className="fa fa-star star-icon-large"></i>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="package-features">
                    <h5>
                      <i className="fa fa-list"></i>
                      Đặc quyền gói tin
                    </h5>
                    <div className="features-grid">
                      <div className="feature-item">
                        <i className="fa fa-arrow-up text-success"></i>
                        <span>Tin được ưu tiên hiển thị</span>
                      </div>
                      <div className="feature-item">
                        <i className="fa fa-arrow-up text-success"></i>
                        <span>Độ ưu tiên: {selectedPackage.packageInfo.priority}</span>
                      </div>
                      {selectedPackage.packageInfo.stars > 0 && (
                        <div className="feature-item">
                          <i className="fa fa-star text-warning"></i>
                          <span>Đánh giá: {selectedPackage.packageInfo.stars} sao</span>
                        </div>
                      )}
                      {selectedPackage.packageInfo.color && (
                        <div className="feature-item">
                          <i className="fa fa-palette text-info"></i>
                          <span>
                            Màu nổi bật: 
                            <span 
                              className="color-swatch" 
                              style={{ backgroundColor: selectedPackage.packageInfo.color }}
                              title={selectedPackage.packageInfo.color}
                            ></span>
                          </span>
                        </div>
                      )}
                      <div className="feature-item">
                        <i className="fa fa-check-circle text-success"></i>
                        <span>Tin được duyệt nhanh hơn</span>
                      </div>
                    </div>
                  </div>

                  <div className="package-timeline">
                    <h5>
                      <i className="fa fa-calendar"></i>
                      Thời gian sử dụng
                    </h5>
                    <div className="timeline-items">
                      <div className="timeline-item">
                        <div className="timeline-icon start">
                          <i className="fa fa-play-circle"></i>
                        </div>
                        <div className="timeline-content">
                          <strong>Ngày bắt đầu</strong>
                          <span>{formatDate(selectedPackage.packageInfo.startDate)}</span>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className="timeline-icon end">
                          <i className="fa fa-stop-circle"></i>
                        </div>
                        <div className="timeline-content">
                          <strong>Ngày hết hạn</strong>
                          <span>{formatDate(selectedPackage.packageInfo.expiryDate)}</span>
                        </div>
                      </div>
                      <div className="timeline-item">
                        <div className={`timeline-icon remaining ${getDaysRemainingClass(selectedPackage.packageInfo.expiryDate)}`}>
                          <i className="fa fa-clock"></i>
                        </div>
                        <div className="timeline-content">
                          <strong>Thời gian còn lại</strong>
                          <span className={`remaining-text ${getDaysRemainingClass(selectedPackage.packageInfo.expiryDate)}`}>
                            {getDaysRemaining(selectedPackage.packageInfo.expiryDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="package-stats">
                    <h5>
                      <i className="fa fa-chart-bar"></i>
                      Hiệu quả tin đăng
                    </h5>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon">
                          <i className="fa fa-eye"></i>
                        </div>
                        <div className="stat-content">
                          <strong>{formatNumber(selectedPackage.views || 0)}</strong>
                          <span>Lượt xem</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">
                          <i className="fa fa-comment"></i>
                        </div>
                        <div className="stat-content">
                          <strong>{formatNumber(selectedPackage.comments || 0)}</strong>
                          <span>Bình luận</span>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon">
                          <i className="fa fa-heart"></i>
                        </div>
                        <div className="stat-content">
                          <strong>{formatNumber(selectedPackage.favorites || 0)}</strong>
                          <span>Yêu thích</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer-package">
              <button
                className="btn btn-cancel-package"
                onClick={() => handleCancelPackageConfirm(selectedPackage)}
              >
                <i className="fa fa-times-circle"></i>
                Hủy gói
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Package Confirmation Modal */}
      {showCancelPackageModal && cancelingPackage && (
        <div className="modal-overlay-cancel-package">
          <div className="cancel-package-modal">
            <div className="modal-header-cancel-package">
              <h3>
                <i className="fa fa-exclamation-triangle text-warning"></i>
                Xác nhận hủy gói tin
              </h3>
              <button
                className="close-btn-cancel-package"
                onClick={() => {
                  setShowCancelPackageModal(false);
                  setCancelingPackage(null);
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            
            <div className="modal-content-cancel-package">
              <div className="cancel-package-info">
                <div className="property-info-cancel">
                  <h4>Tin đăng: "{cancelingPackage.title}"</h4>
                  <div className="package-info-cancel">
                    <span className={`package-badge priority-${cancelingPackage.packageInfo.priority}`}>
                      {cancelingPackage.packageInfo.displayName}
                    </span>
                    <div className="package-time-remaining">
                      <i className="fa fa-clock"></i>
                      <span className={`remaining-text ${getDaysRemainingClass(cancelingPackage.packageInfo.expiryDate)}`}>
                        {getDaysRemaining(cancelingPackage.packageInfo.expiryDate)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="warning-content">
                  <div className="warning-item">
                    <i className="fa fa-info-circle text-info"></i>
                    <span>Sau khi hủy gói, tin đăng sẽ trở về trạng thái thường và mất các đặc quyền của gói tin.</span>
                  </div>
                  <div className="warning-item">
                    <i className="fa fa-exclamation-triangle text-warning"></i>
                    <span>Thời gian sử dụng còn lại sẽ không được hoàn lại.</span>
                  </div>
                  <div className="warning-item">
                    <i className="fa fa-ban text-danger"></i>
                    <span>Hành động này không thể hoàn tác!</span>
                  </div>
                </div>
                
                <div className="confirmation-question">
                  <strong>Bạn có chắc chắn muốn hủy gói tin này không?</strong>
                </div>
              </div>
            </div>
            
            <div className="modal-actions-cancel-package">
              <button
                className="btn btn-secondary-cancel"
                onClick={() => {
                  setShowCancelPackageModal(false);
                  setCancelingPackage(null);
                }}
              >
                <i className="fa fa-arrow-left"></i>
                Quay lại
              </button>
              <button
                className="btn btn-danger-cancel"
                onClick={handleCancelPackage}
              >
                <i className="fa fa-times-circle"></i>
                Xác nhận hủy gói
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Detail Modal */}
      {showDetailModal && selectedProperty && (
        <div className="modal-overlay-reason-my-properties" onClick={() => setShowDetailModal(false)}>
          <div className="property-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-management">
              <h2>Chi tiết bài đăng</h2>
              <button
                className="close-btn-management"
                onClick={() => setShowDetailModal(false)}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className="modal-content-management">
              <div className="property-detail-content-management">
                <div className="detail-header">
                  <h4>{selectedProperty.title}</h4>
                  {getStatusBadge(selectedProperty.approvalStatus)}
                </div>

                {selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="property-images">
                    <img
                      src={selectedProperty.images[0]}
                      alt={selectedProperty.title}
                      className="detail-main-image"
                      onError={(e) => {
                        e.target.src = '/images/placeholder.jpg';
                      }}
                    />
                  </div>
                )}

                <div className="property-info-detail">
                  <div className="detail-item">
                    <strong>Giá thuê:</strong>
                    <span>{formatPrice(selectedProperty.rentPrice)} VNĐ/tháng</span>
                  </div>
                  <div className="detail-item">
                    <strong>Diện tích:</strong>
                    <span>{selectedProperty.area}m²</span>
                  </div>
                  <div className="detail-item">
                    <strong>Địa chỉ:</strong>
                    <span>
                      {selectedProperty.location?.detailAddress}, {selectedProperty.location?.wardName}, 
                      {selectedProperty.location?.districtName}, {selectedProperty.location?.provinceName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Ngày đăng:</strong>
                    <span>{formatDate(selectedProperty.createdAt)}</span>
                  </div>
                  
                  {selectedProperty.approvalStatus === 'rejected' && selectedProperty.rejectionReason && (
                    <div className="detail-item reject-reason">
                      <strong>Lý do từ chối:</strong>
                      <span className="rejection-text">{selectedProperty.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {selectedProperty.description && (
                  <div className="description">
                    <strong>Mô tả:</strong>
                    <p>{selectedProperty.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {showEditModal && editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => {
            setShowEditModal(false);
            setEditingProperty(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingProperty(null);
            loadProperties();
          }}
        />
      )}

      {/* Toggle Status Confirmation Modal */}
      {showToggleModal && togglingProperty && (
        <div className="modal-overlay-hidden">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>Xác nhận {togglingProperty.status === 'available' ? 'ẩn' : 'hiện'} tin đăng</h3>
            </div>
            <div className="modal-content">
              <p>Bạn có chắc chắn muốn {togglingProperty.status === 'available' ? 'ẩn' : 'hiện'} tin đăng:</p>
              <p className="property-title-delete">"{togglingProperty.title}"</p>
              {togglingProperty.status === 'available' && (
                <p className="warning-text">
                  <i className="fa fa-info-circle"></i>
                  Tin đăng sẽ không hiển thị trên trang chủ khi bị ẩn!
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn-hidden btn-secondary-hidden"
                onClick={() => {
                  setShowToggleModal(false);
                  setTogglingProperty(null);
                }}
              >
                Hủy
              </button>
              <button
                className={`btn ${togglingProperty.status === 'available' ? 'btn-warning' : 'btn-success'}`}
                onClick={handleToggleStatus}
                style={{
                  backgroundColor: togglingProperty.status === 'available' ? '#6c757d' : '#fd7e14',
                  borderColor: togglingProperty.status === 'available' ? '#6c757d' : '#fd7e14'
                }}
              >
                <i className={`fa ${togglingProperty.status === 'available' ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                {togglingProperty.status === 'available' ? 'Ẩn tin đăng' : 'Hiện tin đăng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingProperty && (
        <div className="modal-overlay-management">
          <div className="delete-modal">
            <div className="modal-header-management">
              <h3>Xác nhận xóa tin đăng</h3>
              <button
                className="close-btn-management"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProperty(null);
                }}
              >
                <i className="fa fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <p>Bạn có chắc chắn muốn xóa tin đăng:</p>
              <p className="property-title-delete">"{deletingProperty.title}"</p>
              <p className="warning-text">
                <i className="fa fa-warning"></i>
                Hành động này không thể hoàn tác!
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingProperty(null);
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <i className="fa fa-trash"></i>
                Xóa tin đăng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProperties;