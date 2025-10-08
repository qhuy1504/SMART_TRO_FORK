/**
 * SePay Authentication Middleware
 * Xác thực API key từ SePay webhook
 */

const sepayAuth = (req, res, next) => {
    try {
        // Lấy Authorization header
        const authHeader = req.headers.authorization;
        const expectedApiKey = process.env.SEPAY_API_KEY || 'SMARTTROH13';
        
        console.log('SePay Auth - Authorization header:', authHeader);
        
        if (!authHeader) {
            console.log('SePay Auth - Missing Authorization header');
            return res.status(401).json({
                success: false,
                message: 'Missing Authorization header'
            });
        }
        
        // Kiểm tra format "Apikey API_KEY_CUA_BAN"
        const apiKeyMatch = authHeader.match(/^Apikey\s+(.+)$/i);
        if (!apiKeyMatch) {
            console.log('SePay Auth - Invalid Authorization header format:', authHeader);
            return res.status(401).json({
                success: false,
                message: 'Invalid Authorization header format. Expected: "Apikey YOUR_API_KEY"'
            });
        }
        
        const providedApiKey = apiKeyMatch[1];
        if (providedApiKey !== expectedApiKey) {
            console.log('SePay Auth - Invalid API Key:', providedApiKey, 'Expected:', expectedApiKey);
            return res.status(401).json({
                success: false,
                message: 'Invalid API Key'
            });
        }
        
        console.log('SePay Auth - API Key validation successful');
        
        // Lưu API key vào request để sử dụng sau này nếu cần
        req.sepayApiKey = providedApiKey;
        
        next();
        
    } catch (error) {
        console.error('SePay Auth error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal authentication error'
        });
    }
};

export default sepayAuth;
