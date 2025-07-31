
import React, { useState, useEffect } from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { ProfileHeader } from './responsive/ProfileHeader';
import { ProfileStats } from './responsive/ProfileStats';
import { ProfileQuickActions } from './responsive/ProfileQuickActions';
import { ProfileContent } from './responsive/ProfileContent';
import { ProfileActivities } from './responsive/ProfileActivities';
import ProfileErrorBoundary from './ProfileErrorBoundary';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ResponsiveProfilePage: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();
  const { data: profile, isLoading, error, refetch } = useUnifiedProfile();
  const [activeTab, setActiveTab] = useState('activities');

  // Handle URL tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['activities', 'basic', 'rank', 'club'].includes(tabParam)) {
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive font-medium">
                Có lỗi khi tải thông tin profile
              </div>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {error.message}
              </div>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    if (isMobile) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* Mobile Header */}
            <ProfileHeader profile={profile} />
            
            {/* Mobile Stats */}
            <ProfileStats profile={profile} />
            
            {/* Mobile Quick Actions */}
            <ProfileQuickActions 
              profile={profile} 
              onNavigateToClubTab={handleNavigateToClubTab}
              onNavigateToRankTab={handleNavigateToRankTab}
            />
            
            {/* Mobile Content */}
            <ProfileContent 
              profile={profile}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            
            {/* Mobile Recent Activities */}
            {activeTab === 'activities' && (
              <ProfileActivities activities={profile?.recent_activities || []} />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Desktop Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <ProfileQuickActions 
                profile={profile} 
                onNavigateToClubTab={handleNavigateToClubTab}
                onNavigateToRankTab={handleNavigateToRankTab}
              />
              <ProfileActivities 
                activities={profile?.recent_activities || []} 
                className="hidden lg:block"
              />
            </div>

            {/* Desktop Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Desktop Header */}
              <ProfileHeader profile={profile} />
              
              {/* Desktop Stats */}
              <ProfileStats profile={profile} />
              
              {/* Desktop Content */}
              <ProfileContent 
                profile={profile}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProfileErrorBoundary>
      {renderContent()}
    </ProfileErrorBoundary>
  );
};

export default ResponsiveProfilePage;
