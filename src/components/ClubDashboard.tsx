import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Trophy, Users, Settings, GitBranch } from 'lucide-react';
import ClubProfileTab from './ClubProfileTab';
import RankRequestsTab from './RankRequestsTab';
import ClubChallengesTab from '../pages/challenges/components/tabs/ClubChallengesTab';
import ClubTournamentManagement from './club/ClubTournamentManagement';
import { useAuth } from '@/hooks/useAuth';
import { AppProviders } from '@/contexts/AppProviders';

interface ClubDashboardProps {
  onUpdate?: () => void;
}

const ClubDashboard = ({ onUpdate }: ClubDashboardProps) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  // Check if user is a club owner
  const isClubOwner = user?.id && profile?.clbVerified;

  return (
    <AppProviders clubId={profile?.club_id}>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>Quản lý CLB</h2>
          <p className='text-gray-600'>
            {isClubOwner
              ? 'Quản lý thông tin CLB và xử lý yêu cầu rank từ người dùng'
              : 'Đăng ký và quản lý thông tin CLB của bạn'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-2 lg:grid-cols-6'>
            <TabsTrigger value='profile' className='flex items-center gap-2'>
              <Building className='w-4 h-4' />
              Hồ sơ CLB
            </TabsTrigger>
            {isClubOwner && (
              <TabsTrigger
                value='rank-requests'
                className='flex items-center gap-2'
              >
                <Trophy className='w-4 h-4' />
                Yêu cầu Rank
              </TabsTrigger>
            )}
            {isClubOwner && (
              <TabsTrigger
                value='challenges'
                className='flex items-center gap-2'
              >
                <Trophy className='w-4 h-4' />
                Thách đấu
              </TabsTrigger>
            )}
            {isClubOwner && (
              <TabsTrigger
                value='tournaments'
                className='flex items-center gap-2'
              >
                <GitBranch className='w-4 h-4' />
                Giải đấu
              </TabsTrigger>
            )}
            <TabsTrigger value='members' className='flex items-center gap-2'>
              <Users className='w-4 h-4' />
              Thành viên
            </TabsTrigger>
            <TabsTrigger value='settings' className='flex items-center gap-2'>
              <Settings className='w-4 h-4' />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          <TabsContent value='profile' className='space-y-6'>
            <ClubProfileTab user={user} profile={profile} onUpdate={onUpdate} />
          </TabsContent>

          {isClubOwner && (
            <TabsContent value='rank-requests' className='space-y-6'>
              <RankRequestsTab clubId={profile?.club_id || ''} user={user} />
            </TabsContent>
          )}

          {isClubOwner && (
            <TabsContent value='challenges' className='space-y-6'>
              <ClubChallengesTab clubId={profile?.club_id || ''} />
            </TabsContent>
          )}

          {isClubOwner && (
            <TabsContent value='tournaments' className='space-y-6'>
              <ClubTournamentManagement clubId={profile?.club_id || ''} />
            </TabsContent>
          )}

          <TabsContent value='members' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='w-5 h-5' />
                  Thành viên CLB
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8 text-gray-500'>
                  <Users className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                  <p className='font-medium'>Tính năng đang phát triển</p>
                  <p className='text-sm mt-1'>
                    Quản lý thành viên CLB sẽ có sẵn trong phiên bản tiếp theo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='settings' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='w-5 h-5' />
                  Cài đặt CLB
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-8 text-gray-500'>
                  <Settings className='h-12 w-12 mx-auto mb-4 text-gray-400' />
                  <p className='font-medium'>Tính năng đang phát triển</p>
                  <p className='text-sm mt-1'>
                    Cài đặt CLB sẽ có sẵn trong phiên bản tiếp theo
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppProviders>
  );
};

export default ClubDashboard;
