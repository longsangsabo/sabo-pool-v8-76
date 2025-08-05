import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClubRole } from '@/hooks/useClubRole';
import { ClubMobileHeader } from '@/components/club/ClubMobileHeader';
import { ClubMobileNavigation } from '@/components/club/ClubMobileNavigation';
import { ClubMobileDrawer } from '@/components/club/ClubMobileDrawer';

interface ClubMobileLayoutProps {
  children?: React.ReactNode;
}

export const ClubMobileLayout: React.FC<ClubMobileLayoutProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const { isClubOwner, clubProfile, isLoading } = useClubRole();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!user || !isClubOwner) {
    return null;
  }

  return (
    <div className='min-h-screen bg-background'>
      <ClubMobileHeader
        onMenuClick={() => setIsDrawerOpen(true)}
        clubProfile={clubProfile}
      />

      <main className='pb-16 pt-2 px-4'>{children || <Outlet />}</main>

      <ClubMobileNavigation />

      <ClubMobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        clubProfile={clubProfile}
      />
    </div>
  );
};
