import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Trophy, Users, Target } from 'lucide-react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProfileActivitiesProps {
  activities: any[];
  className?: string;
}

export const ProfileActivities: React.FC<ProfileActivitiesProps> = ({
  activities = [],
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'match':
        return Trophy;
      case 'challenge':
        return Target;
      case 'tournament':
        return Users;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (type === 'match') {
      return status === 'completed'
        ? 'bg-green-100 text-green-800'
        : 'bg-yellow-100 text-yellow-800';
    }
    if (type === 'challenge') {
      return status === 'accepted'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800';
    }
    return 'bg-purple-100 text-purple-800';
  };

  const formatActivityTitle = (activity: any) => {
    switch (activity.type) {
      case 'match':
        return `Trận đấu ${activity.status === 'completed' ? 'hoàn thành' : 'đang chờ'}`;
      case 'challenge':
        return `Thách đấu ${activity.status}`;
      case 'tournament':
        return `Giải đấu ${activity.status}`;
      default:
        return 'Hoạt động';
    }
  };

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className='py-8 text-center text-muted-foreground'>
          <Clock className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>Chưa có hoạt động nào gần đây</p>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className={`profile-activity-mobile ${className}`}>
        <h3 className='section-title'>Hoạt động gần đây</h3>
        <div className='activity-list'>
          {activities.slice(0, 3).map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={index} className='activity-item-simple'>
                <div className='activity-icon'>
                  <Icon className='w-4 h-4' />
                </div>
                <div className='activity-content'>
                  <p className='activity-text'>
                    {formatActivityTitle(activity)}
                  </p>
                  <span className='activity-time'>
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='w-5 h-5 text-primary' />
          Hoạt động gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {activities.slice(0, 8).map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div
                key={index}
                className='flex items-center gap-4 p-3 rounded-lg bg-muted/50'
              >
                <div className='p-2 rounded-full bg-background'>
                  <Icon className='w-5 h-5 text-muted-foreground' />
                </div>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='font-medium text-foreground'>
                      {formatActivityTitle(activity)}
                    </span>
                    <Badge
                      variant='secondary'
                      className={getActivityColor(
                        activity.type,
                        activity.status
                      )}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
