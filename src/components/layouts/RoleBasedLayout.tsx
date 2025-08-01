import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useClubRole } from '@/hooks/useClubRole';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { AdminResponsiveLayout } from './AdminResponsiveLayout';
import { ClubResponsiveLayout } from './ClubResponsiveLayout';
import { ResponsiveLayout } from './ResponsiveLayout';

interface RoleBasedLayoutProps {
  children: React.ReactNode;
}

export const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({
  children,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { isClubOwner, isLoading: clubLoading } = useClubRole();
  const { isDesktop } = useOptimizedResponsive();

  // Show loading while checking roles
  if (authLoading || adminLoading || clubLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Priority: Admin > Club Owner > Regular User
  if (user && isAdmin) {
    return <AdminResponsiveLayout>{children}</AdminResponsiveLayout>;
  }

  // Club owners get club-specific layout
  if (user && isClubOwner) {
    return <ClubResponsiveLayout>{children}</ClubResponsiveLayout>;
  }

  // Regular users get standard responsive layout
  return <ResponsiveLayout>{children}</ResponsiveLayout>;
};
