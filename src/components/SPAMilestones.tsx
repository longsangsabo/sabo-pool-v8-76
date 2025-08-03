import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Target,
  Clock,
  Award,
  Loader2,
  Users,
  Star,
} from 'lucide-react';
import { useSPAMilestones } from '@/hooks/useSPAMilestones';

export function SPAMilestones() {
  const { milestones, isLoading, completedCount, totalRewards } =
    useSPAMilestones();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Cột mốc SPA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin' />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIconForMilestoneType = (type: string) => {
    switch (type) {
      case 'matches_played':
        return <Target className='h-3 w-3' />;
      case 'tournaments_joined':
        return <Trophy className='h-3 w-3' />;
      case 'win_rate':
        return <Award className='h-3 w-3' />;
      case 'spa_points':
        return <Star className='h-3 w-3' />;
      case 'challenges_won':
        return <Users className='h-3 w-3' />;
      case 'win_streak':
        return <Clock className='h-3 w-3' />;
      default:
        return <Award className='h-3 w-3' />;
    }
  };

  const getProgressText = (milestone: any) => {
    switch (milestone.milestone.milestone_type) {
      case 'matches_played':
        return `${milestone.progress}/${milestone.maxProgress} trận`;
      case 'tournaments_joined':
        return `${milestone.progress}/${milestone.maxProgress} giải`;
      case 'win_rate':
        return milestone.progress >= milestone.maxProgress
          ? 'Đã đạt 50% tỷ lệ thắng'
          : 'Chưa đạt 50% tỷ lệ thắng';
      case 'spa_points':
        return `${milestone.progress}/${milestone.maxProgress} SPA`;
      case 'challenges_won':
        return `${milestone.progress}/${milestone.maxProgress} thách đấu`;
      case 'win_streak':
        return `${milestone.progress}/${milestone.maxProgress} trận liên tiếp`;
      default:
        return `${milestone.progress}/${milestone.maxProgress}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Cột mốc SPA
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary' className='flex items-center gap-1'>
              <Trophy className='h-3 w-3' />
              {completedCount}/{milestones.length}
            </Badge>
            <Badge variant='outline' className='flex items-center gap-1'>
              <Star className='h-3 w-3' />+{totalRewards} SPA
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {milestones.map(milestone => (
            <div key={milestone.milestone.id} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`p-1 rounded-full ${
                      milestone.completed
                        ? 'bg-accent-green/20 text-accent-green'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {getIconForMilestoneType(
                      milestone.milestone.milestone_type
                    )}
                  </div>
                  <div>
                    <p className='text-sm font-medium'>
                      {milestone.milestone.milestone_name}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {getProgressText(milestone)}
                    </p>
                  </div>
                </div>
                <div className='text-right'>
                  {milestone.completed ? (
                    <Badge className='bg-accent-green/20 text-accent-green border-accent-green/30'>
                      +{milestone.milestone.spa_reward} SPA
                    </Badge>
                  ) : (
                    <Badge variant='outline'>
                      +{milestone.milestone.spa_reward} SPA
                    </Badge>
                  )}
                </div>
              </div>

              {!milestone.completed && (
                <Progress
                  value={(milestone.progress / milestone.maxProgress) * 100}
                  className='h-2'
                />
              )}
            </div>
          ))}

          {completedCount === 0 && (
            <div className='text-center py-4 text-muted-foreground'>
              <Award className='h-8 w-8 mx-auto mb-2 opacity-50' />
              <p className='text-sm'>Chưa đạt được cột mốc nào</p>
              <p className='text-xs'>Hãy chơi thêm để mở khóa thành tựu!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SPAMilestones;
