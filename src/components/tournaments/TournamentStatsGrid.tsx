import React from 'react';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';

interface TournamentStatsGridProps {
  totalTournaments: number;
  activeTournaments: number;
  userRegistrations: number;
}

export const TournamentStatsGrid: React.FC<TournamentStatsGridProps> = ({
  totalTournaments,
  activeTournaments,
  userRegistrations,
}) => {
  const stats = [
    {
      label: 'Tổng giải đấu',
      value: totalTournaments,
      icon: Trophy,
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue/10',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Đang diễn ra',
      value: activeTournaments,
      icon: TrendingUp,
      color: 'text-accent-green',
      bgColor: 'bg-accent-green/10',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Đã tham gia',
      value: userRegistrations,
      icon: Award,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: '+3',
      trendUp: true,
    },
  ];

  return (
    <div className='grid grid-cols-3 gap-3 px-4 mb-6'>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;

        return (
          <div
            key={index}
            className='social-card p-4 relative overflow-hidden animate-bounce-in'
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 ${stat.bgColor} opacity-50`} />

            {/* Content */}
            <div className='relative z-10 text-center'>
              <div
                className={`w-8 h-8 mx-auto mb-2 ${stat.bgColor} rounded-xl flex items-center justify-center`}
              >
                <IconComponent className={`h-4 w-4 ${stat.color}`} />
              </div>

              <div className={`stats-medium ${stat.color} mb-1`}>
                {stat.value}
              </div>

              <p className='body-xs text-muted-foreground mb-1 leading-tight'>
                {stat.label}
              </p>

              {/* Trend indicator */}
              <div
                className={`flex items-center justify-center text-xs ${stat.trendUp ? 'text-accent-green' : 'text-accent-red'}`}
              >
                <span className='font-medium'>{stat.trend}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
