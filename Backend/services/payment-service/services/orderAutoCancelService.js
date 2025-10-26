/**
 * Order Auto Cancel Service - Tự động hủy đơn hàng sau 15 phút
 */
import Order from '../../../schemas/Order.js';
import cron from 'node-cron';

class OrderAutoCancelService {
    constructor() {
        this.isRunning = false;
    }

    /**
     * Khởi động service auto-cancel
     */
    start() {
        if (this.isRunning) {
            console.log('Order Auto Cancel Service is already running');
            return;
        }

        console.log('Starting Order Auto Cancel Service...');
        
        // Chạy mỗi 5 phút để kiểm tra các đơn hàng cần hủy
        this.cronJob = cron.schedule('*/5 * * * *', async () => {
            await this.processExpiredOrders();
        }, {
            scheduled: false
        });

        this.cronJob.start();
        this.isRunning = true;
        
        console.log('Order Auto Cancel Service started successfully');
    }

    /**
     * Dừng service
     */
    stop() {
        if (!this.isRunning) {
            console.log('Order Auto Cancel Service is not running');
            return;
        }

        console.log('Stopping Order Auto Cancel Service...');
        
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob.destroy();
        }
        
        this.isRunning = false;
        console.log('Order Auto Cancel Service stopped');
    }

    /**
     * Xử lý các đơn hàng đã hết hạn (quá 15 phút)
     */
    async processExpiredOrders() {
        try {
            console.log('Checking for expired orders...');
            
            // Tính thời gian 15 phút trước
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            
            // Tìm các orders chưa thanh toán và được tạo trước 15 phút
            const expiredOrders = await Order.find({
                payment_status: 'Unpaid',
                created_at: { $lte: fifteenMinutesAgo }
            });

            if (expiredOrders.length === 0) {
                console.log('No expired orders found');
                return;
            }

            console.log(`Found ${expiredOrders.length} expired orders to cancel`);

            // Hủy từng order
            let cancelledCount = 0;
            for (const order of expiredOrders) {
                try {
                    await this.cancelExpiredOrder(order);
                    cancelledCount++;
                } catch (error) {
                    console.error(`Error cancelling order ${order._id}:`, error);
                }
            }

            console.log(`Successfully cancelled ${cancelledCount}/${expiredOrders.length} expired orders`);

        } catch (error) {
            console.error('Error processing expired orders:', error);
        }
    }

    /**
     * Hủy một đơn hàng đã hết hạn
     * @param {Object} order - Order object
     */
    async cancelExpiredOrder(order) {
        try {
            // Kiểm tra lại trạng thái trước khi hủy (tránh race condition)
            const currentOrder = await Order.findById(order._id);
            if (!currentOrder || currentOrder.payment_status !== 'Unpaid') {
                console.log(`Order ${order._id} is no longer unpaid, skipping cancellation`);
                return;
            }

            // Cập nhật trạng thái order
            currentOrder.payment_status = 'Cancelled';
            currentOrder.cancelReason = 'Auto-cancelled - No payment received within 15 minutes';
            currentOrder.cancelledAt = new Date();
            await currentOrder.save();

            console.log(`Auto-cancelled order ${order._id} (created: ${order.created_at})`);

            // Có thể thêm logic gửi email thông báo cho user ở đây
            // await this.notifyUserOrderCancelled(order);

        } catch (error) {
            console.error(`Error cancelling expired order ${order._id}:`, error);
            throw error;
        }
    }

    /**
     * Kiểm tra trạng thái service
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            nextRun: this.cronJob ? this.cronJob.nextDate() : null,
            checkInterval: '5 minutes',
            orderTimeout: '15 minutes'
        };
    }

    /**
     * Chạy ngay lập tức (cho testing)
     */
    async runNow() {
        console.log('Running order auto-cancel check immediately...');
        await this.processExpiredOrders();
    }

    /**
     * Thống kê đơn hàng hết hạn trong khoảng thời gian
     * @param {Date} startDate 
     * @param {Date} endDate 
     */
    async getExpiredOrdersStats(startDate, endDate) {
        try {
            const stats = await Order.aggregate([
                {
                    $match: {
                        payment_status: 'Cancelled',
                        cancelReason: { $regex: /Auto-cancelled.*15 minutes/i },
                        cancelledAt: {
                            $gte: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago default
                            $lte: endDate || new Date()
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalCancelled: { $sum: 1 },
                        totalAmount: { $sum: { $toDouble: '$total' } },
                        avgAmount: { $avg: { $toDouble: '$total' } }
                    }
                }
            ]);

            return stats[0] || {
                totalCancelled: 0,
                totalAmount: 0,
                avgAmount: 0
            };
        } catch (error) {
            console.error('Error getting expired orders stats:', error);
            return { totalCancelled: 0, totalAmount: 0, avgAmount: 0 };
        }
    }
}

// Tạo singleton instance
const orderAutoCancelService = new OrderAutoCancelService();

export default orderAutoCancelService;
