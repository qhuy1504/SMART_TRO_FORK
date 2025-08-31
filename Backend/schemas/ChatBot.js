/**
 * ChatBot Schema - Quản lý phiên chat với AI
 */
import mongoose from 'mongoose';

const chatBotSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        type: {
            type: String,
            enum: ['apartment', 'house', 'room', 'boarding_house']
        },
        priceRange: {
            min: Number,
            max: Number
        },
        location: {
            province: String,
            district: String,
            ward: String
        },
        amenities: [String],
        bedrooms: Number,
        bathrooms: Number
    },
    recommendations: [{
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property'
        },
        score: Number,
        reason: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('ChatBot', chatBotSchema);
