import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClubRole } from '@/hooks/useClubRole';
import { useLanguage } from '@/contexts/LanguageContext';
import ClubSidebar from '@/components/ClubSidebar';
import { ClubDesktopHeader } from '@/components/club/ClubDesktopHeader';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface ClubDesktopLayoutProps {
  children?: React.ReactNode;
}

export const ClubDesktopLayout: React.FC<ClubDesktopLayoutProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const { isClubOwner, clubProfile, isLoading } = useClubRole();
  const { t } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!user || !isClubOwner) {
    return null;
  }

  return (
    <div className='flex min-h-screen bg-background'>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <ClubSidebar collapsed={isSidebarCollapsed} clubProfile={clubProfile} />
      </div>

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0'>
        <ClubDesktopHeader
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sidebarCollapsed={isSidebarCollapsed}
          clubProfile={clubProfile}
        />

        <main className='flex-1 p-6 overflow-auto'>
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
