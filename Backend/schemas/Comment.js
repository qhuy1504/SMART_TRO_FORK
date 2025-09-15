/**
 * Comment Schema - Quản lý bình luận và đánh giá bài đăng
 */
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: false
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    likesCount: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index cho performance
commentSchema.index({ property: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });

// Virtual cho replies count
commentSchema.virtual('repliesCount').get(function() {
    return this.replies ? this.replies.length : 0;
});

// Middleware để cập nhật replies khi tạo comment con
commentSchema.post('save', async function() {
    if (this.parentComment) {
        await mongoose.model('Comment').findByIdAndUpdate(
            this.parentComment,
            { $addToSet: { replies: this._id } }
        );
    }
});

export default mongoose.model('Comment', commentSchema);
