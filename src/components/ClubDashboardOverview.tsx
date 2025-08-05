import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Trophy,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Wifi,
  RefreshCw,
} from 'lucide-react';
import { useClubDashboard } from '@/hooks/useClubDashboard';

const ClubDashboardOverview = () => {
  const { data, loading, error, refreshData } = useClubDashboard();

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className='pt-6'>
                <div className='animate-pulse'>
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                  <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='text-center py-8'>
            <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
            <p className='text-red-600 font-medium'>Lỗi kết nối database</p>
            <p className='text-sm text-muted-foreground mt-1'>{error}</p>
            <Button onClick={refreshData} className='mt-4'>
              <RefreshCw className='w-4 h-4 mr-2' />
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return 'text-green-500';
      case 'disconnected':
      case 'inactive':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className='w-4 h-4' />;
      case 'disconnected':
      case 'inactive':
        return <Clock className='w-4 h-4' />;
      case 'error':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Database className='w-4 h-4' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Database className='w-5 h-5' />
              Trạng thái hệ thống
            </div>
            <Button variant='outline' size='sm' onClick={refreshData}>
              <RefreshCw className='w-4 h-4 mr-2' />
              Làm mới
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3'>
              <div
                className={`flex items-center gap-2 ${getStatusColor(data.systemStatus.database)}`}
              >
                {getStatusIcon(data.systemStatus.database)}
                <span className='font-medium'>Database</span>
              </div>
              <Badge
                variant={
                  data.systemStatus.database === 'connected'
                    ? 'default'
                    : 'destructive'
                }
              >
                {data.systemStatus.database === 'connected' ? 'Kết nối' : 'Lỗi'}
              </Badge>
            </div>

            <div className='flex items-center gap-3'>
              <div
                className={`flex items-center gap-2 ${getStatusColor(data.systemStatus.realtime)}`}
              >
                <Wifi className='w-4 h-4' />
                <span className='font-medium'>Realtime</span>
              </div>
              <Badge
                variant={
                  data.systemStatus.realtime === 'active'
                    ? 'default'
                    : 'secondary'
                }
              >
                {data.systemStatus.realtime === 'active'
                  ? 'Hoạt động'
                  : 'Tạm dừng'}
              </Badge>
            </div>

            <div className='flex items-center gap-3'>
              <Clock className='w-4 h-4 text-muted-foreground' />
              <span className='text-sm text-muted-foreground'>
                Cập nhật:{' '}
                {data.systemStatus.lastUpdate.toLocaleTimeString('vi-VN')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Stats Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <Card className='ultra-compact-stats-card'>
          <CardContent className='p-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  Thành viên
                </p>
                <p className='text-xl font-bold'>{data.memberStats.total}</p>
                <p className='text-xs text-green-600'>
                  +{data.memberStats.thisMonth}
                </p>
              </div>
              <Users className='h-8 w-8 text-muted-foreground' />
            </div>
            <Badge variant='secondary' className='text-xs mt-1 px-1 py-0'>
              {data.memberStats.verified} xác thực
            </Badge>
          </CardContent>
        </Card>

        <Card className='ultra-compact-stats-card'>
          <CardContent className='p-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  Trận đấu
                </p>
                <p className='text-xl font-bold'>{data.matchStats.total}</p>
                <p className='text-xs text-blue-600'>
                  +{data.matchStats.thisWeek}
                </p>
              </div>
              <Trophy className='h-8 w-8 text-muted-foreground' />
            </div>
            <Badge variant='outline' className='text-xs mt-1 px-1 py-0'>
              {data.matchStats.thisMonth} tháng này
            </Badge>
          </CardContent>
        </Card>

        <Card className='ultra-compact-stats-card'>
          <CardContent className='p-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  Giải đấu
                </p>
                <p className='text-xl font-bold'>
                  {data.tournamentStats.hosted}
                </p>
                <p className='text-xs text-muted-foreground'>Đã tổ chức</p>
              </div>
              <Calendar className='h-8 w-8 text-muted-foreground' />
            </div>
            <Badge variant='default' className='text-xs mt-1 px-1 py-0'>
              {data.tournamentStats.upcoming} sắp tới
            </Badge>
          </CardContent>
        </Card>

        <Card className='ultra-compact-stats-card'>
          <CardContent className='p-3'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>
                  Tin cậy
                </p>
                <p className='text-xl font-bold text-yellow-600'>
                  {data.trustScore.toFixed(1)}%
                </p>
                <p className='text-xs text-muted-foreground'>Đánh giá</p>
              </div>
              <TrendingUp className='h-8 w-8 text-muted-foreground' />
            </div>
            <Badge
              variant={
                data.trustScore >= 90
                  ? 'default'
                  : data.trustScore >= 75
                    ? 'secondary'
                    : 'destructive'
              }
              className='text-xs mt-1 px-1 py-0'
            >
              {data.trustScore >= 90
                ? 'Xuất sắc'
                : data.trustScore >= 75
                  ? 'Tốt'
                  : 'Cần cải thiện'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Compact Quick Actions & Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Compact Pending Verifications */}
        <Card className='ultra-compact-content-card'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <AlertCircle className='w-4 h-4 text-orange-500' />
              Yêu cầu xác thực ({data.pendingVerifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            {data.pendingVerifications.length === 0 ? (
              <p className='text-muted-foreground text-center py-2 text-sm'>
                Không có yêu cầu nào đang chờ xử lý
              </p>
            ) : (
              <div className='space-y-2'>
                {data.pendingVerifications.slice(0, 3).map(verification => (
                  <div
                    key={verification.id}
                    className='flex items-center justify-between p-2 border rounded-md text-sm'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium truncate'>
                        {verification.profiles?.display_name ||
                          verification.profiles?.full_name ||
                          'Người chơi'}
                      </p>
                      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <span>🏆 {verification.requested_rank}</span>
                        <span>📞 {verification.profiles?.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <Badge variant='outline' className='text-xs px-1 py-0'>
                      {new Date(verification.created_at).toLocaleDateString(
                        'vi-VN',
                        { month: 'short', day: 'numeric' }
                      )}
                    </Badge>
                  </div>
                ))}
                {data.pendingVerifications.length > 3 && (
                  <p className='text-xs text-muted-foreground text-center'>
                    +{data.pendingVerifications.length - 3} yêu cầu khác
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compact Recent Notifications */}
        <Card className='ultra-compact-content-card'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <CheckCircle className='w-4 h-4 text-blue-500' />
              Thông báo gần đây
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            {data.recentNotifications.length === 0 ? (
              <p className='text-muted-foreground text-center py-2 text-sm'>
                Chưa có thông báo nào
              </p>
            ) : (
              <div className='space-y-2'>
                {data.recentNotifications.slice(0, 3).map(notification => (
                  <div
                    key={notification.id}
                    className='flex items-start gap-2 p-2 border rounded-md'
                  >
                    <div className='flex-1 min-w-0'>
                      <p className='font-medium text-sm truncate'>
                        {notification.title}
                      </p>
                      <p className='text-xs text-muted-foreground line-clamp-2'>
                        {notification.message}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {new Date(notification.created_at).toLocaleDateString(
                          'vi-VN',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1'></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClubDashboardOverview;
