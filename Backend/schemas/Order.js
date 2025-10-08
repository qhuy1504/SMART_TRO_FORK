// models/Order.js
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  total: {
    type: mongoose.Decimal128,
    required: true,
    default: 0.00
  },
  payment_status: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Cancelled', 'Refunded'],
    default: 'Unpaid'
  },
  name: {
    type: String,
    trim: true
  },
  // Thông tin liên kết
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertiesPackage',
    required: true
  },
  // Thông tin gói đã chọn
  packageInfo: {
    name: String,
    duration: Number,
    durationType: String,
    dailyPrice: Number
  },
  // ID transaction khi thanh toán thành công
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// tạo model
const Order = mongoose.model('Order', orderSchema);
export default Order;
