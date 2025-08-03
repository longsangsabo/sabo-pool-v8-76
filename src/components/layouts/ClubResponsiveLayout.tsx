
import React, { memo } from 'react';
import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';

interface ClubResponsiveLayoutProps {
  children: React.ReactNode;
}

const ClubResponsiveLayoutBase: React.FC<ClubResponsiveLayoutProps> = ({ children }) => {
  // UnifiedNavigation will automatically handle club role detection and responsive layout
  return (
    <UnifiedNavigation>
      {children}
    </UnifiedNavigation>
  );
};

// Memoized for performance
export const ClubResponsiveLayout = memo(ClubResponsiveLayoutBase);
