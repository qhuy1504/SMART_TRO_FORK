// Utility functions for managing property view tracking

export const viewTrackingUtils = {
  // Clear all view tracking data from localStorage
  clearAllViewTracking: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('viewed_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Clear specific property view tracking
  clearPropertyViewTracking: (propertyId) => {
    localStorage.removeItem(`viewed_${propertyId}`);
  },

  // Check if property has been viewed in current session
  hasBeenViewed: (propertyId) => {
    return localStorage.getItem(`viewed_${propertyId}`) === 'true';
  },

  // Mark property as viewed
  markAsViewed: (propertyId) => {
    localStorage.setItem(`viewed_${propertyId}`, 'true');
  },

  // Clear view tracking older than specified hours (default 24 hours)
  clearOldViewTracking: (hoursOld = 24) => {
    const now = Date.now();
    const cutoffTime = now - (hoursOld * 60 * 60 * 1000);
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('viewed_')) {
        const timestamp = localStorage.getItem(`${key}_timestamp`);
        if (timestamp && parseInt(timestamp) < cutoffTime) {
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_timestamp`);
        }
      }
    });
  },

  // Mark property as viewed with timestamp
  markAsViewedWithTimestamp: (propertyId) => {
    const now = Date.now().toString();
    localStorage.setItem(`viewed_${propertyId}`, 'true');
    localStorage.setItem(`viewed_${propertyId}_timestamp`, now);
  }
};

export default viewTrackingUtils;
