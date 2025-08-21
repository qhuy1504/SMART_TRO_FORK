/**
 * Device Info Utility - Parse thông tin thiết bị và địa lý
 */
import { UAParser } from 'ua-parser-js';

class DeviceInfoService {
    // Parse user agent để lấy thông tin thiết bị
    static parseUserAgent(userAgent) {
        const parser = new UAParser(userAgent);
        const result = parser.getResult();
        
        return {
            browser: result.browser.name || 'Unknown',
            browserVersion: result.browser.version || 'Unknown',
            os: result.os.name || 'Unknown', 
            osVersion: result.os.version || 'Unknown',
            deviceType: result.device.type || 'desktop',
            platform: result.cpu.architecture || 'Unknown'
        };
    }
    
    // Lấy thông tin địa lý từ IP (sử dụng service miễn phí)
    static async getLocationFromIP(ip) {
        try {
            // Bỏ qua localhost
            if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
                return {
                    ip: ip,
                    country: 'Local',
                    region: 'Local',
                    city: 'Local',
                    timezone: 'Asia/Ho_Chi_Minh',
                    isp: 'Local Network'
                };
            }

            // Sử dụng ip-api.com (miễn phí, 1000 requests/month)
            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,timezone,isp,query`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    ip: data.query,
                    country: data.country || 'Unknown',
                    region: data.regionName || 'Unknown', 
                    city: data.city || 'Unknown',
                    timezone: data.timezone || 'Unknown',
                    isp: data.isp || 'Unknown'
                };
            }
            
            throw new Error(data.message || 'Failed to get location');
            
        } catch (error) {
            console.error('Error getting location from IP:', error);
            return {
                ip: ip,
                country: 'Unknown',
                region: 'Unknown',
                city: 'Unknown', 
                timezone: 'Unknown',
                isp: 'Unknown'
            };
        }
    }
    
    // Lấy IP thực từ request
    static getClientIP(req) {
        return req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               '127.0.0.1';
    }
    
    // Tạo device fingerprint đơn giản
    static createDeviceFingerprint(deviceInfo, ip) {
        const data = `${deviceInfo.browser}_${deviceInfo.os}_${ip}`;
        return Buffer.from(data).toString('base64').substring(0, 16);
    }
    
    // Format thông tin để hiển thị
    static formatDeviceInfo(session) {
        const device = session.deviceInfo;
        const location = session.location;
        
        return {
            deviceString: `${device.browser} ${device.browserVersion} on ${device.os}`,
            locationString: `${location.city}, ${location.region}, ${location.country}`,
            deviceType: device.deviceType,
            loginTime: session.loginTime,
            isActive: session.isActive,
            duration: session.getFormattedDuration?.() || null
        };
    }
}

export default DeviceInfoService;
