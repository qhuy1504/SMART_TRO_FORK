import commentRepository from '../repositories/commentRepository.js';
import Property from '../../../schemas/Property.js';

// Tạo comment mới
const createComment = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { content, rating, parentComment } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để bình luận'
      });
    }

    // Kiểm tra property tồn tại
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng'
      });
    }

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được vượt quá 1000 ký tự'
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }

    // Kiểm tra parent comment nếu có
    if (parentComment) {
      const parent = await commentRepository.getCommentById(parentComment);
      if (!parent || parent.property.toString() !== propertyId) {
        return res.status(400).json({
          success: false,
          message: 'Bình luận gốc không hợp lệ'
        });
      }
    }

    const commentData = {
      property: propertyId,
      user: userId,
      content: content.trim(),
      rating: rating || null,
      parentComment: parentComment || null
    };

    const newComment = await commentRepository.createComment(commentData);

    res.status(201).json({
      success: true,
      message: 'Tạo bình luận thành công',
      data: newComment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bình luận',
      error: error.message
    });
  }
};

// Lấy comments theo property
const getCommentsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const result = await commentRepository.getCommentsByProperty(propertyId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy bình luận',
      error: error.message
    });
  }
};

// Cập nhật comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, rating } = req.body;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    // Kiểm tra quyền sở hữu
    const isOwner = await commentRepository.checkCommentOwnership(commentId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể chỉnh sửa bình luận của mình'
      });
    }

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được để trống'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bình luận không được vượt quá 1000 ký tự'
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }

    const updateData = {
      content: content.trim()
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    const updatedComment = await commentRepository.updateComment(commentId, updateData);

    res.status(200).json({
      success: true,
      message: 'Cập nhật bình luận thành công',
      data: updatedComment
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật bình luận',
      error: error.message
    });
  }
};

// Xóa comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    // Kiểm tra quyền sở hữu
    const isOwner = await commentRepository.checkCommentOwnership(commentId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể xóa bình luận của mình'
      });
    }

    await commentRepository.deleteComment(commentId);

    res.status(200).json({
      success: true,
      message: 'Xóa bình luận thành công'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa bình luận',
      error: error.message
    });
  }
};

// Like/Unlike comment
const toggleLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để thích bình luận'
      });
    }

    const result = await commentRepository.toggleLike(commentId, userId);

    res.status(200).json({
      success: true,
      message: result.isLiked ? 'Đã thích bình luận' : 'Đã bỏ thích bình luận',
      data: result
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thích bình luận',
      error: error.message
    });
  }
};

// Lấy thống kê comments
const getCommentStats = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const stats = await commentRepository.getCommentStats(propertyId);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting comment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê bình luận',
      error: error.message
    });
  }
};

// Lấy bình luận gần đây của user
const getUserRecentComments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const comments = await commentRepository.getUserRecentComments(userId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Error getting user recent comments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy bình luận của người dùng',
      error: error.message
    });
  }
};

// Lấy số lượng comments của property
const getPropertyCommentsCount = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Kiểm tra property tồn tại
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin đăng'
      });
    }

    const count = await commentRepository.getPropertyCommentsCount(propertyId);

    res.json({
      success: true,
      data: {
        propertyId,
        commentsCount: count
      }
    });
  } catch (error) {
    console.error('Error getting property comments count:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy số lượng bình luận',
      error: error.message
    });
  }
};

export {
  createComment,
  getCommentsByProperty,
  updateComment,
  deleteComment,
  toggleLike,
  getCommentStats,
  getUserRecentComments,
  getPropertyCommentsCount
};
