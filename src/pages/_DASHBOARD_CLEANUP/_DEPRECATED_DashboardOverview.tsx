/**
 * @deprecated This file has been consolidated into DashboardPage.tsx
 *
 * Features from this file have been integrated into the main dashboard:
 * - Mobile-optimized horizontal scroll stats
 * - Recent activities section
 * - Upcoming schedule section
 * - Better responsive design patterns
 * - Welcome message with user name
 *
 * REMOVAL PLAN: This file will be deleted in 2-4 weeks (target: end of month)
 *
 * ACTION REQUIRED: None - all functionality has been moved to DashboardPage.tsx
 * Route redirects have been added in App.tsx: /dashboard-overview → /dashboard
 *
 * Last updated: January 2025
 */

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Trophy,
  Target,
  Users,
  TrendingUp,
  Calendar,
  Bell,
} from 'lucide-react';

const DashboardOverview = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Hạng hiện tại',
      value: 'K1',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Điểm ranking',
      value: '0',
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Trận đấu tháng này',
      value: '0',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Tỷ lệ thắng',
      value: '0%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const quickActions = [
    {
      icon: Trophy,
      label: 'Xem Ranking',
      color: 'bg-blue-600',
      route: '/ranking',
    },
    {
      icon: Calendar,
      label: 'Giải đấu',
      color: 'bg-green-600',
      route: '/tournaments',
    },
    {
      icon: Users,
      label: 'Thách đấu',
      color: 'bg-purple-600',
      route: '/challenges',
    },
    {
      icon: Target,
      label: 'Cập nhật hồ sơ',
      color: 'bg-orange-600',
      route: '/profile',
    },
  ];

  return (
    <div className='space-y-6 py-4'>
      {/* Welcome Message */}
      <div className='text-center mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Chào mừng, {user?.user_metadata?.full_name || 'Bạn'}! 👋
        </h2>
        <p className='text-gray-600'>Chúc bạn có một ngày thi đấu thành công</p>
      </div>

      {/* Stats Cards - Horizontal Scroll on Mobile */}
      <div className='overflow-x-auto pb-2'>
        <div className='flex space-x-4 min-w-max px-1'>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className='min-w-[150px] shadow-sm'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                  <div className='text-xl font-bold mb-1'>{stat.value}</div>
                  <div className='text-xs text-gray-600'>{stat.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle className='text-lg'>Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-4'>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className='flex flex-col items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors active:scale-95'
                  style={{ minHeight: '100px', minWidth: '44px' }}
                >
                  <div className={`p-3 rounded-full ${action.color} mb-3`}>
                    <Icon className='h-6 w-6 text-white' />
                  </div>
                  <span className='text-sm font-medium text-gray-900 text-center'>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Calendar className='h-5 w-5' />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center space-x-4 p-3 bg-gray-50 rounded-lg'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>Cập nhật hồ sơ thành công</p>
                <p className='text-xs text-gray-500'>2 giờ trước</p>
              </div>
            </div>
            <div className='flex items-center space-x-4 p-3 bg-gray-50 rounded-lg'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              <div className='flex-1'>
                <p className='text-sm font-medium'>
                  Tham gia hệ thống SABO POOL
                </p>
                <p className='text-xs text-gray-500'>1 ngày trước</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Schedule */}
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
            <p className='text-gray-500 font-medium'>Chưa có lịch thi đấu</p>
            <p className='text-sm text-gray-400 mt-1'>
              Đăng ký tham gia giải đấu để có lịch thi đấu
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
