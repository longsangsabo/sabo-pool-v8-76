import React from 'react';
import { useOptimizedResponsive } from '@/hooks/useOptimizedResponsive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Gamepad2,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
  type LucideIcon,
} from 'lucide-react';

interface ArenaActivitiesProps {
  activities: any[];
  className?: string;
}

const getActivityIcon = (type: string): LucideIcon | typeof Clock => {
  switch (type) {
    case 'match':
      return Gamepad2;
    case 'challenge':
      return Users;
    case 'tournament':
      return Trophy;
    default:
      return Clock;
  }
};

const getActivityColor = (type: string, status?: string): string => {
  if (status === 'completed')
    return 'bg-green-400/20 text-green-400 border-green-400/30';
  if (status === 'cancelled')
    return 'bg-red-400/20 text-red-400 border-red-400/30';
  if (status === 'pending')
    return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';

  switch (type) {
    case 'match':
      return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
    case 'challenge':
      return 'bg-purple-400/20 text-purple-400 border-purple-400/30';
    case 'tournament':
      return 'bg-orange-400/20 text-orange-400 border-orange-400/30';
    default:
      return 'bg-gray-400/20 text-gray-400 border-gray-400/30';
  }
};

const formatActivityTitle = (activity: any): string => {
  if (activity.type === 'match') {
    return `Trận đấu ${activity.status === 'completed' ? 'đã hoàn thành' : 'đang diễn ra'}`;
  }
  if (activity.type === 'challenge') {
    return `Thách đấu ${activity.status === 'pending' ? 'đang chờ' : activity.status}`;
  }
  if (activity.type === 'tournament') {
    return `Giải đấu ${activity.status}`;
  }
  return 'Hoạt động';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'cancelled':
      return XCircle;
    case 'pending':
      return Clock3;
    default:
      return Clock;
  }
};

export const ArenaActivities: React.FC<ArenaActivitiesProps> = ({
  activities,
  className = '',
}) => {
  const { isMobile } = useOptimizedResponsive();

  if (!activities || activities.length === 0) {
    return (
      <Card
        className={`bg-card/30 border-primary/20 backdrop-blur-sm ${className}`}
      >
        <CardHeader>
          <CardTitle className='text-primary'>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center py-8'>
            <Clock className='w-12 h-12 mx-auto mb-4 text-muted-foreground/50' />
            <p className='text-muted-foreground'>
              Chưa có hoạt động nào gần đây
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isMobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className='text-lg font-semibold text-primary mb-4'>
          Hoạt động gần đây
        </h3>
        <div className='space-y-2'>
          {activities.slice(0, 3).map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type);
            const StatusIcon = getStatusIcon(activity.status);
            return (
              <Card
                key={index}
                className='bg-card/30 border-primary/20 backdrop-blur-sm hover:bg-card/50 transition-all duration-300'
              >
                <CardContent className='p-4'>
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`w-10 h-10 rounded-full ${getActivityColor(activity.type).split(' ')[0]} flex items-center justify-center`}
                    >
                      <IconComponent className='w-5 h-5' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <p className='text-sm font-medium text-primary truncate'>
                          {formatActivityTitle(activity)}
                        </p>
                        <StatusIcon className='w-4 h-4 text-muted-foreground ml-2' />
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`bg-card/30 border-primary/20 backdrop-blur-sm ${className}`}
    >
      <CardHeader>
        <CardTitle className='text-primary'>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {activities.slice(0, 8).map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type);
            const StatusIcon = getStatusIcon(activity.status);
            return (
              <div
                key={index}
                className='flex items-center space-x-3 p-3 rounded-lg bg-card/20 border border-primary/10 hover:bg-card/40 hover:border-primary/20 transition-all duration-300'
              >
                <div
                  className={`w-10 h-10 rounded-full ${getActivityColor(activity.type).split(' ')[0]} flex items-center justify-center`}
                >
                  <IconComponent className='w-5 h-5' />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <p className='text-sm font-medium text-primary'>
                      {formatActivityTitle(activity)}
                    </p>
                    <div className='flex items-center space-x-2'>
                      <Badge
                        variant='outline'
                        className={`text-xs ${getActivityColor(activity.type, activity.status)}`}
                      >
                        {activity.status}
                      </Badge>
                      <StatusIcon className='w-4 h-4 text-muted-foreground' />
                    </div>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
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
