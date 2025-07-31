
import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import ResponsiveProfilePage from '@/components/profile/ResponsiveProfilePage';
import ArenaProfilePage from '@/components/profile/ArenaProfilePage';

const Profile: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();
  
  // Debug logging
  console.log('🔍 [Profile] Debug info:', {
    isMobile,
    screenWidth: window.innerWidth,
    userAgent: navigator.userAgent.includes('Mobile')
  });
  
  // TEMPORARILY FORCE ARENA PROFILE FOR TESTING
  return <ArenaProfilePage />;
};

export default Profile;
