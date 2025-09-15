import React, { createContext, useContext, useState, useEffect } from 'react';
import { myPropertiesAPI } from '../services/myPropertiesAPI';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Load favorites khi user đăng nhập
  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) return;
    
    if (user && !loading) {
      loadFavorites();
    } else if (!user) {
      setFavorites([]);
      setFavoritesCount(0);
    }
  }, [user, authLoading]); // Remove any other dependencies that might cause extra loading

  const loadFavorites = async () => {
    if (!user || loading) return;
    
    try {
      setLoading(true);
      // Gọi API để lấy danh sách favorites
      const response = await myPropertiesAPI.getFavorites();
      if (response.success && response.data.data) {
        // Backend trả về response.data.data.favorites
        const favoriteIds = response.data.data.favorites || [];
        setFavorites(favoriteIds);
        setFavoritesCount(favoriteIds.length);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
      setFavoritesCount(0);
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (propertyId) => {
    if (!user) {
      toast.error(t('favorites.actions.loginRequired'));
      return false;
    }

    try {
      const response = await myPropertiesAPI.addToFavorites(propertyId);
      if (response.success) {
        // Reload favorites để sync với server
        await loadFavorites();
        if (!response.data?.alreadyFavorited) {
          toast.success(t('favorites.actions.addToFavorites'));
        }
        return true;
      } else {
        toast.error(response.message || t('favorites.actions.toggleError'));
        return false;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast.error(t('favorites.actions.toggleError'));
      return false;
    }
  };

  const removeFromFavorites = async (propertyId) => {
    if (!user) {
      toast.error(t('favorites.actions.loginRequired'));
      return false;
    }

    try {
      const response = await myPropertiesAPI.removeFromFavorites(propertyId);
      if (response.success) {
        // Reload favorites để sync với server
        await loadFavorites();
        if (!response.data?.alreadyRemoved) {
          toast.success(t('favorites.actions.removeFromFavorites'));
        }
        return true;
      } else {
        toast.error(response.message || t('favorites.actions.toggleError'));
        return false;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast.error(t('favorites.actions.toggleError'));
      return false;
    }
  };

  const toggleFavorite = async (propertyId) => {
    const isFavorited = favorites.includes(propertyId);
    
    if (isFavorited) {
      return await removeFromFavorites(propertyId);
    } else {
      return await addToFavorites(propertyId);
    }
  };

  const isFavorited = (propertyId) => {
    return favorites.includes(propertyId);
  };

  const value = {
    favorites,
    favoritesCount,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    loadFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
