import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClubRole } from '@/hooks/useClubRole';
import { ClubMobileHeader } from '@/components/club/ClubMobileHeader';
import { ClubTabletNavigation } from '@/components/club/ClubTabletNavigation';
import { ClubMobileDrawer } from '@/components/club/ClubMobileDrawer';

interface ClubTabletLayoutProps {
  children?: React.ReactNode;
}

export const ClubTabletLayout: React.FC<ClubTabletLayoutProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const { isClubOwner, clubProfile, isLoading } = useClubRole();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-primary'></div>
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

      <main className='pb-20 pt-4 px-6 max-w-6xl mx-auto'>
        {children || <Outlet />}
      </main>

      <ClubTabletNavigation />

      <ClubMobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        clubProfile={clubProfile}
      />
    </div>
  );
};
