import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Token hết hạn sau 24 giờ (86400 giây)
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: {
        type: Date
    }
});

// Index để tự động xóa document sau khi hết hạn
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
