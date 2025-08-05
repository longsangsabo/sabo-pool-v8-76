import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AdminUser {
  id: string;
  user_id: string;
  role: 'system_admin' | 'club_admin';
  permissions: Record<string, boolean>;
  created_at: string;
}

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      // Mock admin check since admin_users table doesn't exist
      // For demo purposes, make first user an admin
      const mockIsAdmin = user?.email === 'admin@example.com';

      if (mockIsAdmin) {
        setIsAdmin(true);
        setAdminUser({
          id: '1',
          user_id: user?.id || '',
          role: 'system_admin',
          permissions: {
            manage_users: true,
            manage_tournaments: true,
            manage_clubs: true,
            view_analytics: true,
          },
          created_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Error in checkAdminStatus: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAdmin,
    adminUser,
    loading,
    error,
  };
};
