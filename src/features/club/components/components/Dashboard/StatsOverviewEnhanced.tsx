import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  DollarSign, 
  Table2, 
  TrendingUp, 
  Trophy, 
  CheckCircle, 
  Activity,
  Clock
} from 'lucide-react';

interface StatsOverviewProps {
  clubId: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ clubId }) => {
  // Enhanced mock data
  const [stats] = React.useState({
    totalMembers: 156,
    activeTournaments: 3,
    totalTables: 12,
    tablesInUse: 8,
    monthlyRevenue: 15600000,
    pendingVerifications: 7,
    thisMonthMatches: 89,
    memberGrowth: 12.5,
    revenueGrowth: 8.2,
    tournamentCompletion: 78,
    avgPlayTime: 8.5
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const primaryStats = [
    {
      title: 'Tổng thành viên',
      value: stats.totalMembers,
      icon: Users,
      description: `+${stats.memberGrowth}% so với tháng trước`,
      color: 'blue',
      isPositive: true
    },
    {
      title: 'Doanh thu tháng',
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      description: `+${stats.revenueGrowth}% so với tháng trước`,
      color: 'green',
      isPositive: true
    },
    {
      title: 'Bàn đang sử dụng',
      value: `${stats.tablesInUse}/${stats.totalTables}`,
      icon: Table2,
      description: `Tỷ lệ sử dụng ${Math.round((stats.tablesInUse/stats.totalTables)*100)}%`,
      color: 'purple',
      isPositive: true
    },
    {
      title: 'Giải đấu hoạt động',
      value: stats.activeTournaments,
      icon: Trophy,
      description: 'Giải đấu đang diễn ra',
      color: 'yellow',
      isPositive: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
      orange: 'bg-orange-50 border-orange-200 text-orange-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Thống kê tổng quan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {primaryStats.map((stat, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${getColorClasses(stat.color)}`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-6 w-6" />
                {stat.isPositive && (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium opacity-80">
                  {stat.title}
                </span>
                <div className="text-2xl font-bold">
                  {stat.value}
                </div>
                <p className="text-xs opacity-70">
                  {stat.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-orange-600" />
            <div>
              <h4 className="font-semibold text-orange-800">{stats.pendingVerifications}</h4>
              <p className="text-xs text-orange-600">Chờ xác thực</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-800">{stats.thisMonthMatches}</h4>
              <p className="text-xs text-blue-600">Trận đấu</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Clock className="w-8 h-8 text-gray-600" />
            <div>
              <h4 className="font-semibold text-gray-800">{stats.avgPlayTime}h</h4>
              <p className="text-xs text-gray-600">TB/ngày</p>
            </div>
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Tiến độ giải đấu</span>
              <span className="text-lg font-bold">{stats.tournamentCompletion}%</span>
            </div>
            <Progress value={stats.tournamentCompletion} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Hoàn thành mục tiêu tháng
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Sử dụng bàn chơi</span>
              <span className="text-lg font-bold">{Math.round((stats.tablesInUse/stats.totalTables)*100)}%</span>
            </div>
            <Progress value={Math.round((stats.tablesInUse/stats.totalTables)*100)} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.tablesInUse} trong {stats.totalTables} bàn đang được sử dụng
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
