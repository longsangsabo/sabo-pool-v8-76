import React, { Suspense } from 'react';
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
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  History,
  Search,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton';
import { EnhancedWalletBalance } from '@/components/enhanced/EnhancedWalletBalance';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const OptimizedMobileDashboard = () => {
  const { user, loading } = useAuth();
  const { theme, setTheme } = useTheme();

  // Mock data - in real app this would come from APIs
  const walletData = {
    current: 2225,
    totalEarned: 4500,
    totalSpent: 2275,
    recentTransactions: [
      {
        id: 1,
        description: 'Thắng giải Tứ kết',
        amount: +150,
        date: '2 giờ trước',
        type: 'win',
      },
      {
        id: 2,
        description: 'Phí tham gia giải',
        amount: -50,
        date: '1 ngày trước',
        type: 'fee',
      },
    ],
  };

  const playerStats = [
    {
      title: 'ELO',
      value: '1,250',
      icon: Trophy,
      trend: '+15',
      color: 'text-yellow-600',
    },
    {
      title: 'Thắng',
      value: '45',
      icon: TrendingUp,
      trend: '+3',
      color: 'text-green-600',
    },
    {
      title: 'Thua',
      value: '12',
      icon: Target,
      trend: '+1',
      color: 'text-red-600',
    },
    {
      title: 'Hạng',
      value: '#15',
      icon: Activity,
      trend: '↑2',
      color: 'text-purple-600',
    },
  ];

  const quickActions = [
    {
      icon: Trophy,
      label: 'Giải đấu',
      route: '/tournaments',
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      isPrimary: true,
    },
    {
      icon: Users,
      label: 'Thách đấu',
      route: '/challenges',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      isPrimary: true,
    },
    {
      icon: Target,
      label: 'Ranking',
      route: '/leaderboard',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      isPrimary: false,
    },
    {
      icon: User,
      label: 'Hồ sơ',
      route: '/profile',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      isPrimary: false,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      title: 'Thắng trận thách đấu với Player123',
      time: '2 giờ',
      type: 'win',
    },
    {
      id: 2,
      title: 'Tham gia Giải Vô Địch Mùa Đông',
      time: '1 ngày',
      type: 'tournament',
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Bán kết Giải Vô Địch',
      date: '15/07',
      time: '19:00',
      canJoin: false,
    },
    {
      id: 2,
      title: 'Giải Phong Trào Cuối Tuần',
      date: '20/07',
      time: '14:00',
      canJoin: true,
    },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background via-background/95 to-secondary/20'>
      {/* Minimized Header - Height 40px */}
      <header className='sticky top-0 z-50 bg-card/90 backdrop-blur-sm border-b border-border/50 h-10'>
        <div className='flex items-center justify-between px-3 h-full'>
          {/* Compact Logo */}
          <div className='flex items-center space-x-1.5'>
            <div className='w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-md flex items-center justify-center'>
              <span className='text-black font-bold text-[10px]'>🎱</span>
            </div>
            <span className='font-black text-xs tracking-tight'>SABO</span>
          </div>

          {/* Minimal Right Actions */}
          <div className='flex items-center space-x-1'>
            <Button variant='ghost' size='sm' className='h-7 w-7 p-0 relative'>
              <Bell className='h-3.5 w-3.5' />
              <Badge
                className='absolute -top-0.5 -right-0.5 h-2.5 w-2.5 p-0 text-[7px]'
                variant='destructive'
              >
                2
              </Badge>
            </Button>
            <Avatar className='h-6 w-6'>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className='text-[10px]'>
                {user?.user_metadata?.full_name?.charAt(0) ||
                  user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='p-3 space-y-4'>
        {/* Welcome Section - Compact */}
        <div className='py-2'>
          <h1 className='text-lg font-bold text-foreground flex items-center gap-2'>
            <span>Chào mừng,</span>
            <span className='font-[family-name:var(--font-bebas)] text-xl text-primary'>
              {user?.user_metadata?.full_name || 'Bạn'}
            </span>
            <span className='text-xl'>👋</span>
          </h1>
        </div>

        {/* Optimized SPA Wallet Card */}
        <Card className='bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium text-muted-foreground'>
                Ví SPA Points
              </CardTitle>
              <Wallet className='h-4 w-4 text-primary' />
            </div>
          </CardHeader>
          <CardContent className='pt-0 space-y-3'>
            {/* Current Balance - Prominent */}
            <div className='text-center'>
              <div className='text-2xl font-racing font-bold text-primary mb-1'>
                {walletData.current.toLocaleString()}
              </div>
              <div className='text-xs text-muted-foreground'>SPA Points</div>
            </div>

            {/* Earned & Spent in one row */}
            <div className='flex justify-between text-xs'>
              <div className='flex items-center gap-1 text-green-600'>
                <ArrowUpCircle className='h-3 w-3' />
                <span>Đã kiếm: {walletData.totalEarned.toLocaleString()}</span>
              </div>
              <div className='flex items-center gap-1 text-red-600'>
                <ArrowDownCircle className='h-3 w-3' />
                <span>Đã chi: {walletData.totalSpent.toLocaleString()}</span>
              </div>
            </div>

            {/* Recent Transactions - Max 2 */}
            <div className='space-y-1'>
              {walletData.recentTransactions.slice(0, 2).map(transaction => (
                <div
                  key={transaction.id}
                  className='flex justify-between items-center text-xs bg-background/50 rounded px-2 py-1'
                >
                  <div className='flex-1 truncate'>
                    {transaction.description}
                  </div>
                  <div
                    className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className='flex gap-2'>
              <Button size='sm' className='flex-1'>
                <Plus className='h-3 w-3 mr-1' />
                Nạp điểm
              </Button>
              <Button variant='outline' size='sm' className='flex-1'>
                <History className='h-3 w-3 mr-1' />
                Lịch sử
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Player Stats - 2x2 Grid */}
        <div>
          <h3 className='text-sm font-semibold mb-2 text-muted-foreground'>
            Thống kê
          </h3>
          <div className='grid grid-cols-2 gap-2'>
            {playerStats.map(stat => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className='h-16'>
                  <CardContent className='p-3 flex items-center justify-between h-full'>
                    <div className='flex-1'>
                      <div
                        className={`text-lg font-racing font-bold ${stat.color}`}
                      >
                        {stat.value}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {stat.title}
                      </div>
                    </div>
                    <div className='flex flex-col items-end'>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                      <span className='text-xs text-green-600'>
                        {stat.trend}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions - 2x2 Grid with Primary Actions highlighted */}
        <div>
          <h3 className='text-sm font-semibold mb-2 text-muted-foreground'>
            Hành động nhanh
          </h3>
          <div className='grid grid-cols-2 gap-2'>
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link key={action.label} to={action.route}>
                  <Card
                    className={`h-20 transition-all hover:scale-105 ${action.isPrimary ? 'ring-2 ring-primary/20' : ''}`}
                  >
                    <CardContent className='p-3 text-center h-full flex flex-col justify-center'>
                      <div
                        className={`inline-flex p-2 rounded-lg ${action.color} mb-1 mx-auto`}
                      >
                        <Icon className='h-4 w-4 text-white' />
                      </div>
                      <div className='text-xs font-medium'>{action.label}</div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activities - Compact */}
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>
                Hoạt động gần đây
              </CardTitle>
              <Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
                Tất cả <ChevronRight className='h-3 w-3 ml-1' />
              </Button>
            </div>
          </CardHeader>
          <CardContent className='pt-0 space-y-2'>
            {recentActivities.slice(0, 2).map(activity => (
              <div
                key={activity.id}
                className='flex items-center gap-3 p-2 bg-secondary/30 rounded-lg'
              >
                <div
                  className={`w-2 h-2 rounded-full ${activity.type === 'win' ? 'bg-green-500' : 'bg-blue-500'}`}
                />
                <div className='flex-1 min-w-0'>
                  <div className='text-xs font-medium truncate'>
                    {activity.title}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {activity.time} trước
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events - Compact */}
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium'>
                Lịch sắp tới
              </CardTitle>
              <Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
                Tất cả <ChevronRight className='h-3 w-3 ml-1' />
              </Button>
            </div>
          </CardHeader>
          <CardContent className='pt-0 space-y-2'>
            {upcomingEvents.slice(0, 2).map(event => (
              <div
                key={event.id}
                className='flex items-center justify-between p-2 bg-secondary/30 rounded-lg'
              >
                <div className='flex-1 min-w-0'>
                  <div className='text-xs font-medium truncate'>
                    {event.title}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {event.date} • {event.time}
                  </div>
                </div>
                {event.canJoin && (
                  <Button size='sm' className='h-6 px-3 text-xs'>
                    Tham gia
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bottom spacing for mobile navigation */}
        <div className='h-20' />
      </main>
    </div>
  );
};

export default OptimizedMobileDashboard;
