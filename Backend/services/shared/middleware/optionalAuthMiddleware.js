/**
 * Optional Auth Middleware - Xác thực JWT token nếu có, nhưng không bắt buộc
 */
import jwt from 'jsonwebtoken';
import LoginSession from '../../../schemas/LoginSession.js';

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        // Kiểm tra bypass mode
        if (process.env.BYPASS_AUTH === 'true') {
            const defaultId = process.env.DEFAULT_LANDLORD_ID || null;
            req.user = { userId: defaultId, role: 'landlord', bypass: true };
            return next();
        }

        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Nếu không có token, tiếp tục mà không set user
        if (!token) {
            req.user = null;
            return next();
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Kiểm tra login session
            const loginSession = await LoginSession.findOne({
                userId: decoded.userId,
                token: token,
                isActive: true,
                expiresAt: { $gt: new Date() }
            });

            if (!loginSession) {
                // Token không hợp lệ, nhưng vẫn cho phép tiếp tục
                req.user = null;
                return next();
            }

            // Set user info nếu token hợp lệ
            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                sessionId: loginSession._id
            };

            return next();

        } catch (tokenError) {
            // Token không hợp lệ, nhưng vẫn cho phép tiếp tục
            console.log('Invalid token in optional auth:', tokenError.message);
            req.user = null;
            return next();
        }

    } catch (error) {
        console.error('Optional auth middleware error:', error);
        // Trong trường hợp lỗi, vẫn cho phép tiếp tục mà không user
        req.user = null;
        return next();
    }
};

export default optionalAuthMiddleware;
