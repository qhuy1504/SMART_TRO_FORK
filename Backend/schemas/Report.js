/**
 * Report Schema - Quản lý báo cáo bài đăng
 */
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Cho phép báo cáo ẩn danh
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    reason: {
        type: String,
        enum: [
            'fake',
            'inappropriate', 
            'spam',
            'duplicate',
            'price',
            'other'
        ],
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true
    },
    propertyTitle: {
        type: String,
        trim: true
    },
    propertyOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'dismissed'],
        default: 'pending'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    // Thông tin xử lý bởi admin
    actionTaken: {
        type: String,
        trim: true
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    },
    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

export default mongoose.model('Report', reportSchema);
