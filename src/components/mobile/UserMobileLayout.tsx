import React, { ReactNode } from 'react';
import UserMobileHeader from './UserMobileHeader';
import { MobileNavigation } from './MobileNavigation';

interface UserMobileLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  showBottomNav?: boolean;
  onMenuClick?: () => void;
}

export const UserMobileLayout: React.FC<UserMobileLayoutProps> = ({
  children,
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  showBottomNav = true,
  onMenuClick,
}) => {
  return (
    <div className='min-h-screen bg-background'>
      {/* Social Header with Theme Toggle */}
      <UserMobileHeader
        title={title}
        showSearch={showSearch}
        showProfile={showProfile}
        showNotifications={showNotifications}
        onMenuClick={onMenuClick}
      />

      {/* Main Content with Social Feed Layout */}
      <main className={`${showBottomNav ? 'pb-20' : 'pb-4'} pt-16 px-safe`}>
        <div className='social-feed min-h-screen'>{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && <MobileNavigation />}
    </div>
  );
};
