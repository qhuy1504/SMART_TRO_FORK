/**
 * Payment History API Service - Frontend
 */
import API from './api.js';

class PaymentHistoryAPI {
    // Base URL cho payment history
    static BASE_URL = '/payment-history';

    // Lấy lịch sử thanh toán
    static async getPaymentHistory(params = {}) {
        try {
            const response = await API.get(this.BASE_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error getting payment history:', error);
            throw error;
        }
    }

    // Lấy chi tiết đơn hàng
    static async getOrderDetail(orderId) {
        try {
            const response = await API.get(`${this.BASE_URL}/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting order detail:', error);
            throw error;
        }
    }
}

export default PaymentHistoryAPI;
