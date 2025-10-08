/**
 * Payment Controller - Xử lý thanh toán SePay
 */
import crypto from 'crypto';
import Order from '../../../schemas/Order.js';
import Transaction from '../../../schemas/Transaction.js';
import { Property } from '../../../schemas/index.js';
import PropertiesPackage from '../../../schemas/PropertiesPackage.js';

// Generate SePay QR Code
const generateSepayQR = (order) => {
    const bankCode = process.env.SEPAY_BANK_CODE || 'TPBank';
    const accountNumber = process.env.SEPAY_ACCOUNT_NUMBER || '10002322482';
    const accountName = process.env.SEPAY_ACCOUNT_NAME || 'TRAN QUOC HUY';
    
    // Tạo nội dung chuyển khoản với mã đơn hàng (format: TKPH13 + OrderID)
    const transferContent = `TKPH13 DH${order._id.toString().slice(-6)}`;
    const amount = parseFloat(order.total.toString());

    // Tạo QR Code URL theo format SePay chính thức
    const qrCode = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bankCode}&amount=${amount}&des=${encodeURIComponent(transferContent)}`;

    return {
        qrCode,
        qrContent: `${bankCode}|${accountNumber}|${accountName}|${amount}|${transferContent}`,
        transferContent,
        bankInfo: {
            bankCode,
            accountNumber,
            accountName,
            amount
        }
    };
};

// Trích xuất Order ID từ nội dung chuyển khoản
const extractOrderIdFromContent = (content) => {
    if (!content) return null;
    
    // Tìm pattern "TKPH13 DH + 6 ký tự cuối của ObjectId"
    const match = content.match(/TKPH13\s+DH([a-fA-F0-9]{6})/i);
    if (!match) return null;
    
    const orderSuffix = match[1];
    // Trả về suffix để tìm order có _id kết thúc bằng suffix này
    return orderSuffix;
};

// Cập nhật property với package đã thanh toán
const updatePropertyPackage = async (order) => {
    try {
        const property = await Property.findById(order.propertyId);
        if (!property) return;

        const packageDetails = await PropertiesPackage.findById(order.packageId);
        if (!packageDetails) return;

        // Tính ngày hết hạn
        const startDate = new Date();
        let expiryDate = new Date(startDate);
        
        const { duration, durationType } = order.packageInfo;
        
        switch (durationType) {
            case 'daily':
                expiryDate.setDate(startDate.getDate() + parseInt(duration));
                break;
            case 'weekly':
                expiryDate.setDate(startDate.getDate() + (parseInt(duration) * 7));
                break;
            case 'monthly':
                expiryDate.setMonth(startDate.getMonth() + parseInt(duration));
                break;
        }

        // Cập nhật property
        property.packageInfo = {
            packageId: packageDetails._id,
            packageName: packageDetails.name,
            displayName: packageDetails.displayName,
            priority: packageDetails.priority,
            color: packageDetails.color,
            stars: packageDetails.stars,
            startDate: startDate,
            expiryDate: expiryDate,
            isActive: true,
            cancelledAt: null, // Reset trạng thái hủy
            isCancelled: false // Reset trạng thái hủy
        };
        
        property.isPaid = true;
        property.packageStatus = 'active'; // Reset trạng thái gói về active khi thanh toán thành công
        await property.save();

        console.log('Property package updated successfully:', property._id);

    } catch (error) {
        console.error('Error updating property package:', error);
    }
};

class PaymentController {
    // Tạo đơn hàng thanh toán
    async createPaymentOrder(req, res) {
        try {
            const { propertyId, packageId, duration, durationType, totalAmount, packageInfo } = req.body;
            const userId = req.user.userId;

            // Validate input
            if (!propertyId || !packageId || !totalAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                });
            }

            // Kiểm tra property thuộc về user
            const property = await Property.findOne({ 
                _id: propertyId, 
                owner: userId 
            });
            
            if (!property) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tin đăng'
                });
            }

            // Kiểm tra package tồn tại
            const packageDetails = await PropertiesPackage.findById(packageId);
            if (!packageDetails) {
                return res.status(404).json({
                    success: false,
                    message: 'Gói tin đăng không tồn tại'
                });
            }

            // Tạo order
            const order = new Order({
                total: totalAmount,
                payment_status: 'Unpaid',
                name: `Thanh toán gói ${packageDetails.displayName} cho tin ${property.title}`,
                propertyId: propertyId,
                userId: userId,
                packageId: packageId,
                packageInfo: {
                    name: packageDetails.displayName,
                    duration: duration,
                    durationType: durationType,
                    dailyPrice: packageDetails.dailyPrice
                }
            });

            await order.save();

            // Generate SePay QR Code
            const sepayData = generateSepayQR(order);
            console.log('Generated SePay Data:', sepayData);

            res.status(201).json({
                success: true,
                message: 'Tạo đơn hàng thành công',
                data: {
                    orderId: order._id,
                    amount: totalAmount,
                    qrCode: sepayData.qrCode,
                    qrContent: sepayData.qrContent,
                    transferContent: sepayData.transferContent,
                    bankInfo: sepayData.bankInfo
                }
            });

        } catch (error) {
            console.error('Error creating payment order:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }



    // Webhook nhận thông báo từ SePay
    async sepayWebhook(req, res) {
        try {
            console.log('SePay Webhook received:', JSON.stringify(req.body, null, 2));
            console.log('SePay Webhook API Key verified:', req.sepayApiKey);
            
        const {
            gateway = 'SEPAY',
            transactionDate,
            accountNumber,
            subAccount,
            code,
            content,
            transferType,
            description,
            transferAmount,
            referenceCode,
            accumulated,
            id,
            // Fallback cho format cũ nếu có
            transaction_date = transactionDate,
            account_number = accountNumber,
            sub_account = subAccount,
            transaction_content = content,
            amount_in = transferAmount,
            reference_number = referenceCode
        } = req.body;

        // Validate required fields - SePay sử dụng field 'content'
        const transactionContent = content || transaction_content;
        if (!transactionContent) {
            console.log('Missing content/transaction_content in webhook');
            return res.status(400).json({ 
                success: false, 
                message: 'Missing transaction content' 
            });
        }

        // Xử lý transactionDate an toàn (SePay format: "2025-10-08 20:18:10")
        let parsedTransactionDate = new Date();
        const dateString = transactionDate || transaction_date;
        
        if (dateString) {
            // SePay format: "2025-10-08 20:18:10" -> convert to ISO format
            const isoDateString = dateString.replace(' ', 'T') + '.000Z';
            const dateObj = new Date(isoDateString);
            
            if (!isNaN(dateObj.getTime())) {
                parsedTransactionDate = dateObj;
            } else {
                // Fallback: try direct parsing
                const fallbackDate = new Date(dateString);
                if (!isNaN(fallbackDate.getTime())) {
                    parsedTransactionDate = fallbackDate;
                }
            }
        }
        
        console.log('Original date string:', dateString);
        console.log('Parsed transaction_date:', parsedTransactionDate);

        // Lưu transaction trước
        const transaction = new Transaction({
            gateway,
            transaction_date: parsedTransactionDate,
            account_number: accountNumber || account_number,
            sub_account: subAccount || sub_account,
            amount_in: transferAmount || amount_in || 0,
            amount_out: 0, // SePay webhook chỉ có amount_in
            accumulated,
            code,
            transaction_content: transactionContent,
            reference_number: referenceCode || reference_number,
            body: JSON.stringify(req.body)
        });

        await transaction.save();

        // Tìm order từ nội dung chuyển khoản
        const orderSuffix = extractOrderIdFromContent(transactionContent);
            console.log('Extracted Order Suffix:', orderSuffix);

            if (!orderSuffix) {
                console.log('No Order ID found in transaction content');
                return res.status(200).json({ success: true, message: 'No order ID found' });
            }

            // Tìm order theo suffix (6 ký tự cuối của ObjectId)
            // Vì ObjectId field không thể dùng regex trực tiếp, ta sẽ tìm tất cả unpaid orders và filter
            const unpaidOrders = await Order.find({
                payment_status: 'Unpaid'
            });
            
            const order = unpaidOrders.find(o => 
                o._id.toString().endsWith(orderSuffix)
            );
            
            if (!order) {
                console.log('Order not found with suffix:', orderSuffix);
                return res.status(200).json({ success: true, message: 'Order not found' });
            }

            // Kiểm tra số tiền
            const paidAmount = parseFloat(transferAmount || amount_in || 0);
            const orderAmount = parseFloat(order.total.toString());

            console.log('Paid amount:', paidAmount, 'Order amount:', orderAmount);

            if (paidAmount >= orderAmount && order.payment_status === 'Unpaid') {
                // Cập nhật trạng thái order
                order.payment_status = 'Paid';
                order.transactionId = transaction._id;
                await order.save();

                // Cập nhật property với package
                await updatePropertyPackage(order);

                console.log('Payment successful for order:', order._id);
            }

            res.status(200).json({ 
                success: true, 
                message: 'Webhook processed successfully' 
            });

        } catch (error) {
            console.error('Webhook error:', error);
            res.status(200).json({ 
                success: false, 
                message: 'Webhook error',
                error: error.message 
            });
        }
    }



    // Kiểm tra trạng thái thanh toán
    async checkPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;
            
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }

            res.json({
                success: true,
                data: {
                    orderId: order._id,
                    status: order.payment_status,
                    amount: order.total,
                    createdAt: order.created_at
                }
            });

        } catch (error) {
            console.error('Error checking payment status:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }
}

const paymentController = new PaymentController();
export default paymentController;
