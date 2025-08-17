/**
 * Room Schema - Quản lý phòng trọ
 */
import mongoose from 'mongoose';

// Danh sách tiện ích chuẩn (enum)
export const AMENITY_VALUES = [
    'full_furniture',      // Đầy đủ nội thất
    'air_conditioner',     // Máy lạnh
    'refrigerator',        // Tủ lạnh
    'washing_machine',     // Máy giặt
    'water_heater',        // Máy nước nóng
    'wardrobe',            // Tủ quần áo
    'bed',                 // Giường
    'desk',                // Bàn học / bàn làm việc
    'wifi',                // Wi-Fi
    'parking',             // Chỗ để xe
    'kitchen',             // Khu bếp
    'balcony'              // Ban công
];

const roomSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: false // property trở thành tùy chọn
    },
    // Chủ sở hữu phòng (landlord). Nếu property không bắt buộc thì cần trường này để phân quyền.
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true
    },
    description: { type: String, default: '' },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    deposit: {
        type: Number,
        required: true,
        min: 0
    },
    area: { type: Number, min: 0 }, // m²
    floor: { type: Number, min: 0 },
    roomType: { type: String, enum: ['single', 'double', 'suite', 'dorm'], default: 'single' },
    // Sức chứa (số người). Tự động gán theo roomType nếu không truyền.
    capacity: { type: Number, min: 1, default: function() {
        const map = { single: 1, double: 2, suite: 3, dorm: 4 };
        return map[this.roomType] || 1;
    } },
    amenities: { 
        type: [{ type: String, enum: AMENITY_VALUES }],
        default: []
    }, // Danh sách tiện ích chuẩn
    images: { type: [String], default: [] }, // URLs của hình ảnh phòng
    status: {
        type: String,
        enum: ['available', 'rented'],
        default: 'available'
    },
    tenant: { // liên kết record Tenant đang thuê (nếu còn active)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },
    // Lịch sử thay đổi trạng thái
    statusHistory: {
        type: [
            {
                status: String,
                changedAt: { type: Date, default: Date.now },
                note: String,
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
            }
        ],
        default: []
    },
    // Đặt phòng (booking) cơ bản
    bookings: {
        type: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                startDate: Date,
                endDate: Date,
                status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    },
    // Doanh thu phát sinh (đơn giản hóa): mỗi mục là một kỳ thanh toán
    revenueRecords: {
        type: [
            {
                amount: Number,
                date: { type: Date, default: Date.now },
                note: String
            }
        ],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Unique roomNumber trong phạm vi property khi property tồn tại
roomSchema.index(
    { property: 1, roomNumber: 1 },
    { unique: true, partialFilterExpression: { property: { $exists: true, $ne: null } } }
);

// Index owner để tìm kiếm nhanh theo chủ trọ
roomSchema.index({ owner: 1 });

// Loại bỏ tiện ích trùng / không hợp lệ trước khi lưu
roomSchema.pre('save', function(next) {
    if (Array.isArray(this.amenities)) {
        this.amenities = [...new Set(this.amenities.filter(a => AMENITY_VALUES.includes(a)))];
    }
    // Nếu chưa có capacity hoặc capacity < 1 thì set lại theo roomType
    if (!this.capacity || this.capacity < 1) {
        const map = { single: 1, double: 2, suite: 3, dorm: 4 };
        this.capacity = map[this.roomType] || 1;
    }
    next();
});

// Thêm method tiện ích hợp lệ
roomSchema.statics.getAmenityValues = () => AMENITY_VALUES;

export default mongoose.model('Room', roomSchema);
