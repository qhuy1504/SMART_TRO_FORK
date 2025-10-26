import Order from '../../../schemas/Order.js';
import User from '../../../schemas/User.js';
import Property from '../../../schemas/Property.js';

const paymentHistoryController = {
  // Lấy lịch sử thanh toán của user
  getPaymentHistory: async (req, res) => {
    console.log('Get Payment History Request Query:', req.query);
    try {
      const userId = req.user.userId;
      const {
        payment_status,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = req.query;

      // Tạo query filter
      const filter = { userId };
      
      if (payment_status && payment_status !== 'all') {
        filter.payment_status = payment_status;
      }

      // Debug: Kiểm tra tổng số orders trong DB
      const allOrdersCount = await Order.countDocuments();
      // Debug: Kiểm tra xem có orders nào của user này không
      const userOrdersCount = await Order.countDocuments({ userId });
     

      // Tạo sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Tính toán pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // Lấy tổng số records
      const total = await Order.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);
      // Lấy danh sách orders với populate
      const orders = await Order.find(filter)
        .populate('propertyId', 'title images location')
        .populate('packageId', 'name price duration')
        .populate('userId', 'fullName email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean();
      console.log(' Orders:', orders);

      res.json({
        success: true,
        message: 'Lấy lịch sử thanh toán thành công',
        data: {
          orders,
          pagination: {
            page: parseInt(page),
            limit: limitNum,
            total,
            totalPages
          }
        }
      });

    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy lịch sử thanh toán',
        error: error.message
      });
    }
  },

  // Lấy chi tiết đơn hàng
  getOrderDetail: async (req, res) => {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      const order = await Order.findOne({ 
        _id: orderId, 
        userId 
      })
        .populate('propertyId', 'title images location price')
        .populate('packageId', 'name price duration description features')
        .populate('userId', 'fullName email phone')
        .populate('transactionId')
        .lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng'
        });
      }

      res.json({
        success: true,
        message: 'Lấy chi tiết đơn hàng thành công',
        data: {
          order: {
            ...order,
            packageInfo: order.packageId,
            propertyInfo: order.propertyId,
            userInfo: order.userId,
            transactionInfo: order.transactionId
          }
        }
      });

    } catch (error) {
      console.error('Error in getOrderDetail:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy chi tiết đơn hàng',
        error: error.message
      });
    }
  }
};

export default paymentHistoryController;
