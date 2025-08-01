import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Trophy, Gamepad2, Building, Shield } from 'lucide-react';

interface ProfileTabsProps {
  children: React.ReactNode;
  userRole: 'player' | 'club_owner' | 'both';
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  children,
  userRole,
}) => {
  const showClubTab = true; // Always show club tab for all users
  const [activeTab, setActiveTab] = useState('performance');

  // Debug logging
  useEffect(() => {
    console.log('ProfileTabs rendered with userRole:', userRole);
    console.log('showClubTab:', showClubTab);
  }, [userRole]);

  // Check URL parameters on component mount and when URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');

      if (
        tabParam &&
        (tabParam === 'performance' ||
          tabParam === 'basic' ||
          tabParam === 'club' ||
          tabParam === 'rank')
      ) {
        setActiveTab(tabParam);
      }
    };

    // Check on mount
    handleUrlChange();

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [showClubTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without triggering a page reload
    const url = new URL(window.location.href);
    if (value === 'performance') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', value);
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
      <TabsList
        className={`grid w-full ${showClubTab ? 'grid-cols-4' : 'grid-cols-3'} bg-muted dark:bg-muted`}
      >
        <TabsTrigger
          value='performance'
          className='flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground'
        >
          <Trophy className='h-4 w-4' />
          <span className='hidden sm:inline'>Thành tích & Thách đấu</span>
          <span className='sm:hidden'>Thành tích</span>
        </TabsTrigger>
        <TabsTrigger
          value='basic'
          className='flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground'
        >
          <User className='h-4 w-4' />
          <span className='hidden sm:inline'>Thông tin cá nhân</span>
          <span className='sm:hidden'>Cá nhân</span>
        </TabsTrigger>
        <TabsTrigger
          value='rank'
          className='flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground'
        >
          <Shield className='h-4 w-4' />
          <span className='hidden sm:inline'>Xác thực hạng</span>
          <span className='sm:hidden'>Hạng</span>
        </TabsTrigger>
        <TabsTrigger
          value='club'
          className='flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground'
        >
          <Building className='h-4 w-4' />
          <span className='hidden sm:inline'>Quản lý CLB</span>
          <span className='sm:hidden'>CLB</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
};
