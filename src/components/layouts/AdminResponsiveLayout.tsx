
import React, { memo } from 'react';
import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';

interface AdminResponsiveLayoutProps {
  children: React.ReactNode;
}

const AdminResponsiveLayoutBase: React.FC<AdminResponsiveLayoutProps> = ({ children }) => {
  // UnifiedNavigation will automatically handle admin role detection and responsive layout
  return (
    <UnifiedNavigation>
      {children}
    </UnifiedNavigation>
  );
};

// Memoized for performance
export const AdminResponsiveLayout = memo(AdminResponsiveLayoutBase);
