import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserPermissions {
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
  isClubOwner: boolean;
  isUser: boolean;
}

interface UseUserPermissionsReturn {
  permissions: UserPermissions;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * useUserPermissions - Hook for managing user roles and permissions
 * 
 * Provides role-based and permission-based access control:
 * - Roles: 'admin', 'club_owner', 'user'
 * - Permissions: granular permissions like 'admin_access', 'club_management', etc.
 */
export const useUserPermissions = (): UseUserPermissionsReturn => {
  const { user, session } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    roles: [],
    permissions: [],
    isAdmin: false,
    isClubOwner: false,
    isUser: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserPermissions = useCallback(async () => {
    if (!user || !session) {
      setPermissions({
        roles: [],
        permissions: [],
        isAdmin: false,
        isClubOwner: false,
        isUser: false,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user profile with role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          role,
          is_admin,
          user_roles (
            role_name,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Check if user owns any clubs
      const { data: clubMemberships, error: clubError } = await supabase
        .from('club_members')
        .select('role, club_id')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      if (clubError) throw clubError;

      // Determine roles
      const roles: string[] = [];
      let isAdmin = false;
      let isClubOwner = false;
      let isUser = true; // Everyone is at least a user

      // Check admin status
      if (profile?.is_admin || profile?.role === 'admin') {
        roles.push('admin');
        isAdmin = true;
      }

      // Check club owner status
      const isOwner = clubMemberships?.some(membership => 
        membership.role === 'owner'
      );
      const isClubAdmin = clubMemberships?.some(membership => 
        membership.role === 'admin'
      );

      if (isOwner || isClubAdmin) {
        roles.push('club_owner');
        isClubOwner = true;
      }

      // Everyone gets user role
      roles.push('user');

      // Add any additional roles from user_roles table
      profile?.user_roles?.forEach((userRole: any) => {
        if (userRole.is_active && !roles.includes(userRole.role_name)) {
          roles.push(userRole.role_name);
        }
      });

      // Determine permissions based on roles
      const permissions: string[] = [];

      if (isAdmin) {
        permissions.push(
          'admin_access',
          'user_management',
          'club_management',
          'tournament_management',
          'system_management',
          'analytics_access',
          'financial_management'
        );
      }

      if (isClubOwner) {
        permissions.push(
          'club_management',
          'tournament_creation',
          'member_management',
          'club_analytics',
          'club_financial'
        );
      }

      // Basic user permissions
      permissions.push(
        'profile_access',
        'tournament_participation',
        'challenge_access',
        'marketplace_access',
        'community_access'
      );

      setPermissions({
        roles,
        permissions,
        isAdmin,
        isClubOwner,
        isUser,
      });

    } catch (err) {
      console.error('Error fetching user permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  // Fetch permissions when user changes
  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  // Helper functions
  const hasRole = useCallback((role: string): boolean => {
    return permissions.roles.includes(role);
  }, [permissions.roles]);

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.permissions.includes(permission);
  }, [permissions.permissions]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => permissions.roles.includes(role));
  }, [permissions.roles]);

  const hasAnyPermission = useCallback((permList: string[]): boolean => {
    return permList.some(permission => permissions.permissions.includes(permission));
  }, [permissions.permissions]);

  return {
    permissions,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAnyPermission,
    loading,
    error,
    refetch: fetchUserPermissions,
  };
};

export default useUserPermissions;
