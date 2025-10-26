/**
 * Payment Controller - Xử lý thanh toán SePay
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../../../schemas/Order.js';
import Transaction from '../../../schemas/Transaction.js';
import User from '../../../schemas/User.js';
import { Property } from '../../../schemas/index.js';
import PropertiesPackage from '../../../schemas/PropertiesPackage.js';
import PackagePlan from '../../../schemas/PackagePlan.js';
import { reactivateUserProperties } from '../../user-service/controllers/userController.js';


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

// Cập nhật packageInfo của các tin đăng đang chạy (giữ nguyên gói cũ đến hết hạn)
const updateActivePropertiesPackageInfo = async (userId) => {
    try {
        console.log('Updating active properties package info for user:', userId);

        // Tìm tất cả tin đăng đang active của user
        const activeProperties = await Property.find({
            owner: userId,
            approvalStatus: 'approved',
            status: 'available',
            isDeleted: { $ne: true },
            'packageInfo.isActive': true
        });

        console.log(`Found ${activeProperties.length} active properties to update`);

        // Cập nhật từng tin đăng
        for (const property of activeProperties) {
            if (property.packageInfo && property.packageInfo.expiryDate) {
                const now = new Date();
                const expiryDate = new Date(property.packageInfo.expiryDate);

                // Nếu tin đăng chưa hết hạn, giữ nguyên packageInfo cũ
                if (expiryDate > now) {
                    console.log(`Property ${property._id}: keeping old package until ${expiryDate.toLocaleDateString()}`);

                    // Thêm flag để đánh dấu tin này sẽ tự động chuyển về gói mới khi hết hạn
                    property.packageInfo.willUpgradeAfterExpiry = true;
                    property.packageInfo.upgradeDate = now;

                    await property.save();
                } else {
                    // Nếu tin đăng đã hết hạn, sẽ được xử lý bởi cron job hoặc logic khác
                    console.log(`Property ${property._id}: package already expired`);
                }
            }
        }

        console.log('Finished updating active properties package info');

    } catch (error) {
        console.error('Error updating active properties package info:', error);
    }
};

// Cập nhật user package đã thanh toán (upgrade cho toàn bộ tài khoản hoặc renewal gói cũ)
const updateUserPackage = async (order, migrationData = null) => {
    try {
        const user = await User.findById(order.userId);
        if (!user) {
            console.error('User not found:', order.userId);
            return;
        }

        const startDate = new Date();
        let expiryDate = new Date(startDate);
        
        // Kiểm tra xem có phải là renewal gói cũ không (user quay lại dùng gói đã từng dùng)
        const isOldPackageRenewal = order.packageInfo?.isRenewal === true;

        // Xử lý PackagePlan cho user
        if (order.packagePlanId) {
            const packagePlan = await PackagePlan.findById(order.packagePlanId);
            if (!packagePlan) {
                console.error('PackagePlan not found:', order.packagePlanId);
                return;
            }

            // Tính ngày hết hạn dựa trên duration và durationUnit
            const duration = order.packageInfo?.duration || packagePlan.durationDays;
            const durationUnit = order.packageInfo?.durationUnit || 'day';

            console.log('Setting user package to:', packagePlan.displayName, 'for duration:', duration, durationUnit);

            // Tính ngày hết hạn theo đơn vị thời gian
            switch (durationUnit) {
                case 'month':
                    expiryDate.setMonth(startDate.getMonth() + parseInt(duration));
                    break;
                case 'year':
                    expiryDate.setFullYear(startDate.getFullYear() + parseInt(duration));
                    break;
                case 'day':
                default:
                    expiryDate.setDate(startDate.getDate() + parseInt(duration));
                    break;
            }

            // 1. LƯU LỊCH SỬ GÓI CŨ (nếu có currentPackagePlan)
            if (user.currentPackagePlan && user.currentPackagePlan.packagePlanId) {
                console.log('Moving current package to history:', user.currentPackagePlan.displayName);

                // Chuẩn bị thông tin tin đăng được chuyển (nếu có migration)
                let transferredProperties = [];
                if (migrationData && migrationData.selectedProperties && migrationData.selectedProperties.length > 0) {
                    for (const migrationProperty of migrationData.selectedProperties) {
                        try {
                            const property = await Property.findById(migrationProperty.propertyId);
                            if (property && property.owner.toString() === user._id.toString()) {
                                transferredProperties.push({
                                    propertyId: property._id,
                                    propertyTitle: property.title,
                                    postType: migrationProperty.currentPostType || migrationProperty.newPostType,
                                    transferredToPackage: {
                                        packagePlanId: packagePlan._id,
                                        displayName: packagePlan.displayName
                                    },
                                    transferDate: new Date()
                                });
                            }
                        } catch (error) {
                            console.error(`Error getting property info for ${migrationProperty.propertyId}:`, error);
                        }
                    }
                }

                // Di chuyển gói hiện tại sang packageHistory với status tương ứng
                const historyStatus = isOldPackageRenewal ? 'renewed' : 'upgraded';
                const historyEntry = {
                    packagePlanId: user.currentPackagePlan.packagePlanId,
                    packageInstanceId: user.currentPackagePlan.packageInstanceId, // Lưu instance ID cũ của giai đoạn hiện tại
                    packageName: user.currentPackagePlan.packageName,
                    displayName: user.currentPackagePlan.displayName,
                    priority: user.currentPackagePlan.priority,
                    color: user.currentPackagePlan.color,
                    stars: user.currentPackagePlan.stars,
                    freePushCount: user.currentPackagePlan.freePushCount,
                    usedPushCount: user.currentPackagePlan.usedPushCount || 0,
                    purchaseDate: user.currentPackagePlan.purchaseDate,
                    expiryDate: user.currentPackagePlan.expiryDate,
                    status: historyStatus,
                    propertiesLimits: user.currentPackagePlan.propertiesLimits || [],
                    transferredProperties: transferredProperties,
                    upgradedAt: new Date(),
                    renewedAt: isOldPackageRenewal ? new Date() : undefined
                };

                // Khởi tạo packageHistory nếu chưa có
                if (!user.packageHistory) {
                    user.packageHistory = [];
                }

                user.packageHistory.push(historyEntry);
                console.log(`Added package to history with status: ${historyStatus}, ${transferredProperties.length} properties transferred to ${packagePlan.displayName}`);
            }

            // 2. CẬP NHẬT GÓI MỚI VÀO CURRENTPACKAGEPLAN
            // Luôn tạo instance ID mới cho mỗi lần mua/gia hạn để phân biệt các giai đoạn
            const newPackageInstanceId = new mongoose.Types.ObjectId();
            
            user.currentPackagePlan = {
                packagePlanId: packagePlan._id,
                packageInstanceId: newPackageInstanceId, // Instance ID mới cho giai đoạn mới của gói
                packageName: packagePlan.name,
                displayName: packagePlan.displayName,
                priority: packagePlan.priority,
                color: packagePlan.color,
                stars: packagePlan.stars,
                freePushCount: packagePlan.freePushCount,
                usedPushCount: 0,
                purchaseDate: startDate,
                expiryDate: expiryDate,
                isActive: true,
                propertiesLimits: packagePlan.propertiesLimits.map(limit => ({
                    packageType: limit.packageType,
                    limit: limit.limit,
                    used: 0
                }))
            };

            // 3. CẬP NHẬT PACKAGETYPE
            user.packageType = packagePlan.type || 'basic';

            await user.save();

            // 4. XỬ LÝ MIGRATION DATA NẾU CÓ
            if (migrationData && migrationData.selectedProperties && migrationData.selectedProperties.length > 0) {
                console.log('Processing migration for', migrationData.selectedProperties.length, 'properties...');

                // Update selected properties with new package info
                for (const migrationProperty of migrationData.selectedProperties) {
                    try {
                        const property = await Property.findById(migrationProperty.propertyId);
                        if (property && property.owner.toString() === user._id.toString()) {
                            // Update property's package info to new package
                            property.packageInfo = {
                                ...property.packageInfo,
                                plan: packagePlan._id,
                                packageId: packagePlan._id,
                                packageInstanceId: newPackageInstanceId, // Thêm packageInstanceId cho property
                                purchaseDate: startDate,
                                expiryDate: expiryDate,
                                isActive: true,
                                status: 'active',
                                // Keep the same post type if specified, otherwise use default
                                postType: migrationProperty.newPostType || migrationProperty.currentPostType,
                                updatedAt: new Date()
                            };

                            await property.save();
                            console.log(`Migrated property ${property._id} to new package`);
                        }
                    } catch (error) {
                        console.error(`Error migrating property ${migrationProperty.propertyId}:`, error);
                    }
                }

                // Update package limits based on migrated properties
                if (migrationData.limitsUsage) {
                    for (const [postTypeId, usage] of Object.entries(migrationData.limitsUsage)) {
                        const limitIndex = user.currentPackagePlan.propertiesLimits.findIndex(
                            limit => limit.packageType.toString() === postTypeId
                        );

                        if (limitIndex !== -1) {
                            user.currentPackagePlan.propertiesLimits[limitIndex].used = usage.count;
                            console.log(`Updated limit for ${usage.postTypeName}: used ${usage.count}/${usage.limit}`);
                        }
                    }

                    await user.save();
                }

                console.log('Migration completed successfully');
            }

            // 5. CẬP NHẬT PACKAGEINFO CỦA CÁC TIN ĐĂNG ĐANG CHẠY (GIỮ NGUYÊN GÓI CŨ ĐẾN HẾT HẠN)
            await updateActivePropertiesPackageInfo(user._id);

            // 6. TÁI KÍCH HOẠT CÁC TIN ĐĂNG ĐÃ HẾT HẠN GÓI
            let reactivationResult;
            if (isOldPackageRenewal) {
                // Nếu là renewal gói cũ, tìm instance ID gần nhất của gói này từ history
                const previousPackageInstance = user.packageHistory
                    ?.filter(h => h.packagePlanId.toString() === packagePlan._id.toString())
                    ?.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))[0];
                
                console.log('Old package renewal detected. Previous instance:', previousPackageInstance?.packageInstanceId);
                
                reactivationResult = await reactivateUserProperties(user._id, {
                    packagePlanId: packagePlan._id,
                    packageInstanceId: newPackageInstanceId, // ID instance mới cho giai đoạn mới
                    previousInstanceId: previousPackageInstance?.packageInstanceId, // Instance ID cũ của giai đoạn gần nhất
                    purchaseDate: startDate,
                    expiryDate: expiryDate
                }, true); // isRenewal = true cho renewal gói cũ
            } else {
                // Upgrade thông thường - chỉ reactivate tin được chọn migrate
                reactivationResult = await reactivateUserProperties(user._id, {
                    packagePlanId: packagePlan._id,
                    packageInstanceId: newPackageInstanceId, // ID instance mới
                    purchaseDate: startDate,
                    expiryDate: expiryDate
                }, false, migrationData); // isRenewal = false (upgrade), truyền migrationData
            }

            if (reactivationResult.success && reactivationResult.reactivatedCount > 0) {
                const mode = isOldPackageRenewal ? 'Old package renewal' : 'Upgrade';
                console.log(`${mode}: Reactivated ${reactivationResult.reactivatedCount} properties for user ${user._id}`);
            } else {
                const mode = isOldPackageRenewal ? 'Old package renewal' : 'Upgrade';
                console.log(`${mode}: No properties reactivated as expected`);
            }

            console.log('User package updated successfully:', user._id, 'with package:', packagePlan.displayName);
            console.log('Package history entries:', user.packageHistory.length);

        } else {
            console.error('No PackagePlan ID found in order:', order._id);
            return;
        }

    } catch (error) {
        console.error('Error updating user package:', error);
    }
};

// Hàm xử lý kích hoạt lại gói sau khi thanh toán gia hạn thành công
const reactivateExpiredPackage = async (order) => {
    try {
        console.log('Reactivating expired package for order:', order._id);

        const user = await User.findById(order.userId);
        if (!user) {
            console.error('User not found:', order.userId);
            return;
        }

        const packagePlan = await PackagePlan.findById(order.packagePlanId);
        if (!packagePlan) {
            console.error('PackagePlan not found:', order.packagePlanId);
            return;
        }

        const startDate = new Date();
        let expiryDate = new Date(startDate);

        // Tính ngày hết hạn dựa trên duration và durationUnit từ order
        const duration = order.packageInfo?.duration || packagePlan.durationDays;
        const durationUnit = order.packageInfo?.durationUnit || 'day';

        console.log('Reactivating package:', packagePlan.displayName, 'for duration:', duration, durationUnit);

        // Tính ngày hết hạn theo đơn vị thời gian
        switch (durationUnit) {
            case 'month':
                expiryDate.setMonth(startDate.getMonth() + parseInt(duration));
                break;
            case 'year':
                expiryDate.setFullYear(startDate.getFullYear() + parseInt(duration));
                break;
            case 'day':
            default:
                expiryDate.setDate(startDate.getDate() + parseInt(duration));
                break;
        }

        // Lấy backup used count từ gói cũ nếu có (để khôi phục khi gia hạn cùng gói)
        const oldPackage = user.currentPackagePlan;
        const isRenewal = oldPackage && oldPackage.packagePlanId.toString() === packagePlan._id.toString();

        // 1. DI CHUYỂN GÓI HIỆN TẠI VÀO LỊCH SỬ VỚI STATUS 'RENEWED'
        if (oldPackage && oldPackage.packagePlanId) {
            console.log('Moving current package to history with renewed status:', oldPackage.displayName);

            const historyEntry = {
                packagePlanId: oldPackage.packagePlanId,
                packageInstanceId: oldPackage.packageInstanceId, // Lưu instance ID cũ của giai đoạn hiện tại
                packageName: oldPackage.packageName,
                displayName: oldPackage.displayName,
                priority: oldPackage.priority,
                color: oldPackage.color,
                stars: oldPackage.stars,
                freePushCount: oldPackage.freePushCount,
                usedPushCount: oldPackage.usedPushCount || 0,
                purchaseDate: oldPackage.purchaseDate,
                expiryDate: oldPackage.expiryDate,
                status: 'renewed',
                propertiesLimits: oldPackage.propertiesLimits || [],
                renewedAt: new Date()
            };

            // Khởi tạo packageHistory nếu chưa có
            if (!user.packageHistory) {
                user.packageHistory = [];
            }

            user.packageHistory.push(historyEntry);
            console.log('Added package to history with renewed status');
        }

        // 2. CẬP NHẬT GÓI HIỆN TẠI MỚI
        const previousInstanceId = oldPackage?.packageInstanceId; // Lưu instance ID cũ để reactivate
        const newPackageInstanceId = new mongoose.Types.ObjectId(); // Tạo instance ID mới
        
        user.currentPackagePlan = {
            packagePlanId: packagePlan._id,
            packageInstanceId: newPackageInstanceId, // Instance ID mới cho gói gia hạn
            packageName: packagePlan.name,
            displayName: packagePlan.displayName,
            priority: packagePlan.priority,
            color: packagePlan.color,
            stars: packagePlan.stars,
            freePushCount: packagePlan.freePushCount || 0,
            usedPushCount: 0, // Reset về 0 cho gói mới
            purchaseDate: startDate,
            expiryDate: expiryDate,
            isActive: true,
            status: 'active',
            propertiesLimits: packagePlan.propertiesLimits.map(limit => {
                let restoredUsedCount = 0;
                
                // Nếu là gia hạn cùng gói, khôi phục used count từ backup
                if (isRenewal && oldPackage.propertiesLimits) {
                    const oldLimit = oldPackage.propertiesLimits.find(
                        ol => ol.packageType.toString() === limit.packageType.toString()
                    );
                    if (oldLimit && oldLimit.backupUsedCount !== undefined) {
                        restoredUsedCount = oldLimit.backupUsedCount;
                        console.log(`Khôi phục used count cho packageType ${limit.packageType}: ${restoredUsedCount}`);
                    }
                }
                
                return {
                    packageType: limit.packageType,
                    limit: limit.limit,
                    used: restoredUsedCount,
                    backupUsedCount: 0 // Reset backup
                };
            })
        };

        await user.save();

        // Tái kích hoạt các tin đăng đã hết hạn (chỉ với renewal - cùng gói)
        const reactivationResult = await reactivateUserProperties(user._id, {
            packagePlanId: packagePlan._id,
            packageInstanceId: newPackageInstanceId, // Instance ID mới
            previousInstanceId: previousInstanceId, // Instance ID cũ để tìm tin cần reactivate
            purchaseDate: startDate,
            expiryDate: expiryDate
        }, true); // isRenewal = true, không có migrationData

        if (reactivationResult.success && reactivationResult.reactivatedCount > 0) {
            console.log(`Successfully reactivated ${reactivationResult.reactivatedCount} properties for user ${user._id}`);
        }

        console.log('Package renewal completed successfully for user:', user._id, 'with package:', packagePlan.displayName);

    } catch (error) {
        console.error('Error reactivating expired package:', error);
    }
};

class PaymentController {
    // Tạo đơn hàng thanh toán với PackagePlan - upgrade cho toàn bộ tài khoản
    async createPaymentOrder(req, res) {

        try {
            const { packagePlanId, duration, durationUnit, totalAmount, migration } = req.body;
            const userId = req.user.userId;
            console.log('Create Payment Order request:', req.body, 'by user:', userId);

            // Log migration data if provided
            if (migration) {
                console.log('Migration data received:', migration);
            }

            // Validate input
            if (!packagePlanId || !totalAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc (packagePlanId, totalAmount)'
                });
            }

            // Kiểm tra package plan tồn tại
            const packagePlan = await PackagePlan.findById(packagePlanId);
            if (!packagePlan || !packagePlan.isActive) {
                return res.status(404).json({
                    success: false,
                    message: 'Gói tin đăng không tồn tại'
                });
            }

            // Tạo order mới với PackagePlan cho toàn bộ tài khoản
            const order = new Order({
                total: totalAmount, // Sử dụng totalAmount từ frontend (đã bao gồm VAT)
                payment_status: 'Unpaid',
                name: `Nâng cấp gói ${packagePlan.displayName} cho tài khoản`,
                userId: userId,
                packagePlanId: packagePlan._id,
                packageInfo: {
                    name: packagePlan.displayName,
                    duration: duration || packagePlan.durationDays,
                    durationUnit: durationUnit || 'day'
                },
                // Add migration data if provided
                migration: migration || null
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
                    amount: totalAmount, // Trả về số tiền có VAT
                    qrCode: sepayData.qrCode,
                    qrContent: sepayData.qrContent,
                    transferContent: sepayData.transferContent,
                    bankInfo: sepayData.bankInfo,
                    packageInfo: {
                        name: packagePlan.displayName,
                        durationDays: duration || packagePlan.durationDays,
                        features: packagePlan.features,
                        freePushCount: packagePlan.freePushCount
                    }
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
                console.log('Order renewed:', order);

                // Kiểm tra xem có phải là renewal order không
                if (order.packageInfo?.isRenewal) {
                    console.log('Processing renewal payment for order:', order._id);
                    // Xử lý kích hoạt lại gói đã hết hạn
                    await reactivateExpiredPackage(order);
                } else {
                    console.log('Processing regular upgrade payment for order:', order._id);
                    // Xử lý upgrade thông thường
                    await updateUserPackage(order, order.migration);
                }

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

    // Lấy lịch sử gói của user
    async getUserPackageHistory(req, res) {
        try {
            const userId = req.user.userId;

            const packageData = await getUserPackageHistory(userId);
            if (!packageData) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông tin user'
                });
            }


            res.json({
                success: true,
                message: 'Lấy lịch sử gói thành công',
                data: {
                    currentPackage: packageData.currentPackage,
                    packageHistory: packageData.packageHistory,
                    totalPackagesUsed: packageData.packageHistory.length + (packageData.currentPackage ? 1 : 0)
                }
            });

        } catch (error) {
            console.error('Error getting user package history:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // Tạo đơn hàng thanh toán cho gia hạn gói (renewal)
    async createRenewalPaymentOrder(req, res) {
        try {
            const { packagePlanId, expiredPackageId, duration, durationUnit, totalAmount, packageName, isRenewal } = req.body;
            const userId = req.user.userId;
            console.log('Create Renewal Payment Order request:', req.body, 'by user:', userId);

            // Validate input
            if (!packagePlanId || !totalAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc (packagePlanId, totalAmount)'
                });
            }

            // Kiểm tra package plan tồn tại
            const packagePlan = await PackagePlan.findById(packagePlanId);
            if (!packagePlan || !packagePlan.isActive) {
                return res.status(404).json({
                    success: false,
                    message: 'Gói tin đăng không tồn tại'
                });
            }

            // Tạo order mới cho renewal
            const order = new Order({
                total: totalAmount,
                payment_status: 'Unpaid',
                name: `Gia hạn gói ${packageName || packagePlan.displayName}`,
                userId: userId,
                packagePlanId: packagePlan._id,
                packageInfo: {
                    name: packagePlan.displayName,
                    duration: duration || packagePlan.durationDays,
                    durationUnit: durationUnit || 'day',
                    isRenewal: isRenewal === true, // Đảm bảo chỉ lưu true khi có giá trị true từ request
                    expiredPackageId: expiredPackageId
                }
            });

            await order.save();

            // Generate SePay QR Code
            const sepayData = generateSepayQR(order);
            console.log('Generated SePay Data for renewal:', sepayData);

            res.status(201).json({
                success: true,
                message: 'Tạo đơn hàng gia hạn thành công',
                data: {
                    orderId: order._id,
                    qrCode: sepayData.qrCode,
                    qrContent: sepayData.qrContent,
                    transferContent: sepayData.transferContent,
                    bankInfo: sepayData.bankInfo,
                    orderInfo: {
                        orderId: order._id,
                        amount: order.total,
                        packageName: packagePlan.displayName,
                        duration: duration,
                        durationUnit: durationUnit,
                        packagePlanId: packagePlan._id,
                        isRenewal: true,
                        expiredPackageId: expiredPackageId
                    }
                }
            });

        } catch (error) {
            console.error('Error creating renewal payment order:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: error.message
            });
        }
    }

    // Lấy thông tin đơn hàng đã tồn tại
    async getOrderInfo(req, res) {
        try {
            const { orderId } = req.params;
            const userId = req.user.userId;

            console.log('Getting order info for orderId:', orderId, 'userId:', userId);

            // Tìm đơn hàng theo ID và userId để đảm bảo security
            const order = await Order.findOne({ 
                _id: orderId, 
                userId: userId 
            }).populate('packagePlanId');

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập'
                });
            }

            // Tạo thông tin QR và bank info
            const paymentInfo = generateSepayQR(order);

            // Chuẩn bị response data giống như khi tạo đơn mới
            const responseData = {
                orderId: order._id,
                orderCode: `TKPH13 DH${order._id.toString().slice(-6)}`,
                amount: parseFloat(order.total.toString()),
                status: order.payment_status,
                qrCode: paymentInfo.qrCode,
                transferContent: paymentInfo.transferContent,
                bankInfo: paymentInfo.bankInfo,
                expiryTime: order.expiryTime || new Date(Date.now() + 15 * 60 * 1000), // 15 phút từ bây giờ nếu không có
                packageInfo: {
                    name: order.name,
                    duration: order.packageInfo?.duration,
                    durationUnit: order.packageInfo?.durationUnit
                },
                createdAt: order.created_at,
                migration: order.migration
            };

            console.log('Order info retrieved successfully:', responseData);

            res.json({
                success: true,
                message: 'Lấy thông tin đơn hàng thành công',
                data: responseData
            });

        } catch (error) {
            console.error('Error getting order info:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin đơn hàng: ' + error.message
            });
        }
    }



}


// Hàm utility để lấy lịch sử gói của user
const getUserPackageHistory = async (userId) => {
    try {
        const user = await User.findById(userId)
            .populate({
                path: 'packageHistory.packagePlanId currentPackagePlan.packagePlanId',
                select: `
          name displayName priority color stars textStyle features 
          durationDays freePushCount isActive propertiesLimits
        `,
                populate: {
                    path: 'propertiesLimits.packageType',
                    select: 'name displayName color priority description stars'
                }
            })
            .populate({
                path: 'packageHistory.transferredProperties.propertyId',
                select: 'title images location _id'
            })
            .populate({
                path: 'packageHistory.transferredProperties.postType',
                select: 'name displayName color priority description stars'
            })
            .lean();

        if (!user) return null;

        // Helper: merge 'used' từ outer vào inner
        const mergeUsedIntoPlan = (historyItem) => {
            const outerLimits = historyItem.propertiesLimits || [];
            const innerLimits = historyItem.packagePlanId?.propertiesLimits || [];

            // Gộp used vào limit tương ứng
            const mergedLimits = innerLimits.map(inner => {
                const match = outerLimits.find(
                    o => o.packageType?.toString() === inner.packageType?._id?.toString()
                );
                return {
                    ...inner,
                    used: match?.used || 0
                };
            });

            // Sắp xếp theo priority (nếu có)
            mergedLimits.sort(
                (a, b) => (a.packageType?.priority || 999) - (b.packageType?.priority || 999)
            );

            // Trả về object clean nhất
            return {
                ...historyItem,
                packagePlanId: {
                    ...historyItem.packagePlanId,
                    propertiesLimits: mergedLimits
                }
            };
        };

        // Merge & sort cho packageHistory
        const packageHistory = (user.packageHistory || [])
            .map(mergeUsedIntoPlan)
            .sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

        // Sort cho current package (nếu có)
        const currentPackage = user.currentPackagePlan
            ? {
                ...user.currentPackagePlan,
                packagePlanId: {
                    ...user.currentPackagePlan.packagePlanId,
                    propertiesLimits: user.currentPackagePlan.packagePlanId?.propertiesLimits?.sort(
                        (a, b) => (a.packageType?.priority || 999) - (b.packageType?.priority || 999)
                    ) || []
                }
            }
            : null;

        // Kết quả cuối clean nhất
        return { currentPackage, packageHistory };

    } catch (error) {
        console.error('Error getting user package history:', error);
        return null;
    }
};


const paymentController = new PaymentController();

// Export các hàm utility
export {
    
    getUserPackageHistory,
    updateActivePropertiesPackageInfo,
    reactivateExpiredPackage
};

export default paymentController;