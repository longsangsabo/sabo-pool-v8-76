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

      console.log('useRoles: Fetching roles for user:', user.id);

      // Temporary: return empty array until user_roles table exists
      console.log('useRoles: Table user_roles not implemented yet');
      return [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
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
    error: query.error
  };
};