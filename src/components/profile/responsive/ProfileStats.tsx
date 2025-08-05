import React from 'react';
import { TechStatCard } from '@/components/ui/sabo-tech-global';
import { Trophy, Target, Users, Star, TrendingUp } from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';

interface ProfileStatsProps {
  profile: any;
  className?: string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  profile,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();

  const stats = [
    {
      title: 'SPA Points',
      value: profile?.spa_points || 0,
      subtitle: 'Điểm',
      icon: <Star />,
      variant: 'primary' as const,
    },
    {
      title: 'Trận thắng',
      value: profile?.matches_won || 0,
      subtitle: 'Thắng',
      icon: <Trophy />,
      variant: 'success' as const,
    },
    {
      title: 'Tỷ lệ thắng',
      value: `${profile?.win_percentage || 0}%`,
      subtitle: 'Tỷ lệ',
      icon: <TrendingUp />,
      variant: 'primary' as const,
    },
  ];

  if (isMobile) {
    return (
      <div className={`profile-stats-horizontal ${className}`}>
        {stats.map((stat, index) => (
          <div key={index} className='stat-card-compact'>
            <div className='stat-number'>{stat.value}</div>
            <div className='stat-label'>{stat.subtitle}</div>
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
      icon: <Target />,
      variant: 'warning' as const,
    },
    {
      title: 'Giải đấu',
      value: profile?.tournaments_joined || 0,
      subtitle: 'Đã tham gia',
      icon: <Users />,
      variant: 'primary' as const,
    },
  ];

  return (
    <div className={`grid grid-cols-5 gap-4 ${className}`}>
      {allStats.map((stat, index) => (
        <TechStatCard
          key={index}
          label={stat.subtitle}
          value={stat.value}
          icon={stat.icon}
          variant={stat.variant}
        />
      ))}
    </div>
  );
};
