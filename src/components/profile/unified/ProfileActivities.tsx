import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ChevronRight,
  Trophy,
  Star,
  Users,
  Calendar,
  Clock,
  Zap,
  Target,
  Award,
  TrendingUp,
  Gift,
} from 'lucide-react';
import { useRecentActivities } from '@/hooks/profile';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProfileActivitiesProps {
  userId?: string;
  profile?: any; // Add profile prop for fallback
  variant?: 'mobile' | 'desktop';
  arenaMode?: boolean;
  className?: string;
}

export const ProfileActivities: React.FC<ProfileActivitiesProps> = ({
  userId,
  profile, // Add profile prop
  variant = 'mobile',
  arenaMode = false,
  className = '',
}) => {
  const { activities, isLoading } = useRecentActivities(userId, 10);

  // Use new activities if available, fallback to profile recent_activities
  const displayActivities =
    activities.length > 0 ? activities : profile?.recent_activities || [];

  const getActivityIcon = (activity: any) => {
    const type = activity.activity_type || activity.type;
    switch (type) {
      case 'match':
        return Trophy;
      case 'achievement':
        return Award;
      case 'rank_change':
        return TrendingUp;
      case 'tournament':
        return Users;
      case 'spa_points':
        return Zap;
      case 'challenge':
        return Target;
      case 'club':
        return Users;
      case 'social':
        return Gift;
      default:
        return Activity;
    }
  };

  const getActivityColor = (activity: any) => {
    const type = activity.activity_type || activity.type;
    if (arenaMode) {
      return 'bg-slate-700/50 border-slate-600/50';
    }

    switch (type) {
      case 'match':
        return 'bg-blue-50 border-blue-200';
      case 'achievement':
        return 'bg-yellow-50 border-yellow-200';
      case 'rank_change':
        return 'bg-purple-50 border-purple-200';
      case 'tournament':
        return 'bg-green-50 border-green-200';
      case 'spa_points':
        return 'bg-orange-50 border-orange-200';
      case 'challenge':
        return 'bg-red-50 border-red-200';
      case 'club':
        return 'bg-indigo-50 border-indigo-200';
      case 'social':
        return 'bg-pink-50 border-pink-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActivityIconColor = (activity: any) => {
    const type = activity.activity_type || activity.type;
    if (arenaMode) {
      return 'text-cyan-400';
    }

    switch (type) {
      case 'match':
        return 'text-blue-600';
      case 'achievement':
        return 'text-yellow-600';
      case 'rank_change':
        return 'text-purple-600';
      case 'tournament':
        return 'text-green-600';
      case 'spa_points':
        return 'text-orange-600';
      case 'challenge':
        return 'text-red-600';
      case 'club':
        return 'text-indigo-600';
      case 'social':
        return 'text-pink-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return 'Vừa xong';
    }
  };

  const getActivityBadge = (activity: any) => {
    if (
      activity.activity_type === 'spa_points' &&
      activity.metadata?.points_change
    ) {
      const points = activity.metadata.points_change;
      return (
        <Badge
          variant={points > 0 ? 'default' : 'destructive'}
          className='text-xs'
        >
          {points > 0 ? '+' : ''}
          {points} điểm
        </Badge>
      );
    }

    if (
      activity.activity_type === 'match' &&
      activity.metadata?.is_winner !== undefined
    ) {
      return (
        <Badge
          variant={activity.metadata.is_winner ? 'default' : 'secondary'}
          className='text-xs'
        >
          {activity.metadata.is_winner ? 'Thắng' : 'Thua'}{' '}
          {activity.metadata.score_me || '0'}-
          {activity.metadata.score_opponent || '0'}
        </Badge>
      );
    }

    if (
      activity.activity_type === 'rank_change' &&
      activity.metadata?.new_rank
    ) {
      return (
        <Badge variant='outline' className='text-xs'>
          #{activity.metadata.new_rank}
        </Badge>
      );
    }

    if (
      activity.activity_type === 'achievement' &&
      activity.metadata?.spa_points_earned
    ) {
      return (
        <Badge variant='secondary' className='text-xs'>
          +{activity.metadata.spa_points_earned} SPA
        </Badge>
      );
    }

    return null;
  };

  if (isLoading && displayActivities.length === 0) {
    return (
      <Card
        className={`${arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : ''} ${className}`}
      >
        <CardHeader className='pb-3'>
          <CardTitle
            className={`text-base font-epilogue ${arenaMode ? 'text-cyan-300' : ''}`}
          >
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-3 p-3 rounded-lg border bg-muted/50'
            >
              <div className='w-8 h-8 rounded-full bg-muted animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-3 bg-muted animate-pulse rounded w-3/4' />
                <div className='h-2 bg-muted animate-pulse rounded w-1/2' />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'mobile') {
    return (
      <Card
        className={`${arenaMode ? 'bg-slate-800/50 border-cyan-500/30' : ''} ${className}`}
      >
        <CardHeader className='pb-3'>
          <CardTitle
            className={`text-base font-epilogue flex items-center justify-between ${arenaMode ? 'text-cyan-300' : ''}`}
          >
            Hoạt động gần đây
            {activities.length > 3 && (
              <Button variant='ghost' size='sm' className='text-xs h-6 px-2'>
                Xem tất cả <ChevronRight className='w-3 h-3 ml-1' />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-4 pt-0 space-y-3'>
          {displayActivities.slice(0, 3).map(activity => {
            const Icon = getActivityIcon(activity);
            const activityColor = getActivityColor(activity);
            const iconColor = getActivityIconColor(activity);
            const badge = getActivityBadge(activity);

            return (
              <div
                key={activity.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${activityColor}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${arenaMode ? 'bg-slate-600' : 'bg-white'} flex-shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className='flex-1 min-w-0'>
                  <div
                    className={`text-sm font-medium truncate ${arenaMode ? 'text-cyan-300' : ''}`}
                  >
                    {activity.title ||
                      (activity.type === 'match' ? 'Trận đấu' : 'Hoạt động')}
                  </div>
                  {(activity.description || activity.type) && (
                    <div
                      className={`text-xs truncate ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
                    >
                      {activity.description ||
                        `${activity.type === 'match' ? 'Kết quả trận đấu' : 'Hoạt động mới'}`}
                    </div>
                  )}
                  <div className='flex items-center gap-2 mt-1'>
                    <div
                      className={`text-xs ${arenaMode ? 'text-slate-500' : 'text-muted-foreground'}`}
                    >
                      {activity.created_at
                        ? formatRelativeTime(activity.created_at)
                        : 'Vừa xong'}
                    </div>
                    {getActivityBadge(activity)}
                  </div>
                </div>
              </div>
            );
          })}

          {displayActivities.length === 0 && (
            <div className='text-center py-6'>
              <Activity
                className={`w-8 h-8 mx-auto mb-2 ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
              />
              <p
                className={`text-sm ${arenaMode ? 'text-slate-400' : 'text-muted-foreground'}`}
              >
                Chưa có hoạt động nào
              </p>
              <p
                className={`text-xs ${arenaMode ? 'text-slate-500' : 'text-muted-foreground'} mt-1`}
              >
                Hãy tham gia trận đấu đầu tiên!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Desktop variant - More detailed
  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Activity className='w-4 h-4' />
            Hoạt động gần đây
          </div>
          {activities.length > 5 && (
            <Button variant='ghost' size='sm' className='text-xs h-6 px-2'>
              Xem tất cả <ChevronRight className='w-3 h-3 ml-1' />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {activities.slice(0, 5).map(activity => {
          const Icon = getActivityIcon(activity.activity_type);
          const activityColor = getActivityColor(activity.activity_type);
          const iconColor = getActivityIconColor(activity.activity_type);
          const badge = getActivityBadge(activity);

          return (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${activityColor}`}
            >
              <div className='w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0'>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium'>{activity.title}</div>
                {activity.description && (
                  <div className='text-xs text-muted-foreground'>
                    {activity.description}
                  </div>
                )}
                <div className='flex items-center gap-2 mt-2'>
                  <div className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    {formatRelativeTime(activity.created_at)}
                  </div>
                  {badge}
                  {activity.importance_level > 3 && (
                    <Badge variant='outline' className='text-xs'>
                      Quan trọng
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className='text-center py-8'>
            <Activity className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <p className='text-sm text-muted-foreground'>
              Chưa có hoạt động nào
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              Hãy tham gia trận đấu đầu tiên!
            </p>
            <Button variant='outline' size='sm' className='mt-4'>
              <Target className='w-4 h-4 mr-2' />
              Tìm trận đấu
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
