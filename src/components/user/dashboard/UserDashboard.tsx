import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Trophy,
  Target,
  Users,
  Calendar,
  TrendingUp,
  Bell,
  Activity,
  User,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      icon: User,
      label: 'Cập nhật hồ sơ',
      color: 'bg-blue-600',
      route: '/profile',
      description: 'Hoàn thiện thông tin cá nhân',
    },
    {
      icon: Trophy,
      label: 'Xem Ranking',
      color: 'bg-green-600',
      route: '/ranking',
      description: 'Xem bảng xếp hạng toàn hệ thống',
    },
    {
      icon: Calendar,
      label: 'Giải đấu',
      color: 'bg-purple-600',
      route: '/tournaments',
      description: 'Tham gia các giải đấu hấp dẫn',
    },
    {
      icon: Users,
      label: 'Thách đấu',
      color: 'bg-orange-600',
      route: '/challenges',
      description: 'Tạo hoặc nhận thách đấu',
    },
  ];

  const playerStats = [
    {
      title: 'ELO Rating',
      value: '1,250',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Trận thắng',
      value: '24',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Thành tích',
      value: '75%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Hoạt động',
      value: '12',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard - SABO Pool Arena</title>
        <meta
          name='description'
          content='Dashboard cá nhân - theo dõi thống kê và hoạt động của bạn'
        />
      </Helmet>

      <div className='min-h-screen bg-background'>
        {/* Welcome Section */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg mb-4'>
          <div className='compact-container py-4 md:py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='compact-title text-white mb-2'>
                  Chào mừng trở lại, {user?.user_metadata?.full_name || 'Player'}!
                </h1>
                <p className='text-blue-100 responsive-text-sm'>
                  Sẵn sàng cho những trận đấu hôm nay?
                </p>
              </div>
              <div className='hidden md:block'>
                <Bell className='h-6 w-6 md:h-8 md:w-8 text-blue-200' />
              </div>
            </div>
          </div>
        </div>

        <div className='compact-container space-y-4 md:space-y-6'>
          {/* Player Stats */}
          <div>
            <h2 className='compact-title text-foreground mb-3 md:mb-4'>
              Thống kê cá nhân
            </h2>
            <div className='compact-grid compact-grid-cols-4'>
              {playerStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className='compact-card shadow-sm hover:shadow-md transition-shadow'
                  >
                    <CardContent className='compact-card-content'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.color}`} />
                        </div>
                      </div>
                      <div className={`responsive-text-lg font-bold mb-1 ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className='responsive-text-xs text-muted-foreground'>{stat.title}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className='compact-title text-foreground mb-3 md:mb-4'>
              Hành động nhanh
            </h2>
            <div className='compact-grid compact-grid-cols-4'>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.route}>
                    <Card className='compact-card group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500'>
                      <CardContent className='compact-card-content'>
                        <div className='flex items-center space-x-2 md:space-x-3'>
                          <div
                            className={`p-2 md:p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}
                          >
                            <Icon className='h-4 w-4 md:h-6 md:w-6 text-white' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <h3 className='responsive-text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors truncate'>
                              {action.label}
                            </h3>
                            <p className='responsive-text-xs text-muted-foreground mt-1 hidden md:block'>
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className='compact-title text-foreground mb-3 md:mb-4'>
              Hoạt động gần đây
            </h2>
            <Card className='compact-card'>
              <CardHeader className='compact-card-header'>
                <CardTitle className='flex items-center gap-2 responsive-text-base'>
                  <Activity className='h-4 w-4 md:h-5 md:w-5' />
                  Lịch sử hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent className='compact-card-content'>
                <div className='space-y-2 md:space-y-3'>
                  <div className='flex items-center space-x-3 p-2 md:p-3 bg-muted/50 rounded-lg'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <div className='flex-1 min-w-0'>
                      <p className='responsive-text-sm font-medium'>
                        Hoàn thành trận đấu với Player123
                      </p>
                      <p className='responsive-text-xs text-muted-foreground'>2 giờ trước</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4 p-4 bg-gray-50 rounded-lg'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>
                        Tham gia giải đấu Tournament ABC
                      </p>
                      <p className='text-xs text-gray-500'>1 ngày trước</p>
                    </div>
                  </div>
                  <div className='flex items-center space-x-4 p-4 bg-gray-50 rounded-lg'>
                    <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>
                        Cập nhật hồ sơ cá nhân
                      </p>
                      <p className='text-xs text-gray-500'>3 ngày trước</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;
