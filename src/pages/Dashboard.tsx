
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/contexts/UserDataContext';
import { usePlayerDashboard } from '@/hooks/usePlayerDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { userProfile, isLoading } = useUserData();
  const { data: dashboardStats, isLoading: statsLoading, error } = usePlayerDashboard();

  console.log('Dashboard: Loading states:', { isLoading, statsLoading });
  console.log('Dashboard: User data:', { user: !!user, userProfile: !!userProfile });
  console.log('Dashboard: Stats data:', dashboardStats);
  console.log('Dashboard: Error:', error);

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-destructive mb-4">Có lỗi xảy ra khi tải dữ liệu dashboard</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm underline"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Chào mừng, {userProfile?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý hoạt động billiards của bạn tại đây
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trận đấu</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.matches_played || 0}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.matches_won || 0} thắng, {dashboardStats?.matches_lost || 0} thua
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ thắng</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.win_percentage || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.matches_won || 0}/{dashboardStats?.matches_played || 0} trận
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Giải đấu</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.tournaments_joined || 0}</div>
              <p className="text-xs text-muted-foreground">
                Đã tham gia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ranking</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{dashboardStats?.current_ranking || 1}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.spa_points || 0} SPA điểm
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Thách đấu chờ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.pending_challenges || 0}</div>
              <p className="text-xs text-muted-foreground">Cần xử lý</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Trận tuần này</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.matches_this_week || 0}</div>
              <p className="text-xs text-muted-foreground">Đã chơi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Giải đấu sắp tới</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats?.upcoming_tournaments || 0}</div>
              <p className="text-xs text-muted-foreground">Có thể tham gia</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Thách đấu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Thách đấu với người chơi khác
              </p>
              <Button asChild className="w-full">
                <Link to="/challenges">Tạo thách đấu</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Giải đấu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Tham gia giải đấu sắp tới
              </p>
              <Button asChild className="w-full">
                <Link to="/tournaments">Xem giải đấu</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Hồ sơ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Cập nhật thông tin cá nhân
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">Chỉnh sửa hồ sơ</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
