/**
 * Payment API Service - Frontend
 */
import API from './api.js';

class PaymentAPI {
    // Base URL cho payment
    static BASE_URL = '/payments';

    // Tạo đơn hàng thanh toán
    static async createPaymentOrder(orderData) {
        try {
            const response = await API.post(`${this.BASE_URL}/create-order`, orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating payment order:', error);
            throw error;
        }
    }

    // Tạo đơn hàng thanh toán cho gia hạn gói
    static async createRenewalPaymentOrder(orderData) {
        console.log('Creating renewal payment order with data:', orderData);
        try {
            const response = await API.post(`${this.BASE_URL}/create-renewal-order`, orderData);
            return response.data;
        } catch (error) {
            console.error('Error creating renewal payment order:', error);
            throw error;
        }
    }

    // Kiểm tra trạng thái thanh toán
    static async checkPaymentStatus(orderId) {
        try {
            const response = await API.get(`${this.BASE_URL}/status/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }

    // Polling kiểm tra trạng thái thanh toán
    static async pollPaymentStatus(orderId, maxAttempts = 30, interval = 15000) {
        return new Promise((resolve, reject) => {
            let attempts = 0;

            const poll = async () => {
                try {
                    attempts++;
                    const response = await this.checkPaymentStatus(orderId);
                    
                    if (response.success) {
                        const { status } = response.data;
                        
                        if (status === 'Paid') {
                            resolve(response.data);
                            return;
                        }
                        
                        if (status === 'Cancelled' || status === 'Refunded') {
                            reject(new Error(`Payment ${status.toLowerCase()}`));
                            return;
                        }
                    }

                    // Nếu chưa đạt max attempts thì tiếp tục poll
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        reject(new Error('Payment timeout'));
                    }
                } catch (error) {
                    if (attempts < maxAttempts) {
                        setTimeout(poll, interval);
                    } else {
                        reject(error);
                    }
                }
            };

            poll();
        });
    }

    // Format số tiền
    static formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Lấy thông tin đơn hàng đã tồn tại
    static async getOrderInfo(orderId) {
        try {
            console.log('Getting order info for orderId:', orderId);
            const response = await API.get(`${this.BASE_URL}/order/${orderId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting order info:', error);
            throw error;
        }
    }


    // Format number với dấu chấm phân cách
    static formatNumber(number) {
        return new Intl.NumberFormat('vi-VN').format(number);
    }

    // Lấy lịch sử gói của user
    static async getPackageHistory() {
        try {
            const response = await API.get(`${this.BASE_URL}/package-history`);
            return response.data;
        } catch (error) {
            console.error('Lỗi khi lấy lịch sử gói:', error);
            throw error;
        }
    }
 
}

export default PaymentAPI;
