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

      <div className='min-h-screen bg-gray-50'>
        {/* Welcome Section */}
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
          <div className='container mx-auto px-4 py-8'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold mb-2'>
                  Chào mừng trở lại, {user?.user_metadata?.full_name || 'Player'}!
                </h1>
                <p className='text-blue-100'>
                  Sẵn sàng cho những trận đấu hôm nay?
                </p>
              </div>
              <div className='hidden md:block'>
                <Bell className='h-8 w-8 text-blue-200' />
              </div>
            </div>
          </div>
        </div>

        <div className='container mx-auto px-4 py-8 space-y-8'>
          {/* Player Stats */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Thống kê cá nhân
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {playerStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className='shadow-sm hover:shadow-md transition-shadow'
                  >
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                      <div className={`text-2xl font-bold mb-1 ${stat.color}`}>
                        {stat.value}
                      </div>
                      <div className='text-sm text-gray-600'>{stat.title}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Hành động nhanh
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.route}>
                    <Card className='group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500'>
                      <CardContent className='p-6'>
                        <div className='flex items-center space-x-4'>
                          <div
                            className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}
                          >
                            <Icon className='h-6 w-6 text-white' />
                          </div>
                          <div className='flex-1'>
                            <h3 className='font-semibold text-gray-900 group-hover:text-blue-600 transition-colors'>
                              {action.label}
                            </h3>
                            <p className='text-sm text-gray-600 mt-1'>
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
            <h2 className='text-2xl font-bold text-gray-900 mb-6'>
              Hoạt động gần đây
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5' />
                  Lịch sử hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-4 p-4 bg-gray-50 rounded-lg'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium'>
                        Hoàn thành trận đấu với Player123
                      </p>
                      <p className='text-xs text-gray-500'>2 giờ trước</p>
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
