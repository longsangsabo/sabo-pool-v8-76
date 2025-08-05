import React, { useState } from 'react';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Users,
  Trophy,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
} from 'lucide-react';

const AdminAnalytics = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  if (adminLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-foreground mb-4'>
            {t('common.access_denied')}
          </h2>
          <p className='text-muted-foreground'>{t('common.no_permission')}</p>
        </div>
      </div>
    );
  }

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalUsers: 1247,
      userGrowth: 12.5,
      activeUsers: 834,
      activeTournaments: 15,
      totalRevenue: 45000000,
      revenueGrowth: 8.2,
    },
    userMetrics: {
      newUsers: 87,
      retentionRate: 76.3,
      avgSessionTime: '24m 18s',
      bounceRate: 23.4,
    },
    tournamentMetrics: {
      totalTournaments: 156,
      completedTournaments: 142,
      avgParticipants: 24.8,
      prizePool: 125000000,
    },
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            Analytics Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Phân tích chi tiết về hiệu suất hệ thống và người dùng
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' className='gap-2'>
            <RefreshCw className='h-4 w-4' />
            Làm mới
          </Button>
          <Button variant='outline' size='sm' className='gap-2'>
            <Download className='h-4 w-4' />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview' className='gap-2'>
            <BarChart3 className='h-4 w-4' />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value='users' className='gap-2'>
            <Users className='h-4 w-4' />
            Người dùng
          </TabsTrigger>
          <TabsTrigger value='tournaments' className='gap-2'>
            <Trophy className='h-4 w-4' />
            Giải đấu
          </TabsTrigger>
          <TabsTrigger value='revenue' className='gap-2'>
            <DollarSign className='h-4 w-4' />
            Doanh thu
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          {/* Key Metrics */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Tổng người dùng
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {analyticsData.overview.totalUsers.toLocaleString()}
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <TrendingUp className='h-3 w-3 text-green-500' />+
                  {analyticsData.overview.userGrowth}% từ tháng trước
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Người dùng hoạt động
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {analyticsData.overview.activeUsers.toLocaleString()}
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Badge variant='secondary' className='text-xs'>
                    {Math.round(
                      (analyticsData.overview.activeUsers /
                        analyticsData.overview.totalUsers) *
                        100
                    )}
                    % tỷ lệ hoạt động
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Giải đấu đang diễn ra
                </CardTitle>
                <Trophy className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {analyticsData.overview.activeTournaments}
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Calendar className='h-3 w-3' />
                  Tuần này
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Doanh thu</CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(analyticsData.overview.totalRevenue)}
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <TrendingUp className='h-3 w-3 text-green-500' />+
                  {analyticsData.overview.revenueGrowth}% từ tháng trước
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Xu hướng người dùng
                </CardTitle>
                <CardDescription>
                  Biểu đồ tăng trưởng người dùng theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center bg-muted/20 rounded-lg'>
                  <div className='text-center'>
                    <BarChart3 className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                    <p className='text-sm text-muted-foreground'>
                      Biểu đồ tăng trưởng người dùng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PieChart className='h-5 w-5' />
                  Phân bố người dùng
                </CardTitle>
                <CardDescription>
                  Phân bố theo loại thành viên và trình độ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center bg-muted/20 rounded-lg'>
                  <div className='text-center'>
                    <PieChart className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                    <p className='text-sm text-muted-foreground'>
                      Biểu đồ phân bố người dùng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='users' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Phân tích người dùng chi tiết</CardTitle>
              <CardDescription>
                Thống kê chi tiết về hoạt động và hành vi người dùng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='bg-muted/20 p-4 rounded-lg'>
                    <div className='text-sm text-muted-foreground'>
                      Người dùng mới
                    </div>
                    <div className='text-2xl font-bold text-green-600'>
                      {analyticsData.userMetrics.newUsers}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Tuần này
                    </div>
                  </div>
                  <div className='bg-muted/20 p-4 rounded-lg'>
                    <div className='text-sm text-muted-foreground'>
                      Tỷ lệ giữ chân
                    </div>
                    <div className='text-2xl font-bold text-blue-600'>
                      {analyticsData.userMetrics.retentionRate}%
                    </div>
                    <div className='text-xs text-muted-foreground'>30 ngày</div>
                  </div>
                  <div className='bg-muted/20 p-4 rounded-lg'>
                    <div className='text-sm text-muted-foreground'>
                      Thời gian trung bình
                    </div>
                    <div className='text-2xl font-bold text-purple-600'>
                      {analyticsData.userMetrics.avgSessionTime}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Mỗi phiên
                    </div>
                  </div>
                  <div className='bg-muted/20 p-4 rounded-lg'>
                    <div className='text-sm text-muted-foreground'>
                      Tỷ lệ thoát
                    </div>
                    <div className='text-2xl font-bold text-orange-600'>
                      {analyticsData.userMetrics.bounceRate}%
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Trang đầu
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='tournaments' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Phân tích giải đấu</CardTitle>
              <CardDescription>
                Thống kê về các giải đấu và sự tham gia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='bg-muted/20 p-4 rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    Tổng giải đấu
                  </div>
                  <div className='text-2xl font-bold text-blue-600'>
                    {analyticsData.tournamentMetrics.totalTournaments}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Tất cả thời gian
                  </div>
                </div>
                <div className='bg-muted/20 p-4 rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    Đã hoàn thành
                  </div>
                  <div className='text-2xl font-bold text-green-600'>
                    {analyticsData.tournamentMetrics.completedTournaments}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Thành công
                  </div>
                </div>
                <div className='bg-muted/20 p-4 rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    TB người tham gia
                  </div>
                  <div className='text-2xl font-bold text-purple-600'>
                    {analyticsData.tournamentMetrics.avgParticipants}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Mỗi giải đấu
                  </div>
                </div>
                <div className='bg-muted/20 p-4 rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    Tổng giải thưởng
                  </div>
                  <div className='text-2xl font-bold text-yellow-600'>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(analyticsData.tournamentMetrics.prizePool)}
                  </div>
                  <div className='text-xs text-muted-foreground'>Đã phát</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='revenue' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Phân tích doanh thu</CardTitle>
              <CardDescription>
                Báo cáo chi tiết về doanh thu và giao dịch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-64 flex items-center justify-center bg-muted/20 rounded-lg'>
                <div className='text-center'>
                  <DollarSign className='h-12 w-12 text-muted-foreground mx-auto mb-2' />
                  <p className='text-sm text-muted-foreground'>
                    Báo cáo doanh thu chi tiết
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Tính năng đang được phát triển
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
