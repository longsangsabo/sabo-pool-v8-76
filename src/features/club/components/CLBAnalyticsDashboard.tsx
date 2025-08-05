import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Trophy,
  Target,
  Clock,
  Calendar,
  Eye,
  Download,
  Filter,
  RefreshCw,
  Activity,
  Star,
  Award,
  Zap,
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    total_today: number;
    total_week: number;
    total_month: number;
    growth_rate: number;
  };
  members: {
    total: number;
    new_this_week: number;
    active_today: number;
    retention_rate: number;
    rank_distribution: {
      beginner: number;
      intermediate: number;
      advanced: number;
      professional: number;
      master: number;
    };
  };
  tables: {
    utilization_rate: number;
    peak_hours: string[];
    revenue_per_table: number[];
    booking_efficiency: number;
  };
  tournaments: {
    completed_this_month: number;
    participants_total: number;
    average_prize_pool: number;
    completion_rate: number;
  };
  challenges: {
    completed_today: number;
    completed_week: number;
    success_rate: number;
    average_stake: number;
  };
}

export const CLBAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);

  // Mock analytics data
  const analytics: AnalyticsData = {
    revenue: {
      daily: [1200000, 1350000, 980000, 1450000, 1680000, 1920000, 2100000],
      weekly: [8500000, 9200000, 8800000, 10200000],
      monthly: [35000000, 38000000, 42000000],
      total_today: 2100000,
      total_week: 10200000,
      total_month: 42000000,
      growth_rate: 15.3,
    },
    members: {
      total: 256,
      new_this_week: 12,
      active_today: 48,
      retention_rate: 87.5,
      rank_distribution: {
        beginner: 45,
        intermediate: 35,
        advanced: 15,
        professional: 4,
        master: 1,
      },
    },
    tables: {
      utilization_rate: 78.5,
      peak_hours: ['19:00-22:00', '14:00-17:00'],
      revenue_per_table: [850000, 620000, 480000, 290000],
      booking_efficiency: 92.3,
    },
    tournaments: {
      completed_this_month: 8,
      participants_total: 124,
      average_prize_pool: 1250000,
      completion_rate: 95.5,
    },
    challenges: {
      completed_today: 6,
      completed_week: 28,
      success_rate: 88.9,
      average_stake: 75000,
    },
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const RevenueChart = () => (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='flex items-center gap-2'>
          <DollarSign className='h-5 w-5' />
          Doanh thu theo thời gian
        </CardTitle>
        <div className='flex items-center gap-2'>
          <Badge
            variant={
              analytics.revenue.growth_rate > 0 ? 'default' : 'destructive'
            }
          >
            {analytics.revenue.growth_rate > 0 ? (
              <TrendingUp className='h-3 w-3 mr-1' />
            ) : (
              <TrendingDown className='h-3 w-3 mr-1' />
            )}
            {Math.abs(analytics.revenue.growth_rate)}%
          </Badge>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='week'>7 ngày</SelectItem>
              <SelectItem value='month'>30 ngày</SelectItem>
              <SelectItem value='quarter'>3 tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Revenue Summary */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Hôm nay</p>
              <p className='text-2xl font-bold text-green-600'>
                {formatCurrency(analytics.revenue.total_today)}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Tuần này</p>
              <p className='text-2xl font-bold text-blue-600'>
                {formatCurrency(analytics.revenue.total_week)}
              </p>
            </div>
            <div className='text-center'>
              <p className='text-sm text-muted-foreground'>Tháng này</p>
              <p className='text-2xl font-bold text-purple-600'>
                {formatCurrency(analytics.revenue.total_month)}
              </p>
            </div>
          </div>

          {/* Simple Bar Chart Representation */}
          <div className='space-y-2'>
            <h4 className='font-medium'>Doanh thu 7 ngày gần đây</h4>
            <div className='space-y-2'>
              {analytics.revenue.daily.map((amount, index) => (
                <div key={index} className='flex items-center gap-3'>
                  <span className='w-12 text-sm text-muted-foreground'>
                    {index === 6 ? 'Hôm nay' : `${7 - index} ngày`}
                  </span>
                  <div className='flex-1'>
                    <Progress
                      value={
                        (amount / Math.max(...analytics.revenue.daily)) * 100
                      }
                      className='h-3'
                    />
                  </div>
                  <span className='w-24 text-sm text-right'>
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MemberAnalytics = () => (
    <div className='grid md:grid-cols-2 gap-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Thống kê thành viên
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Tổng thành viên</p>
              <p className='text-2xl font-bold text-blue-600'>
                {analytics.members.total}
              </p>
            </div>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Mới tuần này</p>
              <p className='text-2xl font-bold text-green-600'>
                +{analytics.members.new_this_week}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='text-center p-3 bg-orange-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Hoạt động hôm nay</p>
              <p className='text-2xl font-bold text-orange-600'>
                {analytics.members.active_today}
              </p>
            </div>
            <div className='text-center p-3 bg-purple-50 rounded-lg'>
              <p className='text-sm text-muted-foreground'>Tỷ lệ giữ chân</p>
              <p className='text-2xl font-bold text-purple-600'>
                {analytics.members.retention_rate}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Star className='h-5 w-5' />
            Phân bố cấp độ
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-sm'>Mới bắt đầu</span>
              <Badge variant='outline'>
                {analytics.members.rank_distribution.beginner}%
              </Badge>
            </div>
            <Progress
              value={analytics.members.rank_distribution.beginner}
              className='h-2'
            />

            <div className='flex justify-between items-center'>
              <span className='text-sm'>Trung cấp</span>
              <Badge variant='outline'>
                {analytics.members.rank_distribution.intermediate}%
              </Badge>
            </div>
            <Progress
              value={analytics.members.rank_distribution.intermediate}
              className='h-2'
            />

            <div className='flex justify-between items-center'>
              <span className='text-sm'>Cao cấp</span>
              <Badge variant='outline'>
                {analytics.members.rank_distribution.advanced}%
              </Badge>
            </div>
            <Progress
              value={analytics.members.rank_distribution.advanced}
              className='h-2'
            />

            <div className='flex justify-between items-center'>
              <span className='text-sm'>Chuyên nghiệp</span>
              <Badge variant='outline'>
                {analytics.members.rank_distribution.professional}%
              </Badge>
            </div>
            <Progress
              value={analytics.members.rank_distribution.professional}
              className='h-2'
            />

            <div className='flex justify-between items-center'>
              <span className='text-sm'>Master</span>
              <Badge variant='destructive'>
                {analytics.members.rank_distribution.master}%
              </Badge>
            </div>
            <Progress
              value={analytics.members.rank_distribution.master}
              className='h-2'
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PerformanceMetrics = () => (
    <div className='grid md:grid-cols-3 gap-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Hiệu suất bàn chơi
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Tỷ lệ sử dụng</p>
            <p className='text-3xl font-bold text-blue-600'>
              {analytics.tables.utilization_rate}%
            </p>
            <Progress
              value={analytics.tables.utilization_rate}
              className='mt-2'
            />
          </div>

          <div>
            <p className='text-sm font-medium mb-2'>Giờ cao điểm</p>
            <div className='space-y-1'>
              {analytics.tables.peak_hours.map((hour, index) => (
                <Badge key={index} variant='secondary'>
                  {hour}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className='text-sm font-medium mb-2'>Hiệu quả đặt bàn</p>
            <div className='flex items-center gap-2'>
              <Progress
                value={analytics.tables.booking_efficiency}
                className='flex-1'
              />
              <span className='text-sm font-bold'>
                {analytics.tables.booking_efficiency}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            Giải đấu
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-2'>
            <div className='text-center p-2 bg-yellow-50 rounded'>
              <p className='text-xs text-muted-foreground'>Hoàn thành</p>
              <p className='text-xl font-bold text-yellow-600'>
                {analytics.tournaments.completed_this_month}
              </p>
            </div>
            <div className='text-center p-2 bg-blue-50 rounded'>
              <p className='text-xs text-muted-foreground'>Người tham gia</p>
              <p className='text-xl font-bold text-blue-600'>
                {analytics.tournaments.participants_total}
              </p>
            </div>
          </div>

          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Giải thưởng TB</p>
            <p className='text-lg font-bold text-green-600'>
              {formatCurrency(analytics.tournaments.average_prize_pool)}
            </p>
          </div>

          <div>
            <p className='text-sm font-medium mb-2'>Tỷ lệ hoàn thành</p>
            <div className='flex items-center gap-2'>
              <Progress
                value={analytics.tournaments.completion_rate}
                className='flex-1'
              />
              <span className='text-sm font-bold'>
                {analytics.tournaments.completion_rate}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5' />
            Thử thách
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-2'>
            <div className='text-center p-2 bg-green-50 rounded'>
              <p className='text-xs text-muted-foreground'>Hôm nay</p>
              <p className='text-xl font-bold text-green-600'>
                {analytics.challenges.completed_today}
              </p>
            </div>
            <div className='text-center p-2 bg-blue-50 rounded'>
              <p className='text-xs text-muted-foreground'>Tuần này</p>
              <p className='text-xl font-bold text-blue-600'>
                {analytics.challenges.completed_week}
              </p>
            </div>
          </div>

          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Elo stake TB</p>
            <p className='text-lg font-bold text-purple-600'>
              {formatCurrency(analytics.challenges.average_stake)}
            </p>
          </div>

          <div>
            <p className='text-sm font-medium mb-2'>Tỷ lệ thành công</p>
            <div className='flex items-center gap-2'>
              <Progress
                value={analytics.challenges.success_rate}
                className='flex-1'
              />
              <span className='text-sm font-bold'>
                {analytics.challenges.success_rate}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold'>Phân tích & Báo cáo</h2>
          <p className='text-muted-foreground'>
            Thống kê chi tiết hoạt động CLB
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <RefreshCw className='h-4 w-4 mr-2' />
            )}
            Làm mới
          </Button>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Doanh thu hôm nay
                </p>
                <p className='text-xl font-bold text-green-600'>
                  {formatCurrency(analytics.revenue.total_today)}
                </p>
              </div>
              <DollarSign className='h-8 w-8 text-green-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Thành viên hoạt động
                </p>
                <p className='text-xl font-bold text-blue-600'>
                  {analytics.members.active_today}
                </p>
              </div>
              <Users className='h-8 w-8 text-blue-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Tỷ lệ sử dụng bàn
                </p>
                <p className='text-xl font-bold text-purple-600'>
                  {analytics.tables.utilization_rate}%
                </p>
              </div>
              <BarChart3 className='h-8 w-8 text-purple-500' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Thử thách hôm nay
                </p>
                <p className='text-xl font-bold text-orange-600'>
                  {analytics.challenges.completed_today}
                </p>
              </div>
              <Zap className='h-8 w-8 text-orange-500' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue='revenue' className='w-full'>
        <TabsList>
          <TabsTrigger value='revenue'>Doanh thu</TabsTrigger>
          <TabsTrigger value='members'>Thành viên</TabsTrigger>
          <TabsTrigger value='performance'>Hiệu suất</TabsTrigger>
        </TabsList>

        <TabsContent value='revenue' className='mt-4'>
          <RevenueChart />
        </TabsContent>

        <TabsContent value='members' className='mt-4'>
          <MemberAnalytics />
        </TabsContent>

        <TabsContent value='performance' className='mt-4'>
          <PerformanceMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CLBAnalyticsDashboard;
