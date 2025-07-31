
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
      title: 'SPA Points',
      value: profile?.spa_points || 0,
      subtitle: 'Điểm',
    },
    {
      title: 'Trận thắng',
      value: profile?.matches_won || 0,
      subtitle: 'Thắng',
    },
    {
      title: 'Tỷ lệ thắng',
      value: `${profile?.win_percentage || 0}%`,
      subtitle: 'Tỷ lệ',
    },
  ];

  if (isMobile) {
    return (
      <div className={`profile-stats-mobile ${className}`}>
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <span className="stat-number">{stat.value}</span>
            <span className="stat-label">{stat.subtitle}</span>
          </div>
        ))}
      </div>
    );
  }

  const allStats = [
    ...stats,
    {
      title: 'Xếp hạng',
      value: profile?.current_ranking || 'N/A',
      subtitle: 'Vị trí hiện tại',
    },
    {
      title: 'Giải đấu',
      value: profile?.tournaments_joined || 0,
      subtitle: 'Đã tham gia',
    },
  ];

  return (
    <div className={`grid grid-cols-5 gap-4 ${className}`}>
      {allStats.map((stat, index) => {
        return (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.subtitle}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {stat.title}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
