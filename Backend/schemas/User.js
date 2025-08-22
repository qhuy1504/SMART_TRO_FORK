/**
 * User Schema - Quản lý người dùng
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: function() {
            // Phone chỉ required nếu không đăng nhập qua Google
            return !this.googleId;
        },
        validate: {
            validator: function(v) {
                // Nếu là tài khoản Google và phone rỗng thì hợp lệ
                if (this.googleId && (!v || v.trim() === '')) {
                    return true;
                }
                // Nếu có phone thì phải đúng format
                if (v && v.trim()) {
                    return /^[0-9]{10}$/.test(v);
                }
                // Nếu không có googleId thì phone bắt buộc
                return !(!this.googleId && (!v || v.trim() === ''));
            },
            message: 'Số điện thoại phải có 10 chữ số'
        },
        unique: true,
        sparse: true // Cho phép multiple null values
    },
    password: {
        type: String,
        required: function() {
            // Password chỉ required nếu không đăng nhập qua Google
            return !this.googleId;
        },
        minlength: 6
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Cho phép multiple null values
    },
    role: {
        type: String,
        enum: ['tenant', 'landlord', 'admin'],
        default: 'tenant'
    },
    avatar: String,
    address: {
        street: String,
        ward: String,
        district: String,
        province: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password trước khi lưu
userSchema.pre('save', async function(next) {
    // Chỉ hash password nếu có password và được modified
    if (!this.password || !this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// So sánh password
userSchema.methods.comparePassword = async function(candidatePassword) {
    // Nếu không có password (Google login), return false
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
