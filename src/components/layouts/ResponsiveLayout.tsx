import React, { memo } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { DesktopLayout } from '../desktop/DesktopLayout';
import { UserMobileLayout } from '../mobile/UserMobileLayout';
import { TabletLayout } from '../tablet/TabletLayout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayoutBase: React.FC<ResponsiveLayoutProps> = ({
  children,
}) => {
  const { isMobile, isTablet, isDesktop } = useOptimizedResponsive();

  // Early return pattern - only render one layout
  if (isMobile) {
    return (
      <div data-testid='mobile-layout'>
        <UserMobileLayout>{children}</UserMobileLayout>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div data-testid='tablet-layout'>
        <TabletLayout>{children}</TabletLayout>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div data-testid='desktop-layout'>
        <DesktopLayout>{children}</DesktopLayout>
      </div>
    );
  }

  // Fallback loading state during initial render
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <LoadingSpinner />
    </div>
  );
};

// Memoized for performance
export const ResponsiveLayout = memo(ResponsiveLayoutBase);
