import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Users, Star } from 'lucide-react';

interface ProfileStatsProps {
  userProfile: any;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ userProfile }) => {
  const stats = [
    {
      title: 'Thành tích',
      value: userProfile?.wins || 0,
      subtitle: 'Trận thắng',
      icon: Trophy,
      bgClass:
        'bg-gradient-to-br from-accent-green/10 to-accent-green/20 dark:from-accent-green/20 dark:to-accent-green/30',
      iconClass: 'text-accent-green dark:text-accent-green',
      textClass: 'text-accent-green dark:text-accent-green',
      borderClass: 'border-accent-green/20 dark:border-accent-green/30',
    },
    {
      title: 'ELO Rating',
      value: userProfile?.elo || 1000,
      subtitle: 'Điểm xếp hạng',
      icon: Target,
      bgClass:
        'bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30',
      iconClass: 'text-primary dark:text-primary',
      textClass: 'text-primary dark:text-primary',
      borderClass: 'border-primary/20 dark:border-primary/30',
    },
    {
      title: 'Tournaments',
      value: userProfile?.tournaments_joined || 0,
      subtitle: 'Giải đã tham gia',
      icon: Users,
      bgClass:
        'bg-gradient-to-br from-accent-purple/10 to-accent-purple/20 dark:from-accent-purple/20 dark:to-accent-purple/30',
      iconClass: 'text-accent-purple dark:text-accent-purple',
      textClass: 'text-accent-purple dark:text-accent-purple',
      borderClass: 'border-accent-purple/20 dark:border-accent-purple/30',
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className={`${stat.bgClass} ${stat.borderClass} border bg-card dark:bg-card`}
          >
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className={`text-2xl font-bold ${stat.textClass}`}>
                    {stat.value}
                  </div>
                  <div className='text-sm text-muted-foreground dark:text-muted-foreground'>
                    {stat.subtitle}
                  </div>
                </div>
                <div
                  className={`p-3 rounded-full bg-background/50 dark:bg-background/50`}
                >
                  <Icon className={`w-6 h-6 ${stat.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
