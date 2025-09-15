import { useEffect } from 'react';
import { viewTrackingUtils } from '../../utils/viewTrackingUtils';

// Component to manage view tracking cleanup
const ViewTrackingManager = () => {
  useEffect(() => {
    // Clean up old view tracking data when app starts
    // Clear views older than 7 days
    viewTrackingUtils.clearOldViewTracking(7 * 24);
    
    // Set up periodic cleanup every hour
    const cleanupInterval = setInterval(() => {
      viewTrackingUtils.clearOldViewTracking(7 * 24);
    }, 60 * 60 * 1000); // Run every hour

    // Cleanup on unmount
    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default ViewTrackingManager;
