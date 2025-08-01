import React, { memo } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { BREAKPOINTS } from '@/constants/breakpoints';
import { AdminForceDesktopLayout } from './AdminForceDesktopLayout';
import { AdminMobileLayout } from './AdminMobileLayout';

interface AdminResponsiveLayoutProps {
  children: React.ReactNode;
}

const AdminResponsiveLayoutBase: React.FC<AdminResponsiveLayoutProps> = ({
  children,
}) => {
  const { width } = useOptimizedResponsive();

  // Early return pattern - admin uses desktop layout for tablet and up
  if (width >= BREAKPOINTS.mobile) {
    return <AdminForceDesktopLayout>{children}</AdminForceDesktopLayout>;
  }

  return <AdminMobileLayout>{children}</AdminMobileLayout>;
};

// Memoized for performance
export const AdminResponsiveLayout = memo(AdminResponsiveLayoutBase);
