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

  // Thời hạn gói - cho phép 0 hoặc null cho gói trial vĩnh viễn
  duration: {
    type: Number,
    required: false, // Không bắt buộc để cho phép null
    default: function() {
      // Nếu là gói trial, mặc định null (vĩnh viễn).
      return this.type === 'trial' ? null : 1;
    },
    validate: {
      validator: function(value) {
        // Nếu value là null hoặc undefined, luôn cho phép
        if (value === null || value === undefined) {
          return true;
        }
        
        // Nếu là số, phải >= 0
        if (typeof value === 'number') {
          return value >= 0;
        }
        
        return false;
      },
      message: 'Duration phải là số >= 0 hoặc null'
    }
  },

  // Đơn vị thời gian - cho phép null cho gói trial vĩnh viễn.
  durationUnit: {
    type: String,
    enum: ['day', 'month', 'year', null],
    default: function() {
      // Nếu là gói trial và duration null, mặc định null
      return (this.type === 'trial' && (this.duration === null || this.duration === 0)) ? null : 'month';
    },
    required: false, // Không bắt buộc để cho phép null
    validate: {
      validator: function(value) {
        // Luôn cho phép null
        if (value === null || value === undefined) {
          return true;
        }
        
        // Nếu có giá trị, phải là một trong các enum hợp lệ
        return ['day', 'month', 'year'].includes(value);
      },
      message: 'DurationUnit phải là day, month, year hoặc null'
    }
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
