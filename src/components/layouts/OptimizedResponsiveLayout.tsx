import React, { memo } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { DesktopLayout } from '../desktop/DesktopLayout';
import { UserMobileLayout } from '../mobile/UserMobileLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface LayoutProps {
  children: React.ReactNode;
}

const OptimizedResponsiveLayoutBase: React.FC<LayoutProps> = ({ children }) => {
  const { isMobile, isTablet, isDesktop, breakpoint } =
    useOptimizedResponsive();

  // Early return pattern - only render one layout
  if (isMobile || isTablet) {
    return <UserMobileLayout children={children} />;
  }

  if (isDesktop) {
    return <DesktopLayout children={children} />;
  }

  // Fallback loading state during initial render
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <LoadingSpinner />
    </div>
  );
};

// Memoized component to prevent unnecessary re-renders
export const OptimizedResponsiveLayout = memo(OptimizedResponsiveLayoutBase);
