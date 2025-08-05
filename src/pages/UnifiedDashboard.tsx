import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedDashboard } from '@/hooks/useUnifiedDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

// Import existing dashboard content for specific roles
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import MobileStoryReel from '@/components/mobile/cards/MobileStoryReel';
import MobileFeedCard from '@/components/mobile/cards/MobileFeedCard';
import MobileFloatingActionButton from '@/components/mobile/common/MobileFloatingActionButton';
import { RankingDashboard } from '@/components/ranking/RankingDashboard';

// Simple Dashboard content for guests
const GuestDashboard = () => (
  <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900'>
    <header className='bg-green-800 border-b border-green-700'>
      <div className='container mx-auto px-4 py-4'>
        <div className='flex items-center space-x-3'>
          <div className='w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center'>
            <span className='text-2xl'>🎱</span>
          </div>
          <div>
            <h1 className='text-xl font-bold text-yellow-400'>
              SABO Pool Arena
            </h1>
            <p className='text-green-200 text-sm'>
              Chào mừng bạn đến với trang chủ
            </p>
          </div>
        </div>
      </div>
    </header>

    <main className='container mx-auto px-4 py-8'>
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-white mb-4'>
          Chào Mừng Đến SABO Pool Arena
        </h2>
        <p className='text-green-200 mb-6'>
          Hệ thống quản lý và đặt bàn bi-a hiện đại, chuyên nghiệp
        </p>
      </div>

      <QuickActions dashboardType='guest' />
    </main>
  </div>
);

const UnifiedDashboard = () => {
  const dashboard = useUnifiedDashboard();

  if (dashboard.isLoading) {
    return (
      <div className='p-6 space-y-6'>
        <Skeleton className='h-8 w-64' />
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
          <Skeleton className='h-32' />
        </div>
        <Skeleton className='h-64' />
      </div>
    );
  }

  // Guest dashboard - no authentication required
  if (dashboard.dashboardType === 'guest') {
    return (
      <>
        <Helmet>
          <title>SABO Pool Arena - Trang chủ</title>
          <meta
            name='description'
            content='Hệ thống quản lý và đặt bàn billiards chuyên nghiệp'
          />
        </Helmet>
        <GuestDashboard />
      </>
    );
  }

  // Admin dashboard - full admin interface
  if (dashboard.dashboardType === 'admin') {
    return (
      <>
        <Helmet>
          <title>SABO Arena - Admin Dashboard</title>
          <meta
            name='description'
            content='Bảng điều khiển quản trị viên SABO Arena'
          />
        </Helmet>

        <div className='p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold'>Dashboard Quản trị</h1>
          </div>

          <DashboardStats dashboardType='admin' stats={dashboard.stats} />

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2'>
              <AdminDashboard />
            </div>
            <div className='space-y-6'>
              <QuickActions dashboardType='admin' />
              <RecentActivity
                dashboardType='admin'
                activities={dashboard.recentActivity || []}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Club dashboard - club management features
  if (dashboard.dashboardType === 'club') {
    return (
      <>
        <Helmet>
          <title>SABO Arena - Club Dashboard</title>
          <meta name='description' content='Bảng điều khiển quản lý CLB' />
        </Helmet>

        <div className='p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold'>Dashboard CLB</h1>
          </div>

          <DashboardStats dashboardType='club' />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <QuickActions dashboardType='club' />
            <RecentActivity dashboardType='club' activities={[]} />
          </div>
        </div>
      </>
    );
  }

  // Player dashboard - social feed + ranking
  if (dashboard.dashboardType === 'player') {
    return (
      <>
        <Helmet>
          <title>SABO Arena - Dashboard</title>
          <meta
            name='description'
            content='Theo dõi hoạt động và thống kê của bạn'
          />
        </Helmet>

        <div className='space-y-6'>
          {/* Player Stats */}
          <div className='p-4'>
            <DashboardStats dashboardType='player' />
          </div>

          {/* Quick Actions */}
          <div className='px-4'>
            <QuickActions dashboardType='player' />
          </div>

          {/* Ranking Dashboard */}
          <div className='px-4'>
            <RankingDashboard playerId={dashboard.user?.id} />
          </div>

          {/* Social Feed */}
          <div className='px-4'>
            <h2 className='text-xl font-bold mb-4'>Hoạt động cộng đồng</h2>
            <MobileStoryReel stories={dashboard.stories || []} />

            <div className='space-y-4 mt-4'>
              {dashboard.feedPosts?.map(post => (
                <MobileFeedCard
                  key={post.id}
                  post={post}
                  onLike={() => {}}
                  onComment={() => {}}
                  onShare={() => {}}
                  onAction={() => {}}
                />
              ))}
            </div>
          </div>

          <MobileFloatingActionButton primaryAction={() => {}} />
        </div>
      </>
    );
  }

  return null;
};

export default UnifiedDashboard;
