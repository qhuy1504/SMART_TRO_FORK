/**
 * Login Session Schema - Theo dõi phiên đăng nhập
 */
import mongoose from 'mongoose';

const loginSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Thông tin thiết bị
    deviceInfo: {
        userAgent: String,           // User agent string
        browser: String,             // Chrome, Firefox, Safari, etc.
        browserVersion: String,      // Phiên bản browser
        os: String,                  // Windows, macOS, Linux, etc.
        osVersion: String,           // Phiên bản OS
        deviceType: String,          // desktop, mobile, tablet
        platform: String             // Win32, MacIntel, etc.
    },
    // Thông tin địa lý
    location: {
        ip: String,                  // IP address
        country: String,             // Quốc gia
        region: String,              // Tỉnh/thành
        city: String,                // Thành phố
        timezone: String,            // Múi giờ
        isp: String                  // Nhà cung cấp internet
    },
    // Thông tin phiên
    loginTime: {
        type: Date,
        default: Date.now
    },
    logoutTime: Date,
    isActive: {
        type: Boolean,
        default: true
    },
    sessionToken: String,            // JWT token (hashed)
    // Thông tin bảo mật
    loginMethod: {
        type: String,
        enum: ['password', 'google', 'facebook', 'email_verification'],
        default: 'password'
    },
    isSuccessful: {
        type: Boolean,
        default: true
    },
    failureReason: String,           // Lý do thất bại (nếu có)
    // Metadata
    sessionDuration: Number,         // Thời gian phiên (giây)
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index cho tìm kiếm nhanh
loginSessionSchema.index({ userId: 1, loginTime: -1 });
loginSessionSchema.index({ isActive: 1 });
loginSessionSchema.index({ ip: 1 });

// Method để format thời gian
loginSessionSchema.methods.getFormattedDuration = function() {
    if (!this.logoutTime || !this.loginTime) return null;
    
    const duration = Math.floor((this.logoutTime - this.loginTime) / 1000);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

// Static method để lấy sessions của user
loginSessionSchema.statics.getUserSessions = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ loginTime: -1 })
        .limit(limit)
        .lean();
};

// Static method để lấy active sessions của user
loginSessionSchema.statics.getActiveSessions = function(userId) {
    return this.find({
        userId,
        isActive: true
    }).sort({ lastActivity: -1 });
};

// Static method để lấy session history của user
loginSessionSchema.statics.getSessionHistory = function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ loginTime: -1 })
        .limit(limit);
};

// Static method để cleanup sessions cũ
loginSessionSchema.statics.cleanupOldSessions = function(days = 30) {
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    return this.deleteMany({
        isActive: false,
        logoutTime: { $lt: cutoffDate }
    });
};

export default mongoose.model('LoginSession', loginSessionSchema);
