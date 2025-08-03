import { useState } from 'react';
import { toast } from 'sonner';

// Simple mock hook since admin_actions table doesn't exist
export const useServerSideAuth = () => {
  const [loading, setLoading] = useState(false);

  const logAdminAction = async (action: string, details: any) => {
    try {
      // Mock implementation - log to console instead of database
      console.log('Admin action:', action, details);
      return true;
    } catch (error) {
      console.error('Error logging admin action:', error);
      return false;
    }
  };

  return {
    loading,
    logAdminAction,
    data: { isAdmin: true, canAccess: true },
  };
};
