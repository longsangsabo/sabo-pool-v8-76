import React, { memo } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { ClubDesktopLayout } from './ClubDesktopLayout';
import { ClubMobileLayout } from './ClubMobileLayout';
import { ClubTabletLayout } from './ClubTabletLayout';

interface ClubResponsiveLayoutProps {
  children: React.ReactNode;
}

const ClubResponsiveLayoutBase: React.FC<ClubResponsiveLayoutProps> = ({
  children,
}) => {
  const { isMobile, isTablet, isDesktop } = useOptimizedResponsive();

  // Early return pattern - only render one layout
  if (isMobile) {
    return <ClubMobileLayout>{children}</ClubMobileLayout>;
  }

  if (isTablet) {
    return <ClubTabletLayout>{children}</ClubTabletLayout>;
  }

  if (isDesktop) {
    return <ClubDesktopLayout>{children}</ClubDesktopLayout>;
  }

  // Fallback to mobile layout
  return <ClubMobileLayout>{children}</ClubMobileLayout>;
};

// Memoized for performance
export const ClubResponsiveLayout = memo(ClubResponsiveLayoutBase);
