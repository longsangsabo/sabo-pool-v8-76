import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useClubRole } from '@/hooks/useClubRole';
import { TopBar } from './TopBar';
import { SideNavigation } from './SideNavigation';
import { BottomNavigation } from './BottomNavigation';
import { getNavigationConfig } from './navigationConfig';

interface UnifiedNavigationProps {
  children: React.ReactNode;
}

/**
 * Unified Navigation System
 * - Handles all navigation patterns across roles and devices
 * - Mobile: TopBar + BottomNavigation
 * - Desktop/Tablet: TopBar + SideNavigation
 * - Role-based navigation items (User/Club/Admin)
 */
export const UnifiedNavigation: React.FC<UnifiedNavigationProps> = ({ children }) => {
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop } = useOptimizedResponsive();
  const { isAdmin } = useAdminCheck();
  const { isClubOwner } = useClubRole();

  // Determine user role for navigation config
  const userRole = isAdmin ? 'admin' : isClubOwner ? 'club' : 'user';
  
  // Get device type for layout
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
  
  // Get navigation configuration
  const navConfig = getNavigationConfig(userRole, deviceType);

  // If user is not authenticated, show minimal navigation
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar showAuthButtons={true} />
        <main className="pt-16">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - Always present */}
      <TopBar 
        userRole={userRole}
        showSearch={navConfig.showSearch}
        showNotifications={navConfig.showNotifications}
        showUserMenu={true}
      />

      <div className="flex">
        {/* Side Navigation - Desktop/Tablet only */}
        {navConfig.showSidebar && (
          <SideNavigation 
            userRole={userRole}
            items={navConfig.sidebarItems}
            collapsed={false}
          />
        )}

        {/* Main Content */}
        <main 
          className={`
            flex-1 
            ${navConfig.showSidebar ? 'ml-64' : ''}
            ${navConfig.showTopBar ? 'pt-16' : ''}
            ${navConfig.showBottomNav ? 'pb-20' : ''}
          `}
        >
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {navConfig.showBottomNav && (
        <BottomNavigation 
          items={navConfig.bottomNavItems}
        />
      )}
    </div>
  );
};
