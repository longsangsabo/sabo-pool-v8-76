import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdminCheck = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useAdminCheck: No user ID found');
        return false;
      }

      console.log('useAdminCheck: Checking admin status for user:', user.id);

      // Check if user has admin role in new user_roles table
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('useAdminCheck: Error checking roles:', error);
        return false;
      }

      const isAdmin = roles?.some(r => r.role === 'admin') || false;
      console.log('useAdminCheck: Admin status result:', {
        user_id: user.id,
        is_admin: isAdmin,
        roles,
      });

      return isAdmin;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });

  return {
    isAdmin: query.data || false,
    isLoading: query.isLoading,
    error: query.error,
  };
};
