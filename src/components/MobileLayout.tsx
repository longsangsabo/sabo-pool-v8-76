import { ReactNode } from 'react';
import { UserMobileLayout } from './mobile/UserMobileLayout';
import RealtimeNotificationSystem from './RealtimeNotificationSystem';
import PWAInstallPrompt from './PWAInstallPrompt';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
}

const MobileLayout = ({
  children,
  className = '',
  showNavigation = true,
}: MobileLayoutProps) => {
  return (
    <>
      <RealtimeNotificationSystem />
      <PWAInstallPrompt />
      <UserMobileLayout showBottomNav={showNavigation}>
        <div className={`${className}`}>
          {children}
        </div>
      </UserMobileLayout>
    </>
  );
};

export default MobileLayout;