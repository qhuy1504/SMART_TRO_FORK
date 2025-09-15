import Comment from '../../../schemas/Comment.js';

class CommentRepository {
  // Tạo comment mới
  async createComment(commentData) {
    try {
      const comment = new Comment(commentData);
      await comment.save();
      
      // Populate user info
      await comment.populate('user', 'fullName email avatar');
      return comment;
    } catch (error) {
      throw error;
    }
  }

  // Lấy comments theo property với phân trang
  async getCommentsByProperty(propertyId, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      const skip = (page - 1) * limit;

      // Chỉ lấy comment gốc (không phải reply)
      const comments = await Comment
        .find({ 
          property: propertyId, 
          parentComment: null,
          isDeleted: false 
        })
        .populate('user', 'fullName email avatar')
        .populate({
          path: 'replies',
          match: { isDeleted: false },
          populate: {
            path: 'user',
            select: 'fullName email avatar'
          },
          options: { sort: { createdAt: 1 } }
        })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Comment.countDocuments({ 
        property: propertyId, 
        parentComment: null,
        isDeleted: false 
      });

      return {
        comments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy comment theo ID
  async getCommentById(commentId) {
    try {
      return await Comment
        .findById(commentId)
        .populate('user', 'fullName email avatar')
        .populate({
          path: 'replies',
          match: { isDeleted: false },
          populate: {
            path: 'user',
            select: 'fullName email avatar'
          }
        });
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật comment
  async updateComment(commentId, updateData) {
    try {
      const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
          ...updateData,
          isEdited: true,
          editedAt: new Date()
        },
        { new: true }
      ).populate('user', 'fullName email avatar');

      return comment;
    } catch (error) {
      throw error;
    }
  }

  // Xóa comment (soft delete)
  async deleteComment(commentId) {
    try {
      const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          content: '[Bình luận đã bị xóa]'
        },
        { new: true }
      );

      return comment;
    } catch (error) {
      throw error;
    }
  }

  // Like/Unlike comment
  async toggleLike(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      const existingLike = comment.likes.find(like => 
        like.user.toString() === userId.toString()
      );

      if (existingLike) {
        // Unlike
        comment.likes = comment.likes.filter(like => 
          like.user.toString() !== userId.toString()
        );
        comment.likesCount = Math.max(0, comment.likesCount - 1);
      } else {
        // Like
        comment.likes.push({ user: userId });
        comment.likesCount += 1;
      }

      await comment.save();
      
      return {
        isLiked: !existingLike,
        likesCount: comment.likesCount
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê comment cho property
  async getCommentStats(propertyId) {
    try {
      const stats = await Comment.aggregate([
        {
          $match: { 
            property: propertyId, 
            isDeleted: false 
          }
        },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            totalRatings: { $sum: { $cond: [{ $ne: ['$rating', null] }, 1, 0] } },
            averageRating: { $avg: '$rating' },
            ratingsBreakdown: {
              $push: {
                $cond: [{ $ne: ['$rating', null] }, '$rating', null]
              }
            }
          }
        }
      ]);

      if (stats.length === 0) {
        return {
          totalComments: 0,
          totalRatings: 0,
          averageRating: 0,
          ratingsBreakdown: {}
        };
      }

      const result = stats[0];
      
      // Tính breakdown ratings
      const ratingsBreakdown = {};
      for (let i = 1; i <= 5; i++) {
        ratingsBreakdown[i] = result.ratingsBreakdown.filter(rating => rating === i).length;
      }

      return {
        totalComments: result.totalComments,
        totalRatings: result.totalRatings,
        averageRating: result.averageRating ? Math.round(result.averageRating * 10) / 10 : 0,
        ratingsBreakdown
      };
    } catch (error) {
      throw error;
    }
  }

  // Đếm tổng số comments gốc của một property (không bao gồm replies)
  async getPropertyCommentsCount(propertyId) {
    try {
      const count = await Comment.countDocuments({ 
        property: propertyId, 
        parentComment: null, // Chỉ đếm comments gốc
        isDeleted: false 
      });
      return count;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra quyền sở hữu comment
  async checkCommentOwnership(commentId, userId) {
    try {
      const comment = await Comment.findById(commentId);
      return comment && comment.user.toString() === userId.toString();
    } catch (error) {
      throw error;
    }
  }

  // Lấy recent comments của user
  async getUserRecentComments(userId, limit = 5) {
    try {
      return await Comment
        .find({ 
          user: userId, 
          isDeleted: false 
        })
        .populate('property', 'title images')
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      throw error;
    }
  }
}

export default new CommentRepository();
