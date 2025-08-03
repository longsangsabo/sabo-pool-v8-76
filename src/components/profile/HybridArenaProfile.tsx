import React, { useState, useEffect } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { ArenaLogo } from './arena/ArenaLogo';
import { MirrorAvatar } from './arena/MirrorAvatar';
import { ArenaNavigation } from './arena/ArenaNavigation';
import { ArenaProfileStats } from './arena/ArenaProfileStats';
import { ArenaProfileContent } from './arena/ArenaProfileContent';
import { ArenaQuickActions } from './arena/ArenaQuickActions';
import { ArenaActivities } from './arena/ArenaActivities';
import ProfileErrorBoundary from './ProfileErrorBoundary';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const HybridArenaProfile: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();
  const { data: profile, isLoading, error, refetch } = useUnifiedProfile();
  const [activeTab, setActiveTab] = useState('activities');

  // Handle URL tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (
      tabParam &&
      ['activities', 'basic', 'rank', 'club'].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'activities') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleNavigateToClubTab = () => {
    handleTabChange('club');
  };

  const handleNavigateToRankTab = () => {
    handleTabChange('rank');
  };

  if (isLoading) {
    return (
      <div className='profile-page-arena'>
        <div className='flex justify-center items-center min-h-screen'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='profile-page-arena'>
        <div className='flex justify-center items-center min-h-screen p-4'>
          <Card className='w-full max-w-md bg-background/90 border-primary/20'>
            <CardContent className='pt-6'>
              <div className='text-center space-y-4'>
                <div className='text-destructive font-medium'>
                  Có lỗi khi tải thông tin profile
                </div>
                <div className='text-sm text-muted-foreground bg-muted/50 p-3 rounded-md'>
                  {error.message}
                </div>
                <Button
                  onClick={() => refetch()}
                  variant='outline'
                  className='w-full border-primary/30 hover:bg-primary/10'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Thử lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isMobile) {
      return (
        <div className='profile-page-arena min-h-screen relative'>
          {/* Theme Toggle Button */}
          <div className='theme-toggle-container'>
            <ThemeToggle />
          </div>

          <div className='container mx-auto px-4 py-6 space-y-6'>
            {/* Arena Logo */}
            <ArenaLogo />

            {/* Arena Mirror Avatar */}
            <MirrorAvatar
              avatarUrl={profile?.avatar_url}
              username={
                profile?.display_name || profile?.full_name || 'Người chơi'
              }
              rank={profile?.verified_rank || 'Chưa xác minh'}
            />

            {/* Mobile Arena Stats */}
            <ArenaProfileStats profile={profile} />

            {/* Mobile Arena Quick Actions */}
            <ArenaQuickActions
              profile={profile}
              onNavigateToClubTab={handleNavigateToClubTab}
              onNavigateToRankTab={handleNavigateToRankTab}
            />

            {/* Mobile Arena Content */}
            <ArenaProfileContent
              profile={profile}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {/* Mobile Arena Activities */}
            {activeTab === 'activities' && (
              <ArenaActivities activities={profile?.recent_activities || []} />
            )}

            {/* Arena Navigation */}
            <ArenaNavigation />
          </div>
        </div>
      );
    }

    return (
      <div className='profile-page-arena'>
        <div className='container mx-auto px-4 py-8'>
          {/* Arena Logo */}
          <ArenaLogo />

          {/* Arena Mirror Avatar */}
          <MirrorAvatar
            avatarUrl={profile?.avatar_url}
            username={
              profile?.display_name || profile?.full_name || 'Người chơi'
            }
            rank={profile?.verified_rank || 'Chưa xác minh'}
          />

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8'>
            {/* Desktop Left Sidebar */}
            <div className='lg:col-span-1 space-y-6'>
              <ArenaQuickActions
                profile={profile}
                onNavigateToClubTab={handleNavigateToClubTab}
                onNavigateToRankTab={handleNavigateToRankTab}
              />
              <ArenaActivities
                activities={profile?.recent_activities || []}
                className='hidden lg:block'
              />
            </div>

            {/* Desktop Main Content */}
            <div className='lg:col-span-3 space-y-6'>
              {/* Desktop Arena Stats */}
              <ArenaProfileStats profile={profile} />

              {/* Desktop Arena Content */}
              <ArenaProfileContent
                profile={profile}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </div>

          {/* Arena Navigation */}
          <ArenaNavigation />
        </div>
      </div>
    );
  };

  return <ProfileErrorBoundary>{renderContent()}</ProfileErrorBoundary>;
};

export default HybridArenaProfile;
