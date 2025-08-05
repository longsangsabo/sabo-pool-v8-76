import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';

interface ArenaProfileStatsProps {
  profile: any;
  className?: string;
}

export const ArenaProfileStats: React.FC<ArenaProfileStatsProps> = ({
  profile,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();

  const stats = [
    {
      label: 'SPA Points',
      value: profile?.spa_points || 0,
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: 'Trận thắng',
      value: profile?.matches_won || 0,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Tỷ lệ thắng',
      value: `${profile?.win_percentage || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Xếp hạng',
      value: profile?.current_ranking || 'N/A',
      icon: Award,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
  ];

  if (isMobile) {
    return (
      <div className={`arena-stats-horizontal ${className}`}>
        <div className='stat-card-compact'>
          <div className='stat-icon'>🏆</div>
          <div className='stat-number'>{profile?.spa_points || 25}</div>
          <div className='stat-label'>SPA Points</div>
        </div>
        <div className='stat-card-compact'>
          <div className='stat-icon'>🎯</div>
          <div className='stat-number'>{profile?.matches_won || 0}</div>
          <div className='stat-label'>Trận thắng</div>
        </div>
        <div className='stat-card-compact'>
          <div className='stat-icon'>📊</div>
          <div className='stat-number'>{profile?.win_percentage || 0}%</div>
          <div className='stat-label'>Tỷ lệ thắng</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-primary'>Thống kê Arena</h2>
        <Badge variant='outline' className='border-primary/30 text-primary'>
          Cập nhật: {new Date().toLocaleDateString('vi-VN')}
        </Badge>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card
              key={index}
              className='bg-card/50 border-primary/20 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 hover:scale-105'
            >
              <CardContent className='p-6'>
                <div className='flex items-center space-x-4'>
                  <div
                    className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
                  >
                    <IconComponent className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <div className='text-3xl font-bold text-primary mb-1'>
                      {stat.value}
                    </div>
                    <div className='text-sm text-muted-foreground font-medium'>
                      {stat.label}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
