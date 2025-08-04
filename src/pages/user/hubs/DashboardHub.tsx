import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Activity,
  TrendingUp,
  MessageSquare,
  Trophy,
  Target,
  Calendar,
  DollarSign,
  Zap,
  Award,
  Clock,
  MapPin
} from 'lucide-react';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Hooks
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalMatches: number;
  winRate: number;
  monthlyMatches: number;
  currentStreak: number;
  totalEarnings: number;
  activeChallenges: number;
  unreadMessages: number;
  upcomingTournaments: number;
}

const DashboardHub = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 127,
    winRate: 73,
    monthlyMatches: 18,
    currentStreak: 5,
    totalEarnings: 2500000,
    activeChallenges: 3,
    unreadMessages: 7,
    upcomingTournaments: 2
  });

  // Quick Actions
  const quickActions = [
    { icon: Target, label: 'Tạo thách đấu', action: () => {}, color: 'bg-blue-500' },
    { icon: Trophy, label: 'Tham gia giải đấu', action: () => {}, color: 'bg-purple-500' },
    { icon: Users, label: 'Tìm đối thủ', action: () => {}, color: 'bg-green-500' },
    { icon: MessageSquare, label: 'Tin nhắn', action: () => {}, color: 'bg-orange-500' }
  ];

  // Recent Activities (Mock data)
  const recentActivities = [
    { type: 'match', description: 'Thắng vs Minh Hoàng', time: '2 giờ trước', result: 'win' },
    { type: 'challenge', description: 'Nhận thách đấu từ Đức Anh', time: '5 giờ trước', result: 'pending' },
    { type: 'tournament', description: 'Đăng ký Tournament Mùa Xuân', time: '1 ngày trước', result: 'success' },
    { type: 'achievement', description: 'Đạt chuỗi thắng 5 trận', time: '2 ngày trước', result: 'achievement' }
  ];

  // Overview Component
  const DashboardOverview = () => (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Chào mừng trở lại, {user?.email?.split('@')[0] || 'Người chơi'}!
              </h2>
              <p className="opacity-90">
                Hôm nay bạn có {stats.activeChallenges} thách đấu và {stats.unreadMessages} tin nhắn mới
              </p>
            </div>
            <Trophy className="h-16 w-16 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
            <p className="text-sm text-gray-600">Tổng trận đấu</p>
            <Badge variant="secondary" className="text-xs mt-1">+12% tháng này</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.winRate}%</div>
            <p className="text-sm text-gray-600">Tỷ lệ thắng</p>
            <Badge variant="secondary" className="text-xs mt-1">+5% tháng này</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.currentStreak}</div>
            <p className="text-sm text-gray-600">Chuỗi thắng</p>
            <Badge variant="secondary" className="text-xs mt-1">Đang tăng</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{(stats.totalEarnings / 1000000).toFixed(1)}M</div>
            <p className="text-sm text-gray-600">Tổng thu nhập</p>
            <Badge variant="secondary" className="text-xs mt-1">VND</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex flex-col items-center gap-2 hover:bg-gray-50"
                onClick={action.action}
              >
                <div className={`${action.color} p-2 rounded-full text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                  activity.result === 'win' ? 'bg-green-500' :
                  activity.result === 'pending' ? 'bg-yellow-500' :
                  activity.result === 'achievement' ? 'bg-purple-500' : 'bg-blue-500'
                }`}>
                  {activity.type === 'match' ? 'M' :
                   activity.type === 'challenge' ? 'C' :
                   activity.type === 'tournament' ? 'T' : 'A'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-600">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Analytics Component
  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Hiệu suất tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Trận đấu</span>
                <Badge variant="secondary">{stats.monthlyMatches}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tỷ lệ thắng</span>
                <Badge variant="secondary">{stats.winRate}%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Điểm ELO trung bình</span>
                <Badge variant="secondary">1650</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2" />
              Thành tích nổi bật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-gold" />
                <span className="text-sm">Chuỗi thắng dài nhất: 12</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Độ chính xác: 89%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm">Đối thủ đã thắng: 45</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Lịch thi đấu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">Tournament Mùa Xuân</p>
                <p className="text-xs text-gray-600">15/08/2025 - 09:00</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <p className="text-sm font-medium">Thách đấu vs Minh Hoàng</p>
                <p className="text-xs text-gray-600">16/08/2025 - 19:30</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Social Component
  const SocialTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Cộng đồng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Đối thủ yêu thích</h4>
              {['Minh Hoàng', 'Đức Anh', 'Tuấn Anh'].map((name, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {name[0]}
                    </div>
                    <span className="text-sm">{name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {[8, 12, 6][index]} trận
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Câu lạc bộ gần đây</h4>
              {['Billiards Center', 'Golden Cue', 'Champion Club'].map((club, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{club}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {[2.5, 3.1, 1.8][index]}km
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard - Sabo Pool</title>
        <meta name="description" content="Dashboard tổng quan và thống kê người chơi" />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Tổng quan hoạt động và thành tích của bạn</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Thống kê</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Cộng đồng</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Hoạt động</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="social">
            <SocialTab />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Chi tiết hoạt động</h3>
                <p className="text-gray-600 mb-4">Xem lịch sử chi tiết các hoạt động</p>
                <Badge variant="secondary">Đang phát triển</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardHub;
