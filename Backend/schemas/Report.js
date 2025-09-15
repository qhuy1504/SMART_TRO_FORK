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
    reportedProperty: {
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
        enum: ['pending', 'reviewed', 'resolved', 'rejected'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        trim: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true
});

export default mongoose.model('Report', reportSchema);
