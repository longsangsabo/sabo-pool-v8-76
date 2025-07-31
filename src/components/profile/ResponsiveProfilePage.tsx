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
import { TechButton, TechCard } from '@/components/mobile/TechMobileComponents';

const ResponsiveProfilePage: React.FC = () => {
  const { isMobile } = useOptimizedResponsive();
  const { data: profile, isLoading, error, refetch } = useUnifiedProfile();
  const [activeTab, setActiveTab] = useState('activities');

  // Apply tech theme to body when mobile with debugging
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('tech-theme');
      
      // Force inject tech styles if not loaded
      const techStyleCheck = document.querySelector('.sabo-tech-card');
      if (!techStyleCheck) {
        console.log('Forcing tech styles injection...');
        const style = document.createElement('style');
        style.textContent = `
          .sabo-tech-card { 
            position: relative !important; 
            background: rgba(15, 23, 42, 0.9) !important; 
            backdrop-filter: blur(10px) !important; 
            border-radius: 8px !important;
            border: 2px solid hsl(var(--primary)) !important;
            box-shadow: 0 0 20px hsl(var(--primary) / 0.3) !important;
          }
          .tech-card-border {
            position: absolute !important;
            top: -2px !important; left: -2px !important; right: -2px !important; bottom: -2px !important;
            background: linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent-blue)), hsl(var(--primary))) !important;
            border-radius: 8px !important;
            animation: tech-pulse 3s ease-in-out infinite alternate !important;
          }
          .tech-card-content {
            position: relative !important;
            padding: 20px !important;
            background: hsl(var(--card)) !important;
            border-radius: 6px !important;
          }
          .tech-header-title {
            color: hsl(var(--primary)) !important;
            text-shadow: 0 0 10px hsl(var(--primary) / 0.5) !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
          }
          @keyframes tech-pulse {
            0% { opacity: 0.7; filter: brightness(1); }
            100% { opacity: 1; filter: brightness(1.1); }
          }
        `;
        document.head.appendChild(style);
      }
      
      console.log('Tech theme applied - mobile detected, body classes:', document.body.classList.toString());
      return () => {
        document.body.classList.remove('tech-theme');
        console.log('Tech theme removed');
      };
    }
  }, [isMobile]);

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
        <div className="min-h-screen">
          <div className="container mx-auto pb-24 space-y-0">
            {/* Mobile Header với Tech Styling */}
            <ProfileHeader profile={profile} />
            
            {/* Mobile Stats với Tech Cards */}
            <ProfileStats profile={profile} />
            
            {/* Mobile Quick Actions với Tech Elements */}
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
          
          {/* Tech Mobile Navigation */}
          <div className="sabo-tech-navigation">
            <div className="tech-nav-border"></div>
            <div className="tech-nav-items">
              <div className="tech-nav-item">
                <div className="nav-item-icon">🏠</div>
                <span className="nav-item-label">Trang chủ</span>
              </div>
              <div className="tech-nav-item">
                <div className="nav-item-icon">🏆</div>
                <span className="nav-item-label">Thách đấu</span>
              </div>
              <div className="tech-nav-item active">
                <div className="nav-item-glow"></div>
                <div className="nav-item-icon">👤</div>
                <span className="nav-item-label">Hồ sơ</span>
              </div>
              <div className="tech-nav-item">
                <div className="nav-item-icon">📅</div>
                <span className="nav-item-label">Lịch</span>
              </div>
              <div className="tech-nav-item">
                <div className="nav-item-icon">📊</div>
                <span className="nav-item-label">Xếp hạng</span>
              </div>
            </div>
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