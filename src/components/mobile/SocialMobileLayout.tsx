import React, { ReactNode } from 'react';
import SocialHeader from './SocialHeader';
import SocialMobileNav from './SocialMobileNav';
import { EnhancedOfflineIndicator } from '@/components/offline';

interface SocialMobileLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  showBottomNav?: boolean;
  onMenuClick?: () => void;
}

export const SocialMobileLayout: React.FC<SocialMobileLayoutProps> = ({
  children,
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  showBottomNav = true,
  onMenuClick
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Social Header with Theme Toggle */}
      <SocialHeader
        title={title}
        showSearch={showSearch}
        showProfile={showProfile}
        showNotifications={showNotifications}
        onMenuClick={onMenuClick}
      />

      {/* Main Content with Social Feed Layout */}
      <main className={`${showBottomNav ? 'pb-20' : 'pb-4'} pt-16`}>
        <div className="social-feed">
          {children}
        </div>
      </main>

      {/* Social Mobile Bottom Navigation */}
      {showBottomNav && <SocialMobileNav />}
      
      {/* Enhanced Offline Indicator */}
      <EnhancedOfflineIndicator position="top-right" />
    </div>
  );
};