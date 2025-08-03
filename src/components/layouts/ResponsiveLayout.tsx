
import React, { memo } from 'react';
import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayoutBase: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <UnifiedNavigation>
      {children}
    </UnifiedNavigation>
  );
};

// Memoized for performance
export const ResponsiveLayout = memo(ResponsiveLayoutBase);
