import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Trophy,
  Target,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Star,
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalMatches: number;
    winRate: number;
    totalEarnings: number;
    currentRank: string;
    rankProgress: number;
    activeStreak: number;
  };
  performance: {
    monthly: {
      matches: number[];
      wins: number[];
      earnings: number[];
    };
    categories: {
      tournament: number;
      challenge: number;
      friendly: number;
    };
  };
  achievements: {
    total: number;
    recent: string[];
    nextMilestone: string;
  };
  opponents: {
    total: number;
    topOpponents: Array<{
      username: string;
      matches: number;
      winRate: number;
    }>;
  };
}

interface AnalyticsDashboardProps {
  userId: string;
  timeRange?: 'week' | 'month' | 'year' | 'all';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  userId,
  timeRange = 'month',
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<
    'week' | 'month' | 'year' | 'all'
  >(timeRange);

  useEffect(() => {
    fetchAnalytics();
  }, [userId, selectedRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setData({
        overview: {
          totalMatches: 156,
          winRate: 72.5,
          totalEarnings: 2500000,
          currentRank: 'H+',
          rankProgress: 85,
          activeStreak: 8,
        },
        performance: {
          monthly: {
            matches: [12, 15, 18, 14, 16, 20, 22, 19, 17, 21, 23, 25],
            wins: [8, 11, 13, 10, 12, 15, 17, 14, 12, 16, 18, 20],
            earnings: [
              150000, 180000, 220000, 160000, 200000, 250000, 280000, 210000,
              190000, 240000, 270000, 300000,
            ],
          },
          categories: {
            tournament: 45,
            challenge: 78,
            friendly: 33,
          },
        },
        achievements: {
          total: 24,
          recent: [
            'Win Streak 10',
            'Tournament Champion',
            'Perfect Game',
            '100 Matches',
          ],
          nextMilestone: 'Win Streak 15',
        },
        opponents: {
          total: 89,
          topOpponents: [
            { username: 'player1', matches: 12, winRate: 75.0 },
            { username: 'player2', matches: 8, winRate: 62.5 },
            { username: 'player3', matches: 15, winRate: 80.0 },
            { username: 'player4', matches: 6, winRate: 66.7 },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'E+':
      case 'E':
        return 'bg-red-100 text-red-800';
      case 'F+':
      case 'F':
        return 'bg-purple-100 text-purple-800';
      case 'G+':
      case 'G':
        return 'bg-blue-100 text-blue-800';
      case 'H+':
      case 'H':
        return 'bg-green-100 text-green-800';
      case 'I+':
      case 'I':
        return 'bg-amber-100 text-amber-800';
      case 'K+':
      case 'K':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>Không có dữ liệu thống kê</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Thống kê cá nhân</h1>
          <p className='text-gray-600 mt-1'>
            Theo dõi hiệu suất và tiến độ của bạn
          </p>
        </div>

        <Select
          value={selectedRange}
          onValueChange={(value: 'week' | 'month' | 'year' | 'all') =>
            setSelectedRange(value)
          }
        >
          <SelectTrigger className='w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='week'>Tuần</SelectItem>
            <SelectItem value='month'>Tháng</SelectItem>
            <SelectItem value='year'>Năm</SelectItem>
            <SelectItem value='all'>Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng trận đấu</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {data.overview.totalMatches}
            </div>
            <p className='text-xs text-muted-foreground'>
              <TrendingUp className='h-3 w-3 inline text-green-500' />
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tỷ lệ thắng</CardTitle>
            <Trophy className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{data.overview.winRate}%</div>
            <p className='text-xs text-muted-foreground'>
              <TrendingUp className='h-3 w-3 inline text-green-500' />
              +2.5% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng thu nhập</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(data.overview.totalEarnings)}
            </div>
            <p className='text-xs text-muted-foreground'>
              <TrendingUp className='h-3 w-3 inline text-green-500' />
              +15% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Hạng hiện tại</CardTitle>
            <Award className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Badge className={getRankColor(data.overview.currentRank)}>
                {data.overview.currentRank}
              </Badge>
              <span className='text-sm text-gray-600'>
                {data.overview.rankProgress}% đến hạng tiếp theo
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
              <div
                className='bg-blue-500 h-2 rounded-full'
                style={{ width: `${data.overview.rankProgress}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Hiệu suất theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div>
                <div className='flex justify-between text-sm mb-2'>
                  <span>Trận đấu</span>
                  <span>
                    {
                      data.performance.monthly.matches[
                        data.performance.monthly.matches.length - 1
                      ]
                    }
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-500 h-2 rounded-full'
                    style={{
                      width: `${(data.performance.monthly.matches[data.performance.monthly.matches.length - 1] / 30) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className='flex justify-between text-sm mb-2'>
                  <span>Chiến thắng</span>
                  <span>
                    {
                      data.performance.monthly.wins[
                        data.performance.monthly.wins.length - 1
                      ]
                    }
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-green-500 h-2 rounded-full'
                    style={{
                      width: `${(data.performance.monthly.wins[data.performance.monthly.wins.length - 1] / 30) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className='flex justify-between text-sm mb-2'>
                  <span>Thu nhập</span>
                  <span>
                    {formatCurrency(
                      data.performance.monthly.earnings[
                        data.performance.monthly.earnings.length - 1
                      ]
                    )}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-yellow-500 h-2 rounded-full'
                    style={{
                      width: `${(data.performance.monthly.earnings[data.performance.monthly.earnings.length - 1] / 500000) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PieChart className='h-5 w-5' />
              Phân loại trận đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                  <span className='text-sm'>Giải đấu</span>
                </div>
                <span className='text-sm font-medium'>
                  {data.performance.categories.tournament}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                  <span className='text-sm'>Thách đấu</span>
                </div>
                <span className='text-sm font-medium'>
                  {data.performance.categories.challenge}
                </span>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 bg-yellow-500 rounded-full'></div>
                  <span className='text-sm'>Thân thiện</span>
                </div>
                <span className='text-sm font-medium'>
                  {data.performance.categories.friendly}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements and Opponents */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Star className='h-5 w-5' />
              Thành tích ({data.achievements.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div>
                <h4 className='font-medium mb-2'>Thành tích gần đây:</h4>
                <div className='space-y-2'>
                  {data.achievements.recent.map((achievement, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-sm'
                    >
                      <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                      <span>{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className='pt-3 border-t'>
                <h4 className='font-medium mb-2'>Mục tiêu tiếp theo:</h4>
                <div className='flex items-center gap-2 text-sm text-blue-600'>
                  <Activity className='h-4 w-4' />
                  <span>{data.achievements.nextMilestone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              Đối thủ hàng đầu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {data.opponents.topOpponents.map((opponent, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div>
                    <div className='font-medium'>{opponent.username}</div>
                    <div className='text-sm text-gray-600'>
                      {opponent.matches} trận • {opponent.winRate}% thắng
                    </div>
                  </div>
                  <Badge variant='outline'>#{index + 1}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Streak Info */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Chuỗi chiến thắng hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-3xl font-bold text-green-600'>
                {data.overview.activeStreak} trận
              </div>
              <p className='text-sm text-gray-600'>
                Chuỗi chiến thắng liên tiếp hiện tại
              </p>
            </div>
            <div className='text-right'>
              <div className='text-sm text-gray-600'>Kỷ lục cá nhân</div>
              <div className='text-lg font-bold'>15 trận</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
