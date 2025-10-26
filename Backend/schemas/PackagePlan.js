import mongoose from 'mongoose';

const packagePlanSchema = new mongoose.Schema({
  // Tên gói (Basic, VIP, Premium, hoặc tên tùy chỉnh)
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['trial','basic', 'vip', 'premium', 'custom'], // Xác định loại
    default: 'custom' // Nếu admin tạo thêm thì mặc định là tùy chỉnh
  },

  displayName: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },
    // Số lượt đẩy tin miễn phí theo gói
  freePushCount: {
    type: Number,
    required: true,
    min: 0
  },


  // Giá gói (VNĐ)
  price: {
    type: Number,
    required: true,
    min: 0
  },

  // Thời hạn gói (số)
  duration: {
    type: Number,
    required: true,
    min: 1
  },

  // Đơn vị thời gian
  durationUnit: {
    type: String,
    enum: ['day', 'month', 'year'],
    required: true
  },

  /**
   * propertiesLimits - Tham chiếu đến PropertiesPackage
   * Mỗi mục cho biết loại tin và số lượng cho phép
   */
  propertiesLimits: [
    {
      packageType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PropertiesPackage',
        required: true
      },
      limit: {
        type: Number,
        required: true,
        min: 0
      }
    }
  ],


  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('PackagePlan', packagePlanSchema);
