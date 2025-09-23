/**
 * ChatBot Schema - Quản lý phiên chat với AI
 */
import mongoose from 'mongoose';

const chatBotSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    searchCriteria: {
        category: {
            type: String,
            enum: ['phong_tro', 'can_ho', 'nha_nguyen_can', 'chung_cu_mini', 'homestay']
        },
        priceRange: {
            min: Number,
            max: Number
        },
        location: {
            province: String,
            district: String,
            ward: String,
            keywords: [String] // Từ khóa địa điểm như "ĐH Bách Khoa", "chợ Bến Thành"
        },
        area: {
            min: Number,
            max: Number
        },
        amenities: [String],
        maxOccupants: String,
        extractedKeywords: [String] // Các từ khóa được AI extract từ tin nhắn
    },
    recommendations: [{
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property'
        },
        score: Number,
        reason: String,
        matchedCriteria: [String] // Danh sách tiêu chí phù hợp
    }],
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    context: {
        intent: String, // "search", "question", "greeting", etc.
        confidence: Number,
        entities: [{
            type: String,
            value: String,
            confidence: Number
        }]
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
chatBotSchema.index({ sessionId: 1 });
chatBotSchema.index({ user: 1, isActive: 1 });
chatBotSchema.index({ lastInteraction: -1 });

export default mongoose.model('ChatBot', chatBotSchema);
