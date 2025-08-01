import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import ResponsiveProfilePage from '@/components/profile/ResponsiveProfilePage';
import HybridArenaProfile from '@/components/profile/HybridArenaProfile';

const Profile: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();

  if (isMobile) {
    // Hiển thị HybridArenaProfile (có Mirror/Fan-out Avatar Effect) ở mobile
    return <HybridArenaProfile />;
  }

  return <ResponsiveProfilePage />;
};

export default Profile;
