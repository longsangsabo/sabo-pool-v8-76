import React, { Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Trophy,
  Target,
  Users,
  TrendingUp,
  Calendar,
  Bell,
  Activity,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton';
import { EnhancedWalletBalance } from '@/components/enhanced/EnhancedWalletBalance';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';

const DashboardPage = () => {
  const { user, signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  // Enhanced stats with real data from Dashboard.tsx
  const playerStats = [
    {
      title: 'ELO Rating',
      value: '1,250',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Xếp hạng hiện tại',
    },
    {
      title: 'Trận thắng',
      value: '45',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Tổng số trận thắng',
    },
    {
      title: 'Trận thua',
      value: '12',
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Tổng số trận thua',
    },
    {
      title: 'Xếp hạng',
      value: '#15',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Thứ hạng toàn hệ thống',
    },
  ];

  // Quick actions from DashboardOverview.tsx
  const quickActions = [
    {
      icon: Trophy,
      label: 'Xem Ranking',
      color: 'bg-blue-600',
      route: '/ranking',
      description: 'Xem bảng xếp hạng toàn hệ thống',
    },
    {
      icon: Calendar,
      label: 'Giải đấu',
      color: 'bg-green-600',
      route: '/tournaments',
      description: 'Tham gia các giải đấu hấp dẫn',
    },
    {
      icon: Users,
      label: 'Thách đấu',
      color: 'bg-purple-600',
      route: '/challenges',
      description: 'Tạo hoặc nhận thách đấu',
    },
    {
      icon: Target,
      label: 'Cập nhật hồ sơ',
      color: 'bg-orange-600',
      route: '/profile',
      description: 'Hoàn thiện thông tin cá nhân',
    },
  ];

  // Recent activities from DashboardOverview.tsx
  const recentActivities = [
    {
      id: 1,
      title: 'Cập nhật hồ sơ thành công',
      time: '2 giờ trước',
      type: 'success',
      color: 'bg-green-500',
    },
    {
      id: 2,
      title: 'Tham gia hệ thống SABO POOL',
      time: '1 ngày trước',
      type: 'info',
      color: 'bg-blue-500',
    },
  ];

  // Show skeleton while loading
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className='animate-fade-in'>
      {/* Main Content */}
      <div className='py-8'>
        {/* Welcome Message - Enhanced from DashboardOverview.tsx */}
        <div className='text-center mb-8 animate-fade-in'>
          <h2 className='text-3xl font-bold text-gray-900 mb-2'>
            Chào mừng, {user?.user_metadata?.full_name || 'Bạn'}! 👋
          </h2>
          <p className='text-gray-600'>
            Chúc bạn có một ngày thi đấu thành công
          </p>
        </div>

        {/* Wallet Balance - From original DashboardPage.tsx */}
        <div
          className='mb-8 animate-fade-in'
          style={{ animationDelay: '100ms' }}
        >
          <Suspense fallback={<DashboardSkeleton />}>
            <EnhancedWalletBalance />
          </Suspense>
        </div>

        {/* Player Stats - Enhanced from Dashboard.tsx + DashboardOverview.tsx mobile design */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Thông số người chơi
          </h3>
          {/* Desktop View */}
          <div className='hidden md:grid md:grid-cols-4 gap-6'>
            {playerStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.title}
                  className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-slide-in-up'
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mobile View - Horizontal Scroll from DashboardOverview.tsx */}
          <div className='md:hidden overflow-x-auto pb-2'>
            <div className='flex space-x-4 min-w-max px-1'>
              {playerStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className='min-w-[150px] shadow-sm animate-slide-in-up'
                    style={{ animationDelay: `${index * 100 + 200}ms` }}
                  >
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                      </div>
                      <div className={`text-xl font-bold mb-1 ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className='text-xs text-gray-600'>{stat.title}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions - Enhanced from all dashboard versions */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            Hành động nhanh
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.route}
                  className='block animate-slide-in-up'
                  style={{ animationDelay: `${index * 100 + 400}ms` }}
                >
                  <Card className='transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer'>
                    <CardContent className='p-6 text-center'>
                      <div
                        className={`inline-flex p-3 rounded-full ${action.color} mb-3`}
                      >
                        <Icon className='h-6 w-6 text-white' />
                      </div>
                      <h4 className='font-medium text-gray-900 mb-1'>
                        {action.label}
                      </h4>
                      <p className='text-xs text-gray-500'>
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activities - From DashboardOverview.tsx */}
        <div
          className='mb-8 animate-fade-in'
          style={{ animationDelay: '600ms' }}
        >
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Calendar className='h-5 w-5' />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className='flex items-center space-x-4 p-3 bg-gray-50 rounded-lg'
                  >
                    <div
                      className={`w-2 h-2 ${activity.color} rounded-full`}
                    ></div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>{activity.title}</p>
                      <p className='text-xs text-gray-500'>{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Schedule - From DashboardOverview.tsx */}
        <div className='animate-fade-in' style={{ animationDelay: '700ms' }}>
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-lg'>
                <Bell className='h-5 w-5' />
                Lịch sắp tới
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <Calendar className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500 font-medium'>
                  Chưa có lịch thi đấu
                </p>
                <p className='text-sm text-gray-400 mt-1'>
                  Đăng ký tham gia giải đấu để có lịch thi đấu
                </p>
                <Link to='/tournaments'>
                  <Button className='mt-4' variant='outline'>
                    Xem giải đấu
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
