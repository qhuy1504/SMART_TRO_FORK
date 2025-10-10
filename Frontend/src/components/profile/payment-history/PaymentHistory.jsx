import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import PaymentHistoryAPI from '../../../services/paymentHistoryAPI';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    payment_status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Load payment history
  const loadPayments = async () => {
    console.log('Loading payments with filters:', filters, 'and pagination:', pagination);
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };

      // Loại bỏ 'all' status khỏi params
      if (params.payment_status === 'all') {
        delete params.payment_status;
      }

      console.log('Calling API with params:', params);
      const response = await PaymentHistoryAPI.getPaymentHistory(params);
      console.log('API Response:', response);
      
      if (response.success) {
        console.log('Setting payments:', response.data.orders || []);
        
        // Xử lý dữ liệu orders để convert các field đặc biệt
        const processedOrders = (response.data.orders || []).map(order => ({
          ...order,
          // Convert Decimal128 to number
          total: order.total?.$numberDecimal ? parseFloat(order.total.$numberDecimal) : order.total,
          // Ensure ObjectId is string
          _id: order._id?.toString ? order._id.toString() : order._id,
          propertyId: order.propertyId ? {
            ...order.propertyId,
            _id: order.propertyId._id?.toString ? order.propertyId._id.toString() : order.propertyId._id
          } : null
        }));
        
        console.log('Processed orders:', processedOrders);
        setPayments(processedOrders);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      } else {
        console.log('API call failed:', response);
        toast.error('Không thể tải lịch sử thanh toán');
        setPayments([]);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
      console.error('Error details:', error.message);
      toast.error('Lỗi khi tải lịch sử thanh toán: ' + (error.message || 'Unknown error'));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Debug component mount
  useEffect(() => {
    console.log('PaymentHistory component mounted');
  }, []);

  // Load payments on component mount and filter changes
  useEffect(() => {
    console.log('useEffect triggered - loading payments');
    loadPayments();
  }, [filters.payment_status, filters.sortBy, filters.sortOrder, pagination.page]);

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

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      Paid: { class: 'status-paid', text: 'Đã thanh toán', icon: 'fa-check-circle' },
      Pending: { class: 'status-pending-payment-history', text: 'Chờ thanh toán', icon: 'fa-clock' },
      Failed: { class: 'status-failed', text: 'Thất bại', icon: 'fa-times-circle' },
      Cancelled: { class: 'status-cancelled', text: 'Đã hủy', icon: 'fa-ban' }
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fa ${config.icon}`}></i>
        {config.text}
      </span>
    );
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxPages = 5;
    const start = Math.max(1, pagination.page - Math.floor(maxPages / 2));
    const end = Math.min(pagination.totalPages, start + maxPages - 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  console.log('PaymentHistory component rendering with payments:', payments.length);
  console.log('Loading state:', loading);

  return (
    <div className="payment-history-my-properties">
      {/* Header */}
      <div className="payment-history-header">
        <h2>
          <i className="fa fa-credit-card"></i>
          Lịch Sử Thanh Toán
        </h2>
        <p>Quản lý và theo dõi tất cả các giao dịch thanh toán của bạn</p>
      </div>

      {/* Filters */}
      <div className="payment-history-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Trạng thái thanh toán</label>
            <select 
              className="filter-select"
              value={filters.payment_status}
              onChange={(e) => handleFilterChange('payment_status', e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="Paid">Đã thanh toán</option>
              <option value="Pending">Chờ thanh toán</option>
              <option value="Failed">Thất bại</option>
              <option value="Cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sắp xếp theo</label>
            <select 
              className="filter-select"
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="created_at">Ngày tạo</option>
              <option value="total">Tổng tiền</option>
              <option value="payment_status">Trạng thái</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Thứ tự</label>
            <select 
              className="filter-select"
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="payment-history-table">
        <div className="table-container">
          <table className="payment-table">
            <thead>
              <tr>
                <th className="stt-column">STT</th>
                <th>Phí Thanh Toán</th>
                <th>Thông Tin Gói</th>
                <th>Trạng Thái</th>
                <th>Mã Tin</th>
                <th>Ngày Tạo Hóa Đơn</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="loading-spinner">
                      <div className="spinner"></div>
                    </div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((payment, index) => (
                  <tr key={payment._id}>
                    <td className="stt-cell">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="total-cell">
                      {formatPrice(payment.total?.$numberDecimal ? parseFloat(payment.total.$numberDecimal) : payment.total)}
                    </td>
                    <td>
                      <div className="package-info">
                        <div className="package-name">
                          {payment.packageInfo?.name || payment.packageId?.name || 'Gói cơ bản'}
                        </div>
                        <div className="property-title">
                          {payment.propertyId?.title || payment.name || 'Không có thông tin'}
                        </div>
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(payment.payment_status)}
                    </td>
                    <td className="property-id-cell">
                      {payment.propertyId?._id && (
                        <span className="property-id">
                          #{payment.propertyId.toString().slice(-6).toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="time-cell">
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="no-payments">
                      <i className="fa fa-credit-card"></i>
                      <h3>Chưa có giao dịch nào</h3>
                      <p>Bạn chưa thực hiện giao dịch thanh toán nào.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {payments.length > 0 && (
        <div className="payment-history-pagination">
          <button 
            className="pagination-btn"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            <i className="fa fa-chevron-left"></i>
            Trước
          </button>

          <div className="page-numbers">
            {generatePageNumbers().map(pageNum => (
              <button
                key={pageNum}
                className={`page-number ${pageNum === pagination.page ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button 
            className="pagination-btn"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Sau
            <i className="fa fa-chevron-right"></i>
          </button>

          <div className="pagination-info">
            Trang {pagination.page} / {pagination.totalPages} - 
            Tổng {pagination.total} giao dịch
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
