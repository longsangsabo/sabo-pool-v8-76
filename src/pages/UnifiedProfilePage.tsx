import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { UnifiedNavigation } from '@/components/navigation/UnifiedNavigation';

// Profile Components
import {
  ProfileHeader,
  ProfileStats,
  ProfileQuickActions,
  ProfileContent,
  ProfileActivities,
} from '@/components/profile/unified';
import ProfileErrorBoundary from '@/components/profile/ProfileErrorBoundary';

// UI Components
import { Loader2, RefreshCw, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Unified Profile Page
 *
 * Thiết kế thống nhất cho tất cả các thiết bị và chế độ:
 * - Mobile: Layout tối ưu với bottom navigation
 * - Desktop/Tablet: Layout responsive với sidebar
 * - Arena Mode: Có thể được kích hoạt thông qua props hoặc URL param
 */
const UnifiedProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop } = useOptimizedResponsive();
  const { data: profile, isLoading, error, refetch } = useUnifiedProfile();

  const [activeTab, setActiveTab] = React.useState('overview');
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [arenaMode, setArenaMode] = React.useState(false);

  // Handle scroll for back-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle URL parameters for tab navigation and arena mode
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const arenaParam = urlParams.get('arena');

    if (
      tabParam &&
      ['overview', 'stats', 'activities', 'settings', 'rank', 'club'].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam);
    }

    if (arenaParam === 'true') {
      setArenaMode(true);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === 'overview') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.replaceState({}, '', url.toString());
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToClubTab = () => {
    handleTabChange('club');
  };

  const handleNavigateToRankTab = () => {
    handleTabChange('rank');
  };

  // Loading State
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <Loader2 className='w-8 h-8 animate-spin text-primary mx-auto' />
          <p className='text-sm text-muted-foreground'>Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <div className='text-center space-y-4'>
              <div className='text-destructive font-medium'>
                Có lỗi khi tải thông tin profile
              </div>
              <div className='text-xs text-muted-foreground bg-muted p-3 rounded-md font-mono'>
                {error?.message || 'Unknown error occurred'}
              </div>
              <Button
                onClick={() => refetch()}
                variant='outline'
                className='w-full'
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback data if profile is null
  const safeProfile = profile || {
    user_id: user?.id || '',
    display_name:
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Người dùng',
    full_name:
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Người dùng',
    email: user?.email || '',
    skill_level: 'beginner',
    completion_percentage: 0,
    total_matches: 0,
    matches_won: 0,
    win_percentage: 0,
    spa_points: 0,
    recent_activities: [],
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <ProfileErrorBoundary>
        <Helmet>
          <title>Hồ sơ - {safeProfile?.display_name || 'SABO ARENA'}</title>
          <meta
            name='description'
            content={`Hồ sơ của ${safeProfile?.display_name || 'người chơi'} trên SABO ARENA`}
          />
        </Helmet>

        <UnifiedNavigation>
          <div
            className={`min-h-screen ${arenaMode ? 'bg-gradient-to-b from-slate-900 to-black' : 'bg-background'}`}
          >
            {/* Mobile Profile Content */}
            <div className='pb-20 space-y-4'>
              {/* Header */}
              <ProfileHeader
                profile={safeProfile}
                variant='mobile'
                arenaMode={arenaMode}
              />

              {/* Stats */}
              <ProfileStats
                profile={safeProfile}
                variant='mobile'
                arenaMode={arenaMode}
              />

              {/* Quick Actions */}
              <ProfileQuickActions
                profile={safeProfile}
                variant='mobile'
                onNavigateToClubTab={handleNavigateToClubTab}
                onNavigateToRankTab={handleNavigateToRankTab}
                arenaMode={arenaMode}
              />

              {/* Main Content */}
              <ProfileContent
                profile={safeProfile}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant='mobile'
                arenaMode={arenaMode}
              />

              {/* Activities (if overview tab) */}
              {activeTab === 'overview' && (
                <ProfileActivities
                  userId={safeProfile?.user_id}
                  profile={safeProfile}
                  variant='mobile'
                  arenaMode={arenaMode}
                />
              )}
            </div>

            {/* Back to Top Button */}
            {showScrollTop && (
              <Button
                onClick={scrollToTop}
                className='fixed bottom-20 right-4 w-12 h-12 rounded-full shadow-lg z-40'
                size='sm'
              >
                <ArrowUp className='w-4 h-4' />
              </Button>
            )}
          </div>
        </UnifiedNavigation>
      </ProfileErrorBoundary>
    );
  }

  // Desktop/Tablet Layout
  return (
    <ProfileErrorBoundary>
      <Helmet>
        <title>Hồ sơ - {profile?.display_name || 'SABO ARENA'}</title>
        <meta
          name='description'
          content={`Hồ sơ của ${profile?.display_name || 'người chơi'} trên SABO ARENA`}
        />
      </Helmet>

      <UnifiedNavigation>
        <div className='container mx-auto px-4 py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Left Sidebar */}
            <div className='lg:col-span-1 space-y-6'>
              <ProfileQuickActions
                profile={safeProfile}
                variant='desktop'
                onNavigateToClubTab={handleNavigateToClubTab}
                onNavigateToRankTab={handleNavigateToRankTab}
              />
              <ProfileActivities
                userId={safeProfile?.user_id}
                profile={safeProfile}
                variant='desktop'
                className='hidden lg:block'
              />
            </div>

            {/* Main Content */}
            <div className='lg:col-span-3 space-y-6'>
              {/* Header */}
              <ProfileHeader profile={safeProfile} variant='desktop' />

              {/* Stats */}
              <ProfileStats profile={safeProfile} variant='desktop' />

              {/* Content */}
              <ProfileContent
                profile={safeProfile}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                variant='desktop'
              />
            </div>
          </div>
        </div>
      </UnifiedNavigation>
    </ProfileErrorBoundary>
  );
};

export default UnifiedProfilePage;
