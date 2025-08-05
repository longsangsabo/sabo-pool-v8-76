import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'admin' | 'moderator' | 'club_owner' | 'user';

export const useRoles = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async (): Promise<AppRole[]> => {
      if (!user?.id) {
        return [];
      }

      try {
        console.log('useRoles: Fetching roles for user:', user.id);

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('useRoles: Error fetching roles:', error);
          // For RLS policy errors, return empty array (regular user)
          if (
            error.message?.includes('RLS') ||
            error.message?.includes('policy')
          ) {
            return [];
          }
          throw error;
        }

        const roles = data?.map(r => r.role as AppRole) || [];
        console.log('useRoles: Fetched roles:', roles);
        return roles;
      } catch (error) {
        console.error('useRoles: Failed to fetch roles:', error);
        // Default to empty array for regular users
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      // Don't retry RLS policy errors
      if (
        error?.message?.includes('RLS') ||
        error?.message?.includes('policy')
      ) {
        return false;
      }
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const hasRole = (role: AppRole): boolean => {
    return query.data?.includes(role) || false;
  };

  return {
    roles: query.data || [],
    hasRole,
    isAdmin: hasRole('admin'),
    isModerator: hasRole('moderator'),
    isClubOwner: hasRole('club_owner'),
    isUser: hasRole('user'),
    isLoading: query.isLoading,
    error: query.error,
  };
};
