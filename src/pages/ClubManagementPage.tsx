import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { useClubRole } from '@/hooks/useClubRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Trophy,
  Users,
  Settings,
  UserCheck,
  Swords,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClubOverviewTab from '@/components/ClubOverviewTab';
import ClubSettingsTab from '@/components/ClubSettingsTab';
import ClubRankVerificationTab from '@/components/club/ClubRankVerificationTab';
import ClubChallengesTab from '@/pages/challenges/components/tabs/ClubChallengesTab';
import ClubTournamentManagement from '@/components/club/ClubTournamentManagement';
import ClubMembersAndNotifications from '@/components/club/optimized/ClubMembersAndNotifications';
import ClubManagementAudit from '@/components/club/testing/ClubManagementAudit';
import { ClubResponsiveLayout } from '@/components/layouts/ClubResponsiveLayout';
import { useRankUpdates } from '@/hooks/useRankUpdates';
import { AppProviders } from '@/contexts/AppProviders';

const ClubManagementPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { isClubOwner, clubProfile, isLoading: clubLoading } = useClubRole();
  const location = useLocation();

  // Enable rank update notifications
  useRankUpdates();

  // Determine active tab based on URL
  const getActiveTab = () => {
    if (location.pathname.includes('/tournaments')) return 'tournaments';
    if (location.pathname.includes('/challenges')) return 'challenges';
    if (location.pathname.includes('/verification')) return 'verification';
    if (location.pathname.includes('/members')) return 'members';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'overview';
  };

  // Debug current club info
  console.log('🏢 [ClubManagementPage] Debug:', {
    user: user?.id,
    isClubOwner,
    clubProfile: clubProfile
      ? {
          id: clubProfile.id,
          club_name: clubProfile.club_name,
          user_id: clubProfile.user_id,
        }
      : null,
  });

  // Show loading state
  if (authLoading || clubLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to='/profile' replace />;
  }

  // Show error if not a club owner
  if (!isClubOwner) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Card className='max-w-md mx-auto'>
          <CardHeader>
            <CardTitle className='flex items-center text-orange-600'>
              <AlertCircle className='w-5 h-5 mr-2' />
              Không có quyền truy cập
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground mb-4'>
              Bạn cần là chủ câu lạc bộ để truy cập trang này.
            </p>
            <p className='text-sm text-muted-foreground'>
              Vui lòng đăng ký câu lạc bộ hoặc liên hệ quản trị viên để được hỗ
              trợ.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ClubResponsiveLayout>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground'>
          Quản lý Câu lạc bộ
        </h1>
        <p className='text-muted-foreground mt-2'>
          Quản lý {clubProfile?.club_name || 'câu lạc bộ'}, xác thực hạng và
          theo dõi hoạt động
        </p>
      </div>

      <Tabs value={getActiveTab()} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1'>
          <TabsTrigger
            value='overview'
            className='flex items-center gap-2 px-3 py-2'
          >
            <BarChart3 className='w-4 h-4' />
            <span className='text-sm'>Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger
            value='tournaments'
            className='flex items-center gap-2 px-3 py-2'
          >
            <Trophy className='w-4 h-4' />
            <span className='text-sm'>Giải đấu & Sơ đồ</span>
          </TabsTrigger>
          <TabsTrigger
            value='challenges'
            className='flex items-center gap-2 px-3 py-2'
          >
            <Swords className='w-4 h-4' />
            <span className='text-sm'>Thách đấu</span>
          </TabsTrigger>
          <TabsTrigger
            value='verification'
            className='flex items-center gap-2 px-3 py-2'
          >
            <UserCheck className='w-4 h-4' />
            <span className='text-sm'>Xác thực hạng</span>
          </TabsTrigger>
          <TabsTrigger
            value='members'
            className='flex items-center gap-2 px-3 py-2'
          >
            <Users className='w-4 h-4' />
            <span className='text-sm'>Thành viên & TB</span>
          </TabsTrigger>
          <TabsTrigger
            value='settings'
            className='flex items-center gap-2 px-3 py-2'
          >
            <Settings className='w-4 h-4' />
            <span className='text-sm'>Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview'>
          <ClubOverviewTab />
        </TabsContent>

        <TabsContent value='tournaments'>
          {(() => {
            console.log(
              '🎯 Rendering tournaments tab with clubId:',
              clubProfile?.id
            );
            return (
              <AppProviders clubId={clubProfile?.id}>
                <ClubTournamentManagement clubId={clubProfile?.id || ''} />
              </AppProviders>
            );
          })()}
        </TabsContent>

        <TabsContent value='challenges'>
          <ClubChallengesTab clubId={clubProfile?.id || ''} />
        </TabsContent>

        <TabsContent value='verification'>
          <ClubRankVerificationTab />
        </TabsContent>

        <TabsContent value='members'>
          <ClubMembersAndNotifications />
        </TabsContent>

        <TabsContent value='settings'>
          <ClubSettingsTab />
        </TabsContent>
      </Tabs>
    </ClubResponsiveLayout>
  );
};

export default ClubManagementPage;
