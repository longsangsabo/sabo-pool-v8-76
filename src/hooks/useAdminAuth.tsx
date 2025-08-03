import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useAdminCheck } from './useAdminCheck';

/**
 * Admin-specific auth hook that only loads for admin users
 * Prevents unnecessary admin permission checks for regular users
 */
export const useAdminAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/auth?mode=login&redirect=/admin');
      } else if (isAdmin === false) {
        // Temporary bypass for admin emails during debug
        const isAdminEmail =
          user?.email === 'longsangsabo@gmail.com' ||
          user?.email === 'longsang063@gmail.com';
        if (!isAdminEmail) {
          navigate('/dashboard');
        }
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  return {
    user,
    isAdmin:
      isAdmin ||
      user?.email === 'longsangsabo@gmail.com' ||
      user?.email === 'longsang063@gmail.com',
    loading: authLoading || adminLoading,
    isAuthenticated:
      !!user &&
      (isAdmin ||
        user?.email === 'longsangsabo@gmail.com' ||
        user?.email === 'longsang063@gmail.com'),
  };
};
