import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Tạo transporter với Gmail
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER, // Email Gmail
            pass: process.env.GMAIL_APP_PASSWORD // App Password từ Gmail
        }
    });
};

// Tạo OTP ngẫu nhiên
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
};

// Gửi email OTP
export const sendOTPEmail = async (email, otp) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Mã OTP khôi phục mật khẩu - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <h3 style="color: #007bff;">Khôi phục mật khẩu</h3>
                    <p>Xin chào,</p>
                    <p>Bạn đã yêu cầu khôi phục mật khẩu cho tài khoản của mình.</p>
                    <p>Mã OTP của bạn là:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    <p style="color: #dc3545; font-weight: bold;">Mã OTP này chỉ có hiệu lực trong 5 phút.</p>
                    <p>Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.</p>
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ Smart Trọ</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email thông báo đổi mật khẩu thành công
export const sendPasswordChangeNotification = async (email, fullName) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Thông báo thay đổi mật khẩu - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <h3 style="color: #28a745;">Mật khẩu đã được thay đổi thành công!</h3>
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>Mật khẩu tài khoản của bạn đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.</p>
                    <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                        <p style="margin: 0; color: #155724;">✅ Tài khoản của bạn hiện đã được bảo mật với mật khẩu mới.</p>
                    </div>
                    <p>Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức.</p>
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ Smart Trọ</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password change notification sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password change notification:', error);
        return { success: false, error: error.message };
    }
};

// Gửi email xác thực tài khoản (verification email)
export const sendVerificationEmail = async (email, fullName, verificationToken) => {
    try {
        const transporter = createTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Xác thực tài khoản - Smart Trọ',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333; text-align: center;">Smart Trọ</h2>
                    <h3 style="color: #007bff;">Chào mừng bạn đến với Smart Trọ!</h3>
                    <p>Xin chào <strong>${fullName}</strong>,</p>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại Smart Trọ. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                            🔗 Xác Thực Tài Khoản
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        Nếu nút không hoạt động, bạn có thể copy link sau vào trình duyệt:<br>
                        <a href="${verificationUrl}" style="color: #007bff; word-break: break-all;">${verificationUrl}</a>
                    </p>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404;">
                            ⚠️ <strong>Lưu ý:</strong> Link xác thực này có hiệu lực trong 24 giờ. Sau khi xác thực thành công, bạn sẽ được tự động đăng nhập.
                        </p>
                    </div>
                    
                    <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
                    <hr style="border: none; height: 1px; background-color: #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 14px;">Trân trọng,<br>Đội ngũ Smart Trọ</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error: error.message };
    }
};
