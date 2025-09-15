import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '../../../contexts/FavoritesContext';
import { useAuth } from '../../../contexts/AuthContext';
import { myPropertiesAPI } from '../../../services/myPropertiesAPI';
import PropertyCard from '../../properties/PropertyCard';
import { toast } from 'react-toastify';
import { FaHeart, FaHome } from 'react-icons/fa';
import './Favorites.css';

const Favorites = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites, favoritesCount, toggleFavorite, loading: favoritesLoading } = useFavorites();
  const [favoriteProperties, setFavoriteProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for auth loading to complete before checking user
    if (authLoading) return;
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load favorites when user is available and we have favorites list
    if (user && !authLoading && !favoritesLoading) {
      loadFavoriteProperties();
    }
  }, [user, authLoading, favoritesLoading]); // Monitor favoritesLoading to wait for context to finish

  const loadFavoriteProperties = async () => {
    // Skip if already loading or no user
    if (loading || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get favorites list with property details
      const response = await myPropertiesAPI.getFavorites();
      
      if (response.success && response.data.data) {
        // Backend trả về response.data.data.properties
        console.log('Favorite properties data:', response.data.data.properties);
        setFavoriteProperties(response.data.data.properties || []);
      } else {
        setError(response.message || t('favorites.error'));
      }
    } catch (error) {
      console.error('Error loading favorite properties:', error);
      setError(t('favorites.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (propertyId, isFavorited) => {
    try {
      const success = await toggleFavorite(propertyId);
      if (success) {
        // Remove from local list if unfavorited
        if (isFavorited) {
          setFavoriteProperties(prev => 
            prev.filter(property => property._id !== propertyId)
          );
        } else {
          // If favorited, we might want to reload to get the new property
          // Or just show a success message without reloading
          toast.success(t('favorites.actions.addToFavorites'));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/properties/${propertyId}`);
  };

  // Show loading while auth is being checked or favorites are loading
  if (authLoading || favoritesLoading) {
    return (
      <div className="favorites-page">
        <div className="container">
          <div className="loading-container">
            <i className="fa fa-spinner fa-spin"></i>
            <p>{authLoading ? t('favorites.authenticating') : t('favorites.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-page">
        <div className="container">
          <div className="error-container">
            <i className="fa fa-exclamation-triangle"></i>
            <p>{error}</p>
            <button onClick={loadFavoriteProperties} className="retry-btn">
              {t('favorites.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="container">
        <div className="favorites-header">
          <div className="header-content">
            <FaHeart className="heart-icon" />
            <div className="header-text">
              <h1>{t('favorites.title')}</h1>
              <p>{t('favorites.subtitle', { count: favoritesCount })}</p>
            </div>
          </div>
        </div>

        {favoriteProperties.length === 0 ? (
          <div className="empty-favorites">
            <div className="empty-content">
              <FaHome className="empty-icon" />
              <h3>{t('favorites.empty.title')}</h3>
              <p>{t('favorites.empty.subtitle')}</p>
              <button 
                onClick={() => navigate('/')}
                className="browse-btn"
              >
                {t('favorites.empty.browseBtnText')}
              </button>
            </div>
          </div>
        ) : (
          <div className="favorites-grid">
            {favoriteProperties.map((property) => (
              <PropertyCard
                key={property._id}
                property={property}
                onPropertyClick={handlePropertyClick}
                onFavoriteToggle={handleFavoriteToggle}
                isLoggedIn={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
