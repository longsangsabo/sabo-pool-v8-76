import React, { Suspense } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { Card } from '@/shared/components/ui/card';
import { Loader2, User, Settings, TrendingUp, Award } from 'lucide-react';

// Lazy load profile components
const UserProfilePage = React.lazy(() => import('@/pages/UserProfilePage'));
const UserSettingsPage = React.lazy(() => import('@/pages/UserSettingsPage'));
const UserStatsPage = React.lazy(() => import('@/pages/UserStatsPage'));

// Loading component
const TabLoadingSpinner = () => (
  <div className='flex items-center justify-center p-8'>
    <Loader2 className='h-8 w-8 animate-spin text-primary' />
    <span className='ml-2 text-muted-foreground'>Đang tải...</span>
  </div>
);

// Profile Overview component
const ProfileOverview = () => (
  <Card className='compact-card'>
    <div className='compact-card-content'>
      {/* User Info Section */}
      <div className='flex items-center space-x-3'>
        <div className='compact-avatar-lg bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
          <User className='h-6 w-6 md:h-8 md:w-8 text-white' />
        </div>
        <div>
          <h3 className='compact-title'>Tên người chơi</h3>
          <p className='compact-subtitle'>Thành viên từ 2024</p>
          <div className='flex items-center space-x-2 mt-1'>
            <Award className='h-3 w-3 md:h-4 md:w-4 text-yellow-500' />
            <span className='responsive-text-xs font-medium'>Hạng Pro</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='compact-grid compact-grid-cols-4'>
        <Card className='compact-card'>
          <div className='text-center'>
            <div className='responsive-text-lg font-bold text-green-500'>
              156
            </div>
            <div className='responsive-text-xs text-muted-foreground'>
              Trận thắng
            </div>
          </div>
        </Card>
        <Card className='compact-card'>
          <div className='text-center'>
            <div className='responsive-text-lg font-bold text-red-500'>43</div>
            <div className='responsive-text-xs text-muted-foreground'>
              Trận thua
            </div>
          </div>
        </Card>
        <Card className='compact-card'>
          <div className='text-center'>
            <div className='responsive-text-lg font-bold text-blue-500'>
              78%
            </div>
            <div className='responsive-text-xs text-muted-foreground'>
              Tỷ lệ thắng
            </div>
          </div>
        </Card>
        <Card className='compact-card'>
          <div className='text-center'>
            <div className='responsive-text-lg font-bold text-purple-500'>
              1,285
            </div>
            <div className='responsive-text-xs text-muted-foreground'>
              ELO Rating
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <div>
        <h4 className='compact-title mb-2'>Hoạt động gần đây</h4>
        <div className='space-y-2'>
          <Card className='compact-card'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='responsive-text-sm font-medium'>
                  Thắng Challenge vs ProPlayer123
                </div>
                <div className='responsive-text-xs text-muted-foreground'>
                  2 giờ trước
                </div>
              </div>
              <div className='responsive-text-xs text-green-500 font-medium'>
                +50K
              </div>
            </div>
          </Card>
          <Card className='compact-card'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='font-medium'>
                  Tham gia Tournament Spring Cup
                </div>
                <div className='text-sm text-muted-foreground'>
                  1 ngày trước
                </div>
              </div>
              <div className='text-sm text-blue-500 font-medium'>-10K phí</div>
            </div>
          </Card>
          <Card className='p-3'>
            <div className='flex justify-between items-center'>
              <div>
                <div className='font-medium'>Cập nhật hồ sơ</div>
                <div className='text-sm text-muted-foreground'>
                  3 ngày trước
                </div>
              </div>
              <div className='text-sm text-gray-500 font-medium'>Hoạt động</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </Card>
);

// Achievements component
const Achievements = () => (
  <Card className='p-6'>
    <div className='space-y-4'>
      <div className='flex items-center space-x-2'>
        <Award className='h-5 w-5 text-yellow-500' />
        <h3 className='text-lg font-semibold'>Thành tích & Huy hiệu</h3>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        <Card className='p-4 text-center'>
          <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2'>
            <Award className='h-6 w-6 text-yellow-600' />
          </div>
          <div className='font-medium'>First Win</div>
          <div className='text-sm text-muted-foreground'>
            Chiến thắng đầu tiên
          </div>
        </Card>
        <Card className='p-4 text-center'>
          <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2'>
            <TrendingUp className='h-6 w-6 text-blue-600' />
          </div>
          <div className='font-medium'>Win Streak</div>
          <div className='text-sm text-muted-foreground'>
            10 thắng liên tiếp
          </div>
        </Card>
        <Card className='p-4 text-center opacity-50'>
          <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2'>
            <Award className='h-6 w-6 text-gray-400' />
          </div>
          <div className='font-medium'>Tournament Master</div>
          <div className='text-sm text-muted-foreground'>Chưa đạt được</div>
        </Card>
      </div>
    </div>
  </Card>
);

const PlayerProfileHub: React.FC = () => {
  return (
    <div className='compact-container compact-layout desktop-high-density'>
      {/* Header */}
      <div className='flex items-center space-x-2 mb-4 md:mb-6'>
        <User className='h-6 w-6 md:h-8 md:w-8 text-blue-500' />
        <div>
          <h1 className='compact-title'>Hồ sơ người chơi</h1>
          <p className='compact-subtitle'>
            Quản lý thông tin cá nhân, thống kê và cài đặt tài khoản
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-5 h-9 md:h-10'>
          <TabsTrigger
            value='overview'
            className='compact-nav-item flex items-center space-x-1'
          >
            <User className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Tổng quan
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='profile'
            className='compact-nav-item flex items-center space-x-1'
          >
            <User className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>Hồ sơ</span>
          </TabsTrigger>
          <TabsTrigger
            value='stats'
            className='compact-nav-item flex items-center space-x-1'
          >
            <TrendingUp className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Thống kê
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='achievements'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Award className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>
              Thành tích
            </span>
          </TabsTrigger>
          <TabsTrigger
            value='settings'
            className='compact-nav-item flex items-center space-x-1'
          >
            <Settings className='h-3 w-3 md:h-4 md:w-4' />
            <span className='hidden sm:inline responsive-text-xs'>Cài đặt</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value='overview' className='mt-3 md:mt-6 mobile-compact'>
          <ProfileOverview />
        </TabsContent>

        <TabsContent value='profile' className='mt-3 md:mt-6 mobile-compact'>
          <Suspense fallback={<TabLoadingSpinner />}>
            <UserProfilePage />
          </Suspense>
        </TabsContent>

        <TabsContent value='stats' className='mt-3 md:mt-6 mobile-compact'>
          <Suspense fallback={<TabLoadingSpinner />}>
            <UserStatsPage />
          </Suspense>
        </TabsContent>

        <TabsContent
          value='achievements'
          className='mt-3 md:mt-6 mobile-compact'
        >
          <Achievements />
        </TabsContent>

        <TabsContent value='settings' className='mt-3 md:mt-6 mobile-compact'>
          <Suspense fallback={<TabLoadingSpinner />}>
            <UserSettingsPage />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlayerProfileHub;
