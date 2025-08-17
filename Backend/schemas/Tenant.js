/**
 * Tenant Schema - Tách biệt khỏi User.
 * Lưu trữ thông tin khách thuê + hợp đồng đơn giản mà không cần tài khoản đăng nhập.
 */
import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  // Thông tin cá nhân cơ bản
  fullName: { type: String, required: true, trim: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true, index: true },
  address: { type: String, default: '' },
  identificationNumber: { type: String, trim: true }, // CMND/CCCD (tùy chọn)
  isActive: { type: Boolean, default: true },

  // Liên kết phòng & chủ trọ
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Thông tin thuê
  leaseStart: { type: Date, required: true },
  leaseEnd: { type: Date },
  rentPrice: { type: Number, required: true },
  deposit: { type: Number },
  status: { type: String, enum: ['active','ended','pending','cancelled'], default: 'active', index: true },
  notes: { type: String, default: '' },

  // Thanh toán đơn giản lưu inline
  payments: [{
    amount: { type: Number, required: true },
    paidAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['cash','bank','transfer','other'], default: 'cash' },
    note: String
  }],

  isArchived: { type: Boolean, default: false }
},{ timestamps: true });

// Đảm bảo không tạo trùng hợp đồng cùng phòng cùng tên vào cùng ngày bắt đầu
tenantSchema.index({ room:1, fullName:1, leaseStart:1 }, { unique: true });

export default mongoose.model('Tenant', tenantSchema);
