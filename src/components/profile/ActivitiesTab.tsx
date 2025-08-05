import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Gamepad2,
  History,
  Calendar,
  Trophy,
  Users,
  Target,
  Swords,
  MessageCircle,
} from 'lucide-react';
import MyChallengesTab from '@/components/MyChallengesTab';
import SPAMilestones from '@/components/SPAMilestones';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { usePlayerActivityStats } from '@/hooks/usePlayerActivityStats';

const ActivitiesTab = () => {
  const { isMobile } = useOptimizedResponsive();
  const navigate = useNavigate();
  const { data: activityStats, isLoading } = usePlayerActivityStats();

  const quickStats = [
    {
      title: 'Thách đấu đang chờ',
      value: activityStats?.pending_challenges || 0,
      icon: Gamepad2,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Trận đấu tuần này',
      value: activityStats?.matches_this_week || 0,
      icon: History,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Giải đấu sắp tới',
      value: activityStats?.upcoming_tournaments || 0,
      icon: Calendar,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-bold text-foreground mb-2'>
          Thách đấu & Hoạt động
        </h2>
        <p className='text-muted-foreground mb-4'>
          Quản lý các thách đấu và theo dõi lịch sử hoạt động của bạn
        </p>

        {/* Quick Navigation */}
        <div className='flex gap-3 mb-6'>
          <Button
            onClick={() => navigate('/challenges')}
            className='flex items-center gap-2'
            variant='default'
          >
            <Swords className='w-4 h-4' />
            Thách đấu
          </Button>
          <Button
            onClick={() => navigate('/community')}
            className='flex items-center gap-2'
            variant='outline'
          >
            <MessageCircle className='w-4 h-4' />
            Bạn bè
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}>
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={stat.bg}>
              <CardContent className='pt-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      {stat.title}
                    </p>
                    <p className='text-3xl font-bold text-foreground'>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Challenges Component */}
      <MyChallengesTab />

      {/* SPA Milestones */}
      <SPAMilestones />
    </div>
  );
};

export default ActivitiesTab;
