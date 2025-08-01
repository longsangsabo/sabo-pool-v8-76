import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Swords,
  CalendarCheck,
  Video,
  TrendingDown,
} from 'lucide-react';

interface SPAPointsTrackerProps {
  totalPoints: number;
  pointsBreakdown: {
    tournament: number;
    challenge: number;
    checkin: number;
    video: number;
    decay: number;
  };
  dailyChallengeCount: number;
  recentEntries: Array<{
    id: string;
    source_type: 'tournament' | 'challenge' | 'checkin' | 'video' | 'decay';
    points_earned: number;
    description: string;
    created_at: string;
  }>;
}

export const SPAPointsTracker: React.FC<SPAPointsTrackerProps> = ({
  totalPoints,
  pointsBreakdown,
  dailyChallengeCount,
  recentEntries,
}) => {
  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'tournament':
        return <Trophy className='h-4 w-4' />;
      case 'challenge':
        return <Swords className='h-4 w-4' />;
      case 'checkin':
        return <CalendarCheck className='h-4 w-4' />;
      case 'video':
        return <Video className='h-4 w-4' />;
      case 'decay':
        return <TrendingDown className='h-4 w-4' />;
      default:
        return null;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'text-yellow-600 bg-yellow-100';
      case 'challenge':
        return 'text-red-600 bg-red-100';
      case 'checkin':
        return 'text-green-600 bg-green-100';
      case 'video':
        return 'text-blue-600 bg-blue-100';
      case 'decay':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSourceName = (type: string) => {
    switch (type) {
      case 'tournament':
        return 'Giải đấu';
      case 'challenge':
        return 'Thách đấu';
      case 'checkin':
        return 'Check-in';
      case 'video':
        return 'Video';
      case 'decay':
        return 'Giảm điểm';
      default:
        return type;
    }
  };

  const totalPositivePoints = Object.values(pointsBreakdown).reduce(
    (sum, points) => sum + Math.max(0, points),
    0
  );

  return (
    <div className='space-y-6'>
      {/* Total Points Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-yellow-600' />
            SPA Points Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center'>
            <div className='text-4xl font-bold text-primary mb-2'>
              {totalPoints.toLocaleString('vi-VN')}
            </div>
            <p className='text-muted-foreground'>Tổng SPA Points</p>
          </div>

          {/* Daily Challenge Limit */}
          <div className='mt-6 p-4 bg-muted rounded-lg'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm font-medium'>Thách đấu hôm nay</span>
              <span className='text-sm text-muted-foreground'>
                {dailyChallengeCount}/2
              </span>
            </div>
            <Progress value={(dailyChallengeCount / 2) * 100} className='h-2' />
            <p className='text-xs text-muted-foreground mt-1'>
              {dailyChallengeCount >= 2
                ? 'Đã đạt giới hạn - thách đấu tiếp theo chỉ nhận 30% điểm'
                : 'Còn lại để nhận 100% điểm'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Points Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Phân tích nguồn điểm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Object.entries(pointsBreakdown).map(([source, points]) => {
              if (points === 0) return null;

              const percentage =
                totalPositivePoints > 0
                  ? (Math.max(0, points) / totalPositivePoints) * 100
                  : 0;

              return (
                <div key={source} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span className={`p-1 rounded ${getSourceColor(source)}`}>
                        {getSourceIcon(source)}
                      </span>
                      <span className='font-medium'>
                        {getSourceName(source)}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${points >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {points >= 0 ? '+' : ''}
                      {points.toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {points > 0 && (
                    <Progress value={percentage} className='h-2' />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {recentEntries.slice(0, 5).map(entry => (
              <div
                key={entry.id}
                className='flex items-center justify-between p-3 rounded-lg border'
              >
                <div className='flex items-center gap-3'>
                  <span
                    className={`p-2 rounded ${getSourceColor(entry.source_type)}`}
                  >
                    {getSourceIcon(entry.source_type)}
                  </span>
                  <div>
                    <p className='font-medium text-sm'>{entry.description}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(entry.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${entry.points_earned >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {entry.points_earned >= 0 ? '+' : ''}
                  {entry.points_earned}
                </span>
              </div>
            ))}

            {recentEntries.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <Trophy className='h-12 w-12 mx-auto mb-3 opacity-50' />
                <p>Chưa có hoạt động nào</p>
                <p className='text-sm'>
                  Tham gia giải đấu hoặc thách đấu để bắt đầu kiếm SPA points!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
