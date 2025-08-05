import React, { ReactNode } from 'react';
import { MobileHeader } from '../mobile/MobileHeader';
import { MobileNavigation } from '../mobile/MobileNavigation';

interface TabletLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  showWallet?: boolean;
  showBottomNav?: boolean;
  onMenuClick?: () => void;
}

export const TabletLayout: React.FC<TabletLayoutProps> = ({
  children,
  title,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
  showWallet = true,
  showBottomNav = true,
  onMenuClick,
}) => {
  return (
    <div className='min-h-screen bg-background'>
      {/* Tablet Header - Larger and more spaced */}
      <MobileHeader
        title={title}
        showSearch={showSearch}
        showProfile={showProfile}
        showNotifications={showNotifications}
        showWallet={showWallet}
        onMenuClick={onMenuClick}
      />

      {/* Main Content - Optimized for tablet with enhanced spacing */}
      <main
        className={`
        max-w-6xl mx-auto px-8 
        ${showBottomNav ? 'pb-24' : 'pb-8'} 
        pt-6
      `}
      >
        <div className='animate-fade-in space-y-6'>{children}</div>
      </main>

      {/* Bottom Navigation - Enhanced for tablet */}
      {showBottomNav && (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-6xl'>
          <div className='bg-card/95 backdrop-blur-md border-t border-border/50 pb-safe-bottom'>
            <div className='px-8 py-1'>
              <MobileNavigation />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
