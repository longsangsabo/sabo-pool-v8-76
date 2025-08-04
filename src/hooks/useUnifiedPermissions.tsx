import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface UserPermissions {
  isAdmin: boolean;
  isClubOwner: boolean;
  isClubManager: boolean;
  clubId?: string;
  clubPermissions: string[];
  canAccessAdminPanel: boolean;
  canAccessCLBPanel: boolean;
}

export const useUnifiedPermissions = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();

  const query = useQuery({
    queryKey: ['unified-permissions', user?.id],
    queryFn: async (): Promise<UserPermissions> => {
      if (!user?.id) {
        return {
          isAdmin: false,
          isClubOwner: false,
          isClubManager: false,
          clubPermissions: [],
          canAccessAdminPanel: false,
          canAccessCLBPanel: false,
        };
      }

      // Check CLB permissions
      const { data: clubStaff, error } = await supabase
        .from('club_staff')
        .select('club_id, role, permissions')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching club permissions:', error);
      }

      const permissions: UserPermissions = {
        isAdmin,
        isClubOwner: clubStaff?.role === 'owner',
        isClubManager: ['owner', 'manager'].includes(clubStaff?.role || ''),
        clubId: clubStaff?.club_id,
        clubPermissions: clubStaff?.permissions || [],
        canAccessAdminPanel: isAdmin,
        canAccessCLBPanel: !!clubStaff, // Has any CLB role
      };

      return permissions;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    permissions: query.data || {
      isAdmin: false,
      isClubOwner: false, 
      isClubManager: false,
      clubPermissions: [],
      canAccessAdminPanel: false,
      canAccessCLBPanel: false,
    },
    isLoading: query.isLoading,
    error: query.error,
  };
};
