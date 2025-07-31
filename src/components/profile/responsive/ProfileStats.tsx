
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, Users, Star, TrendingUp } from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

interface ProfileStatsProps {
  profile: any;
  className?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ profile, className = '' }) => {
  const { isMobile } = useOptimizedResponsive();

  const stats = [
    {
      title: 'Trận thắng',
      value: profile?.matches_won || 0,
      subtitle: `${profile?.matches_played || 0} trận đã chơi`,
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
    {
      title: 'Tỷ lệ thắng',
      value: `${profile?.win_percentage || 0}%`,
      subtitle: 'Hiệu suất',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Xếp hạng',
      value: profile?.current_ranking || 'N/A',
      subtitle: 'Vị trí hiện tại',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'SPA Points',
      value: profile?.spa_points || 0,
      subtitle: 'Điểm tích lũy',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      title: 'Giải đấu',
      value: profile?.tournaments_joined || 0,
      subtitle: 'Đã tham gia',
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  ];

  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-5';
  const statCards = isMobile ? stats.slice(0, 4) : stats;

  return (
    <div className={`grid ${gridCols} gap-4 ${className}`}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className={`${stat.bgColor} ${stat.borderColor} border`}>
            <CardContent className={`p-${isMobile ? '4' : '6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`text-${isMobile ? '2xl' : '3xl'} font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className={`text-${isMobile ? 'xs' : 'sm'} text-muted-foreground mt-1`}>
                    {stat.subtitle}
                  </div>
                  {!isMobile && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {stat.title}
                    </div>
                  )}
                </div>
                <div className={`p-${isMobile ? '2' : '3'} rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-${isMobile ? '4' : '6'} h-${isMobile ? '4' : '6'} ${stat.color}`} />
                </div>
              </div>
              {isMobile && (
                <div className="text-xs text-muted-foreground mt-2">
                  {stat.title}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
