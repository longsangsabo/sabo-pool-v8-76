
import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import ResponsiveProfilePage from '@/components/profile/ResponsiveProfilePage';
import ArenaProfilePage from '@/components/profile/ArenaProfilePage';

const Profile: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();
  
  // Use Arena profile for mobile, responsive profile for desktop
  return isMobile ? <ArenaProfilePage /> : <ResponsiveProfilePage />;
};

export default Profile;
