import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    otp: {
        type: String,
        required: true,
        length: 6
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // OTP hết hạn sau 5 phút (300 giây)
    },
    verified: {
        type: Boolean,
        default: false
    }
});

// Index để tự động xóa document sau khi hết hạn
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
