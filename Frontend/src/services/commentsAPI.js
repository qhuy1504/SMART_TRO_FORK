import api from './api';

// API service cho quản lý bình luận
export const commentsAPI = {
  // Lấy bình luận theo property
  getCommentsByProperty: async (propertyId, options = {}) => {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const response = await api.get(`/comments/property/${propertyId}`, {
        params: { page, limit, sortBy, sortOrder }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy bình luận:', error);
      throw error;
    }
  },

  // Tạo bình luận mới
  createComment: async (propertyId, commentData) => {
    try {
      const response = await api.post(`/comments/property/${propertyId}`, commentData);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo bình luận:', error);
      throw error;
    }
  },

  // Cập nhật bình luận
  updateComment: async (commentId, updateData) => {
    try {
      const response = await api.put(`/comments/${commentId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật bình luận:', error);
      throw error;
    }
  },

  // Xóa bình luận
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa bình luận:', error);
      throw error;
    }
  },

  // Like/Unlike bình luận
  toggleLike: async (commentId) => {
    try {
      const response = await api.post(`/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi thích bình luận:', error);
      throw error;
    }
  },

  // Lấy số lượng comments của property
  getPropertyCommentsCount: async (propertyId) => {
    try {
      const response = await api.get(`/comments/property/${propertyId}/count`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy số lượng bình luận:', error);
      throw error;
    }
  },

  // Lấy thống kê bình luận
  getCommentStats: async (propertyId) => {
    try {
      const response = await api.get(`/comments/property/${propertyId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê bình luận:', error);
      throw error;
    }
  },

  // Lấy bình luận gần đây của user
  getUserRecentComments: async (limit = 5) => {
    try {
      const response = await api.get('/comments/user/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy bình luận gần đây:', error);
      throw error;
    }
  }
};

export default commentsAPI;
