import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trophy, Users, Target, Calendar } from 'lucide-react';

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

interface RecentActivityProps {
  dashboardType: 'admin' | 'club' | 'player';
  activities: RecentActivity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  dashboardType,
  activities,
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className='h-4 w-4 text-blue-500' />;
      case 'tournament_created':
        return <Trophy className='h-4 w-4 text-yellow-500' />;
      case 'club_registration':
        return <Users className='h-4 w-4 text-green-500' />;
      case 'match_created':
        return <Target className='h-4 w-4 text-purple-500' />;
      case 'challenge_accepted':
        return <Target className='h-4 w-4 text-orange-500' />;
      case 'tournament_joined':
        return <Trophy className='h-4 w-4 text-blue-500' />;
      default:
        return <Calendar className='h-4 w-4 text-gray-500' />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Badge variant='secondary'>Người dùng mới</Badge>;
      case 'tournament_created':
        return <Badge variant='default'>Giải đấu</Badge>;
      case 'club_registration':
        return <Badge variant='outline'>CLB mới</Badge>;
      case 'match_created':
        return <Badge variant='secondary'>Trận đấu</Badge>;
      case 'challenge_accepted':
        return <Badge variant='default'>Thách đấu</Badge>;
      case 'tournament_joined':
        return <Badge variant='outline'>Tham gia</Badge>;
      default:
        return <Badge variant='secondary'>Hoạt động</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {activities.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Chưa có hoạt động nào
            </p>
          ) : (
            activities.map(activity => (
              <div
                key={activity.id}
                className='flex items-center gap-3 p-3 rounded-lg border'
              >
                {getActivityIcon(activity.type)}
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>
                    {activity.description}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </p>
                </div>
                {getActivityBadge(activity.type)}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
