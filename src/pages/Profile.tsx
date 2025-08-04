import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import ResponsiveProfilePage from '@/components/profile/ResponsiveProfilePage';
import ArenaProfilePage from '@/components/profile/ArenaProfilePage';

const Profile: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();

  // Debug logging

    isMobile,
    screenWidth: window.innerWidth,
    userAgent: navigator.userAgent.includes('Mobile'),
  });

  if (isMobile) {

    return <ArenaProfilePage />;
  }

  return <ResponsiveProfilePage />;
};

export default Profile;
