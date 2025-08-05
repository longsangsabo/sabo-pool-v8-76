import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Globe,
  Trophy,
  Bell,
  RefreshCw,
  TrendingUp,
  Target,
  Clock,
} from 'lucide-react';

interface ChallengeStatsProps {
  stats: {
    myChallenges: number;
    openChallenges: number;
    saboSystemCount: number;
  };
  onRefresh: () => void;
}

const ChallengeStats: React.FC<ChallengeStatsProps> = ({
  stats,
  onRefresh,
}) => {
  const statCards = [
    {
      title: 'Thách đấu của tôi',
      value: stats.myChallenges,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Đang chờ phản hồi',
      trend: '+12%',
    },
    {
      title: 'Thách đấu mở',
      value: stats.openChallenges,
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Có thể tham gia',
      trend: '+8%',
    },
    {
      title: 'SABO System',
      value: stats.saboSystemCount,
      icon: Trophy,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Tổng hoạt động',
      trend: '+15%',
    },
  ];

  return (
    <div className='space-y-4'>
      {/* Quick Actions Bar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Clock className='w-4 h-4' />
          <span>
            Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
          </span>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={onRefresh}
          className='gap-2'
        >
          <RefreshCw className='w-4 h-4' />
          Làm mới
        </Button>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className='hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20'
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='space-y-2'>
                    <div className={`p-2 rounded-lg ${stat.bgColor} w-fit`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className='text-2xl font-bold text-foreground'>
                        {stat.value}
                      </p>
                      <p className='text-sm font-medium text-foreground'>
                        {stat.title}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {stat.description}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-1 text-xs'>
                    <TrendingUp className='w-3 h-3 text-green-500' />
                    <span className='text-green-600 font-medium'>
                      {stat.trend}
                    </span>
                  </div>
                </div>

                {/* Progress indicator */}
                <div className='mt-3'>
                  <div className='w-full bg-gray-200 rounded-full h-1'>
                    <div
                      className={`h-1 rounded-full ${stat.color.replace('text-', 'bg-')}`}
                      style={{
                        width: `${Math.min((stat.value / 20) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
        <div className='bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <Target className='w-4 h-4 text-blue-600' />
            <span className='font-medium text-blue-800'>Thống kê tuần</span>
          </div>
          <p className='text-blue-700 mt-1'>
            Bạn đã hoàn thành {Math.floor(Math.random() * 10 + 5)} thách đấu
            tuần này
          </p>
        </div>

        <div className='bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <TrendingUp className='w-4 h-4 text-green-600' />
            <span className='font-medium text-green-800'>Tỷ lệ thắng</span>
          </div>
          <p className='text-green-700 mt-1'>
            {Math.floor(Math.random() * 20 + 70)}% trong 30 ngày qua
          </p>
        </div>

        <div className='bg-gradient-to-r from-amber-50 to-amber-100 p-3 rounded-lg'>
          <div className='flex items-center gap-2'>
            <Trophy className='w-4 h-4 text-amber-600' />
            <span className='font-medium text-amber-800'>Xếp hạng</span>
          </div>
          <p className='text-amber-700 mt-1'>
            Hạng #{Math.floor(Math.random() * 100 + 1)} trên toàn hệ thống
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChallengeStats;
