import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Target, TrendingUp } from 'lucide-react';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_clubs: number;
  pending_clubs: number;
  tournaments_count: number;
  active_tournaments: number;
  total_matches: number;
  completed_matches: number;
  total_challenges: number;
  active_challenges: number;
}

interface StatsProps {
  dashboardType: 'admin' | 'club' | 'player';
  stats?: AdminStats | null;
}

export const DashboardStats: React.FC<StatsProps> = ({
  dashboardType,
  stats,
}) => {
  if (dashboardType === 'admin' && stats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng người dùng
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total_users}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.active_users} đang hoạt động
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>CLB</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total_clubs}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.pending_clubs} chờ duyệt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Giải đấu</CardTitle>
            <Trophy className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.tournaments_count}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.active_tournaments} đang diễn ra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Trận đấu</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total_matches}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.completed_matches} đã hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // For player/club dashboards, show different stats
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Hạng hiện tại</CardTitle>
          <Trophy className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>Amateur</div>
          <p className='text-xs text-muted-foreground'>
            +50 điểm để thăng hạng
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Trận đấu</CardTitle>
          <Target className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>12</div>
          <p className='text-xs text-muted-foreground'>8 thắng, 4 thua</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Điểm SPA</CardTitle>
          <TrendingUp className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>1,250</div>
          <p className='text-xs text-muted-foreground'>+150 tuần này</p>
        </CardContent>
      </Card>
    </div>
  );
};
