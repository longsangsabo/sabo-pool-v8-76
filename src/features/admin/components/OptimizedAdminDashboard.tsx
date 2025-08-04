import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Trophy, Building2, BarChart3, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const OptimizedAdminDashboard: React.FC = () => {
  const { user, loading } = useAdminAuth();
  const {
    stats,
    recentActivity,
    isLoading: dashboardLoading,
    error,
  } = useAdminDashboard();

  if (loading || dashboardLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <p className='text-destructive mb-4'>Có lỗi xảy ra khi tải dữ liệu</p>
          <p className='text-sm text-muted-foreground'>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
        <p className='text-muted-foreground'>
          Chào mừng, {user?.user_metadata?.full_name || user?.email}
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng người dùng
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.total_users || 0}</div>
            <p className='text-xs text-muted-foreground'>
              {stats?.active_users || 0} hoạt động gần đây
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Giải đấu</CardTitle>
            <Trophy className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.tournaments_count || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {stats?.active_tournaments || 0} đang diễn ra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Câu lạc bộ</CardTitle>
            <Building2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats?.total_clubs || 0}</div>
            <p className='text-xs text-muted-foreground'>
              {stats?.pending_clubs || 0} chờ phê duyệt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Trận đấu</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats?.total_matches || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {stats?.completed_matches || 0} đã hoàn thành
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hoạt động gần đây</CardTitle>
          <CardDescription>
            Các sự kiện và hoạt động trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div
                  key={activity.id}
                  className='flex justify-between items-center py-2 border-b last:border-b-0'
                >
                  <div className='flex items-center gap-2'>
                    {activity.type === 'user_registration' && (
                      <Users className='h-4 w-4 text-blue-500' />
                    )}
                    {activity.type === 'tournament_created' && (
                      <Trophy className='h-4 w-4 text-yellow-500' />
                    )}
                    {activity.type === 'club_registration' && (
                      <Building2 className='h-4 w-4 text-green-500' />
                    )}
                    {activity.type === 'match_created' && (
                      <BarChart3 className='h-4 w-4 text-purple-500' />
                    )}
                    <span className='text-sm'>{activity.description}</span>
                  </div>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Clock className='h-3 w-3' />
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
              ))
            ) : (
              <div className='text-center py-4 text-muted-foreground'>
                Chưa có hoạt động nào
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedAdminDashboard;
