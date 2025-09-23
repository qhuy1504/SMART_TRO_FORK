import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { commentsAPI } from '../../services/commentsAPI';
import { CommentForm, CommentItem, StarRating } from '../common/CommentItem';
import {
    FaStar,
    FaComments,
    FaSpinner,
    FaChevronDown,
    FaFilter
} from 'react-icons/fa';
import './Comments.css';

const Comments = ({ propertyId, propertyOwnerId }) => {
    const [comments, setComments] = useState([]);
    const [stats, setStats] = useState({
        totalComments: 0,
        totalRatings: 0,
        averageRating: 0,
        ratingsBreakdown: {}
    });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        total: 1,
        totalRecords: 0,
        limit: 10
    });
    const [sortBy, setSortBy] = useState('rating'); // Default sort by rating
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);
    const [displayLimit] = useState(3); // Show only 3 comments initially

    useEffect(() => {
        if (propertyId) {
            loadComments(true);
            loadStats();
        }
    }, [propertyId, sortBy, sortOrder]);

    const loadComments = async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            const page = reset ? 1 : pagination.current + 1;

            const response = await commentsAPI.getCommentsByProperty(propertyId, {
                page,
                limit: pagination.limit,
                sortBy,
                sortOrder
            });

            if (response.success) {
                if (reset) {
                    setComments(response.data.comments);
                } else {
                    setComments(prev => [...prev, ...response.data.comments]);
                }
                setPagination(response.data.pagination);
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi tải bình luận');
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await commentsAPI.getCommentStats(propertyId);
            
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error loading comment stats:', error);
        }
    };

    // Helper function to count only parent comments (không đếm replies)
    const getTotalCommentsCount = () => {
        return comments.length;
    };

    const handleCommentAdded = (newComment) => {
        setComments(prev => [newComment, ...prev]);
        loadStats(); // Reload stats để cập nhật số lượng
        setPagination(prev => ({
            ...prev,
            totalRecords: prev.totalRecords + 1
        }));
    };

    const handleCommentUpdated = (updatedComment) => {
        setComments(prev =>
            prev.map(comment => {
                // Cập nhật parent comment
                if (comment._id === updatedComment._id) {
                    return updatedComment;
                }
                // Cập nhật reply trong parent comment
                if (comment.replies && comment.replies.length > 0) {
                    const updatedReplies = comment.replies.map(reply =>
                        reply._id === updatedComment._id ? updatedComment : reply
                    );
                    return { ...comment, replies: updatedReplies };
                }
                return comment;
            })
        );
        loadStats(); // Reload stats nếu rating thay đổi
    };

    const handleCommentDeleted = (commentId) => {
        setComments(prev => {
            // Kiểm tra xem comment bị xóa có phải là parent comment không
            const isParentComment = prev.find(comment => comment._id === commentId);
            
            if (isParentComment) {
                // Xóa parent comment
                return prev.filter(comment => comment._id !== commentId);
            } else {
                // Xóa reply khỏi parent comment
                return prev.map(comment => ({
                    ...comment,
                    replies: comment.replies ? comment.replies.filter(reply => reply._id !== commentId) : []
                }));
            }
        });
        
        loadStats(); // Reload stats
        setPagination(prev => ({
            ...prev,
            totalRecords: Math.max(0, prev.totalRecords - 1)
        }));
    };

    const handleReplyAdded = (newReply) => {
        // Update parent comment's replies
        setComments(prev =>
            prev.map(comment => {
                if (comment._id === newReply.parentComment) {
                    return {
                        ...comment,
                        replies: [...(comment.replies || []), newReply]
                    };
                }
                return comment;
            })
        );

        setPagination(prev => ({
            ...prev,
            totalRecords: prev.totalRecords + 1
        }));
    };

    const handleSortChange = (newSortBy) => {
        if (newSortBy === sortBy) {
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('desc');
        }
    };

    const renderRatingBreakdown = () => {
        if (stats.totalRatings === 0) return null;

        return (
            <div className="rating-breakdown">
                <div className="overall-rating">
                    <div className="rating-display">
                        <span className="rating-number">{stats.averageRating}</span>
                        <StarRating rating={Math.round(stats.averageRating)} readonly size="medium" />
                    </div>
                    <div className="rating-text">
                        <span className="rating-count">({stats.totalRatings} đánh giá)</span>
                    </div>
                </div>

                <div className="rating-distribution">
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = stats.ratingsBreakdown[star] || 0;
                        const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;

                        return (
                            <div key={star} className="rating-row">
                                <span className="star-count">{star} ⭐</span>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="count-text">({count})</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const getDisplayedComments = () => {
        if (showAllComments) return comments;
        return comments.slice(0, displayLimit);
    };

    const getHighRatingComments = () => {
        // Show comments with 4-5 stars first when not showing all
        if (showAllComments) return getDisplayedComments();
        return comments
            .filter(comment => comment.rating >= 4)
            .slice(0, displayLimit);
    };

    const getSortLabel = () => {
        const labels = {
            createdAt: 'Thời gian',
            likesCount: 'Lượt thích',
            rating: 'Đánh giá'
        };
        return labels[sortBy] || 'Thời gian';
    };

    if (loading) {
        return (
            <div className="comments-loading">
                <FaSpinner className="spinning" />
                <span>Đang tải bình luận...</span>
            </div>
        );
    }

    return (
        <div className="comments-section">
            <div className="comments-header">
                <div className="header-left">
                    <h3 className="comments-title">
                        <FaComments />
                        Đánh giá
                        <span className="comments-count">({getTotalCommentsCount()})</span>
                    </h3>
                </div>

                <button
                    className="filter-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter />
                    Sắp xếp
                    <FaChevronDown className={showFilters ? 'rotated' : ''} />
                </button>
            </div>

            {showFilters && (
                <div className="comments-filters">
                    <div className="sort-options">
                        <button
                            className={`sort-btn ${sortBy === 'rating' ? 'active' : ''}`}
                            onClick={() => handleSortChange('rating')}
                        >
                            Đánh giá cao {sortBy === 'rating' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                            className={`sort-btn ${sortBy === 'createdAt' ? 'active' : ''}`}
                            onClick={() => handleSortChange('createdAt')}
                        >
                            Mới nhất {sortBy === 'createdAt' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                        <button
                            className={`sort-btn ${sortBy === 'likesCount' ? 'active' : ''}`}
                            onClick={() => handleSortChange('likesCount')}
                        >
                            Hữu ích {sortBy === 'likesCount' && (sortOrder === 'desc' ? '↓' : '↑')}
                        </button>
                    </div>
                </div>
            )}

            {/* Rating Overview */}
            {stats.totalRatings > 0 && (
                <div className="rating-overview">
                    {renderRatingBreakdown()}
                </div>
            )}

            {/* Comment Form */}
            <div className="comment-form-section">
                <h4>Chia sẻ đánh giá của bạn</h4>
                <CommentForm
                    propertyId={propertyId}
                    onCommentAdded={handleCommentAdded}
                />
            </div>

            {/* Comments List */}
            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="no-comments">
                        <FaComments />
                        <p>Chưa có đánh giá nào</p>
                    </div>
                ) : (
                    <>
                        <div className={showAllComments ? '' : 'compact-comments'}>
                            {(showAllComments ? comments : comments.slice(0, displayLimit)).map((comment) => (
                                <div key={comment._id} className="comment-item-wrapper">
                                    <CommentItem
                                        comment={comment}
                                        propertyOwnerId={propertyOwnerId}
                                        onCommentUpdated={handleCommentUpdated}
                                        onCommentDeleted={handleCommentDeleted}
                                        onReplyAdded={handleReplyAdded}
                                        compact={!showAllComments}
                                    />
                                    {!showAllComments && comment.rating >= 4 && (
                                        <span className="high-rating-badge">
                                            <FaStar />
                                            Đánh giá tốt
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Show More Button */}
                        {!showAllComments && comments.length > displayLimit && (
                            <button
                                className="show-more-btn"
                                onClick={() => setShowAllComments(true)}
                            >
                                Xem tất cả {comments.length} đánh giá
                                <FaChevronDown />
                            </button>
                        )}

                        {/* Load More Button */}
                        {showAllComments && pagination.current < pagination.total && (
                            <div className="load-more-container">
                                <button
                                    className="load-more-btn"
                                    onClick={() => loadComments(false)}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <>
                                            <FaSpinner className="spinning" />
                                            Đang tải...
                                        </>
                                    ) : (
                                        `Tải thêm`
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Collapse Button */}
                        {showAllComments && (
                            <button
                                className="show-more-btn expanded"
                                onClick={() => setShowAllComments(false)}
                            >
                                Thu gọn
                                <FaChevronDown />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Comments;
