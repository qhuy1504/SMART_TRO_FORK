import api from './api';

export const propertyDetailAPI = {
  // Lấy chi tiết property theo ID
  getPropertyDetail: async (propertyId) => {
    try {
      const response = await api.get(`/my-properties/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching property detail:', error);
      throw error;
    }
  },

  // Lấy danh sách property liên quan
  getRelatedProperties: async (propertyId, limit = 6) => {
    try {
      const response = await api.get(`/my-properties/${propertyId}/related`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching related properties:', error);
      throw error;
    }
  },

  // Lấy danh sách property nổi bật
  getFeaturedProperties: async (limit = 5) => {
    try {
      const response = await api.get('/my-properties/featured', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching featured properties:', error);
      throw error;
    }
  },

  // Thêm property vào yêu thích
  addToFavorites: async (propertyId) => {
    try {
      const response = await api.post('/my-properties/favorites', { propertyId });
      return response.data;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  // Xóa property khỏi yêu thích
  removeFromFavorites: async (propertyId) => {
    try {
      const response = await api.delete(`/my-properties/favorites/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  // Kiểm tra trạng thái yêu thích
  checkFavoriteStatus: async (propertyId) => {
    try {
      const response = await api.get(`/my-properties/favorites/${propertyId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      // If not authenticated or error, assume not favorited
      return { isFavorited: false };
    }
  },

  // Ghi nhận lượt xem
  recordPropertyView: async (propertyId) => {
    try {
      const response = await api.post(`/my-properties/${propertyId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error recording property view:', error);
      // Silently fail for view tracking
      return null;
    }
  },

  // Báo cáo property
  reportProperty: async (propertyId, reason, description) => {
    try {
      const response = await api.post(`/my-properties/${propertyId}/report`, {
        reason,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting property:', error);
      throw error;
    }
  },

  // Chia sẻ property (để thống kê)
  shareProperty: async (propertyId, platform) => {
    try {
      const response = await api.post(`/my-properties/${propertyId}/share`, {
        platform
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing property:', error);
      // Silently fail for share tracking
      return null;
    }
  },

  // Lấy thông tin liên hệ chủ nhà
  getPropertyOwnerContact: async (propertyId) => {
    try {
      const response = await api.get(`/my-properties/${propertyId}/contact`);
      return response.data;
    } catch (error) {
      console.error('Error fetching owner contact:', error);
      throw error;
    }
  },

  // Gửi yêu cầu liên hệ
  submitPropertyInquiry: async (propertyId, inquiryData) => {
    try {
      const response = await api.post(`/my-properties/${propertyId}/inquiry`, inquiryData);
      return response.data;
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      throw error;
    }
  },

  // Lấy lịch trống để xem phòng
  getVisitAvailability: async (propertyId) => {
    try {
      const response = await api.get(`/my-properties/${propertyId}/visit/availability`);
      return response.data;
    } catch (error) {
      console.error('Error fetching visit availability:', error);
      throw error;
    }
  },

  // Đặt lịch xem phòng
  schedulePropertyVisit: async (propertyId, visitData) => {
    try {
      const response = await api.post(`/my-properties/${propertyId}/visit/schedule`, visitData);
      return response.data;
    } catch (error) {
      console.error('Error scheduling visit:', error);
      throw error;
    }
  }
};
