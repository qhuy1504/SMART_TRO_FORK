import propertiesPackageRepository from '../repositories/propertiesPackageRepository.js';
import { validationResult } from 'express-validator';

const propertiesPackageController = {
  
  // Lấy tất cả gói tin đăng
  getAllPackages: async (req, res) => {
    try {
      const packages = await propertiesPackageRepository.getAllPackages();
      
      res.json({
        success: true,
        data: packages
      });
    } catch (error) {
      console.error('Error getting packages:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách gói tin đăng',
        error: error.message
      });
    }
  },
  
  // Lấy gói tin đăng theo ID
  getPackageById: async (req, res) => {
    try {
      const { id } = req.params;

      const packageData = await propertiesPackageRepository.getPackageById(id);

      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tin đăng'
        });
      }
      
      res.json({
        success: true,
        data: packageData
      });
    } catch (error) {
      console.error('Error getting package by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin gói tin đăng',
        error: error.message
      });
    }
  },
  
  // Tạo gói tin đăng mới (Admin only)
  createPackage: async (req, res) => {
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }
      
      const packageData = req.body;
      const newPackage = await propertiesPackageRepository.createPackage(packageData);

      res.status(201).json({
        success: true,
        message: 'Tạo gói tin đăng thành công',
        data: newPackage
      });
    } catch (error) {
      console.error('Error creating package:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tạo gói tin đăng',
        error: error.message
      });
    }
  },
  
  // Cập nhật gói tin đăng (Admin only)
  updatePackage: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log('Update package request:');
      console.log('ID:', id);
      console.log('Update data:', updateData);
      
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }
      
      const updatedPackage = await propertiesPackageRepository.updatePackage(id, updateData);
      console.log('Updated package:', updatedPackage);
      
      if (!updatedPackage) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tin đăng'
        });
      }
      
      res.json({
        success: true,
        message: 'Cập nhật gói tin đăng thành công',
        data: updatedPackage
      });
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi cập nhật gói tin đăng',
        error: error.message
      });
    }
  },
  
  // Xóa gói tin đăng (Admin only)
  deletePackage: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedPackage = await propertiesPackageRepository.deletePackage(id);

      if (!deletedPackage) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tin đăng'
        });
      }
      
      res.json({
        success: true,
        message: 'Xóa gói tin đăng thành công'
      });
    } catch (error) {
      console.error('Error deleting package:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi xóa gói tin đăng',
        error: error.message
      });
    }
  },
  
  // Tính giá gói tin đăng
  calculatePackagePrice: async (req, res) => {
    
    try {
      const { packageId, packageName, duration, durationType, addFastRent } = req.body;
      console.log('Request body for price calculation:', req.body);
      
      // Ưu tiên sử dụng packageId, fallback về packageName để backward compatibility
      if ((!packageId && !packageName) || !duration || !durationType) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin tính giá'
        });
      }
      
      let packageData;
      if (packageId) {
        packageData = await propertiesPackageRepository.getPackageById(packageId);
        console.log('Package data found by ID:', packageData);
      } else {
        packageData = await propertiesPackageRepository.getPackageByName(packageName);
        console.log('Package data found by name:', packageData);
      }
      
      if (!packageData) {
        console.log('Package not found for:', packageId ? `ID: ${packageId}` : `name: ${packageName}`);
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy gói tin đăng'
        });
      }
      
      // Tính giá cơ bản
      let totalPrice = propertiesPackageRepository.calculatePrice(packageData, duration, durationType);

      // Thêm phí cho thuê nhanh nếu có
      if (addFastRent) {
        totalPrice += 2000 * duration; // 2000₫/ngày
      }
      
      // Tính thuế VAT 8%
      const vatAmount = Math.round(totalPrice * 0.08);
      const finalPrice = totalPrice + vatAmount;
      
      // Tính ngày hết hạn
      const currentDate = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(currentDate.getDate() + duration);
      
      // Lấy giờ hiện tại và format thành HH:MM
      const currentTime = new Date();
      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      const expiryTime = `${hours}:${minutes}`;
      
      res.json({
        success: true,
        data: {
          packageInfo: {
            name: packageData.displayName,
            color: packageData.color,
            stars: packageData.stars
          },
          pricing: {
            basePrice: totalPrice - (addFastRent ? 2000 * duration : 0),
            fastRentFee: addFastRent ? 2000 * duration : 0,
            subtotal: totalPrice,
            vatAmount: vatAmount,
            totalPrice: finalPrice,
            duration: duration,
            durationType: durationType
          },
          timeline: {
            startDate: currentDate,
            expiryDate: expiryDate,
            expiryTime: expiryTime
          }
        }
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tính giá',
        error: error.message
      });
    }
  },
  
  // Khởi tạo dữ liệu mẫu
  initializePackages: async (req, res) => {
    try {
      // Kiểm tra xem đã có packages chưa
      const existingPackages = await propertiesPackageRepository.getAllPackages();
      
      if (existingPackages && existingPackages.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Đã có gói tin đăng trong hệ thống. Vui lòng xóa hết tất cả gói tin để thực hiện chức năng này.',
          count: existingPackages.length
        });
      }

      await propertiesPackageRepository.initializeDefaultPackages();

      res.json({
        success: true,
        message: 'Khởi tạo dữ liệu gói tin đăng mặc định thành công'
      });
    } catch (error) {
      console.error('Error initializing packages:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi khởi tạo dữ liệu',
        error: error.message
      });
    }
  }
};

export default propertiesPackageController;