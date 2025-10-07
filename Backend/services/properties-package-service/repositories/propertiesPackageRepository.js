import PropertiesPackage from '../../../schemas/PropertiesPackage.js';

class PropertiesPackageRepository {
  
  // Lấy tất cả gói tin đăng (bao gồm cả active và inactive để admin quản lý)
  async getAllPackages() {
    try {
      return await PropertiesPackage.find({})
        .sort({ priority: 1, isActive: -1 });
    } catch (error) {
      throw new Error(`Error getting packages: ${error.message}`);
    }
  }
  
  // Lấy gói theo ID
  async getPackageById(id) {
    try {
      return await PropertiesPackage.findById(id);
    } catch (error) {
      throw new Error(`Error getting package by ID: ${error.message}`);
    }
  }
  
  // Lấy gói theo name
  async getPackageByName(name) {
    try {
      return await PropertiesPackage.findOne({ name, isActive: true });
    } catch (error) {
      throw new Error(`Error getting package by name: ${error.message}`);
    }
  }
  
  // Tạo gói mới
  async createPackage(packageData) {
    try {
      const newPackage = new PropertiesPackage(packageData);
      return await newPackage.save();
    } catch (error) {
      throw new Error(`Error creating package: ${error.message}`);
    }
  }
  
  // Cập nhật gói
  async updatePackage(id, updateData) {
    try {
      return await PropertiesPackage.findByIdAndUpdate(
        id,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Error updating package: ${error.message}`);
    }
  }
  
  // Xóa gói (soft delete)
  async deletePackage(id) {
    try {
      return await PropertiesPackage.findByIdAndUpdate(
        id,
        { isActive: false, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error deleting package: ${error.message}`);
    }
  }
  
  // Tính giá dựa trên gói và thời gian
  calculatePrice(packageData, duration, durationType) {
    const { dailyPrice, weeklyDiscount, monthlyDiscount } = packageData;
    let totalPrice = 0;
    
    switch (durationType) {
      case 'daily':
        totalPrice = dailyPrice * duration;
        break;
      case 'weekly':
        const weeklyPrice = dailyPrice * 7 * (1 - weeklyDiscount / 100);
        totalPrice = weeklyPrice * duration;
        break;
      case 'monthly':
        // Tính số ngày thực tế cho từng tháng
        let totalDaysInMonths = 0;
        const currentDate = new Date();
        
        for (let i = 0; i < duration; i++) {
          const targetMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 0);
          totalDaysInMonths += targetMonth.getDate();
        }
        
        const monthlyPrice = dailyPrice * totalDaysInMonths * (1 - monthlyDiscount / 100);
        totalPrice = monthlyPrice;
        console.log(`Calculated monthly price for ${duration} month(s) (${totalDaysInMonths} days): ${totalPrice}`);
        break;
      default:
        totalPrice = dailyPrice * duration;
    }
    
    return Math.round(totalPrice);
  }
  
  // Khởi tạo dữ liệu mẫu
  async initializeDefaultPackages() {
    try {
      // Remove automatic check - controller will handle this
      
      const defaultPackages = [
        {
          name: 'tin_vip_dac_biet',
          displayName: 'TIN VIP ĐẶC BIỆT',
          description: 'Tin đăng đặc biệt với ưu tiên cao nhất và nhiều tính năng độc quyền',
          dailyPrice: 100000,
          freePushCount: 10,
          priority: 1,
          color: '#8b0000', // Dark Red
          textStyle: 'uppercase',
          stars: 5,
          features: [
            'Hiển thị ở vị trí đầu tiên',
            'Màu đỏ đậm đặc biệt',
            '5 sao vàng',
            '10 lượt đẩy tin miễn phí',
            'Ưu tiên cao nhất trên tất cả gói'
          ]
        },
        {
          name: 'tin_vip_noi_bat',
          displayName: 'TIN VIP NỔI BẬT',
          description: 'Tin đăng luôn hiển thị ở đầu trang với màu đỏ và 5 sao',
          dailyPrice: 50000,
          freePushCount: 5,
          priority: 1,
          color: '#dc3545', // Red
          textStyle: 'uppercase',
          stars: 5,
          features: [
            'Hiển thị ở đầu trang',
            'Màu đỏ nổi bật',
            '5 sao vàng',
            '5 lượt đẩy tin miễn phí',
            'Nằm trên tất cả các tin khác'
          ]
        },
        {
          name: 'tin_vip_1',
          displayName: 'TIN VIP 1',
          description: 'Tin đăng VIP cao cấp với màu hồng và 4 sao',
          dailyPrice: 30000,
          freePushCount: 3,
          priority: 2,
          color: '#e83e8c', // Pink
          textStyle: 'uppercase',
          stars: 4,
          features: [
            'Màu hồng nổi bật',
            '4 sao vàng',
            '3 lượt đẩy tin miễn phí',
            'Ưu tiên cao',
            'Hiển thị sau tin VIP Nổi Bật và trên các tin khác.'
          ]
        },
        {
          name: 'tin_vip_2',
          displayName: 'TIN VIP 2',
          description: 'Tin đăng VIP trung cấp với màu cam',
          dailyPrice: 20000,
          freePushCount: 2,
          priority: 3,
          color: '#fd7e14', // Orange
          textStyle: 'uppercase',
          stars: 3,
          features: [
            'Màu cam nổi bật',
            '3 sao vàng',
            '2 lượt đẩy tin miễn phí',
            'Ưu tiên trung bình',
            'Hiển thị sau tin VIP Nổi Bật, Tin VIP 1 và trên các tin khác.'
          ]
        },
        {
          name: 'tin_vip_3',
          displayName: 'TIN VIP 3',
          description: 'Tin đăng VIP cơ bản với màu xanh và 2 sao',
          dailyPrice: 10000,
          freePushCount: 1,
          priority: 4,
          color: '#20c997', // Teal
          textStyle: 'uppercase',
          stars: 2,
          features: [
            'Màu xanh nổi bật',
            '2 sao vàng',
            '1 lượt đẩy tin miễn phí',
            'Ưu tiên cơ bản',
            'Hiển thị sau tin VIP Nổi Bật, Tin VIP 1, Tin VIP 2 và trên các tin khác.'
          ]
        },
        {
          name: 'tin_thuong',
          displayName: 'TIN THƯỜNG',
          description: 'Tin đăng thường với giá cả phải chăng',
          dailyPrice: 5000,
          freePushCount: 0,
          priority: 5,
          color: '#6c757d', // Gray
          textStyle: 'normal',
          stars: 0,
          features: [
            'Giá cả phải chăng',
            'Phù hợp người mới',
            'Không có lượt đẩy tin miễn phí',
            'Hiển thị sau các tin VIP.'
          ]
        }
      ];
      
      await PropertiesPackage.insertMany(defaultPackages);
      console.log('Default property packages initialized successfully');
    } catch (error) {
      console.error('Error initializing default packages:', error);
      throw error;
    }
  }
}

export default new PropertiesPackageRepository();
