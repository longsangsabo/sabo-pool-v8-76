import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  User, 
  Settings, 
  TrendingUp, 
  Award,
  Trophy,
  Target,
  Calendar,
  Activity,
  BarChart3,
  Medal,
  Star,
  Edit,
  Shield,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy loaded components
const UserProfilePage = React.lazy(() => import('@/pages/UserProfilePage'));
const RankingDashboardPage = React.lazy(() => import('@/pages/RankingDashboardPage'));

import { UserProfile } from '@/types/common';

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  eloRating: number;
  rankPosition: number;
  totalEarnings: number;
  monthlyMatches: number;
}

const PlayerProfileHub = () => {
  const { user } = useAuth();
  const { getProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentStreak: 0,
    bestStreak: 0,
    eloRating: 1200,
    rankPosition: 0,
    totalEarnings: 0,
    monthlyMatches: 0
  });
  const [loading, setLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getProfile();
        setProfile(userProfile);
        
        // Mock stats for development
        setStats({
          totalMatches: userProfile?.total_matches || 156,
          wins: userProfile?.wins || 98,
          losses: userProfile?.losses || 58,
          winRate: userProfile?.wins ? (userProfile.wins / userProfile.total_matches) * 100 : 62.8,
          currentStreak: 5,
          bestStreak: 12,
          eloRating: userProfile?.ranking_points || 1650,
          rankPosition: 24,
          totalEarnings: 2500000,
          monthlyMatches: 18
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Lỗi tải thông tin profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [getProfile]);

  // Profile Overview Component
  const ProfileOverview = () => (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl">
                {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile?.full_name || 'Người chơi'}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <Badge variant="secondary" className="font-medium">
                  {profile?.current_rank || 'Pro'}
                </Badge>
                <Badge variant="outline">
                  ELO: {stats.eloRating}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={() => setActiveTab('settings')}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
            <p className="text-sm text-gray-600">Trận thắng</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
            <p className="text-sm text-gray-600">Trận thua</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{stats.winRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">Tỷ lệ thắng</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
            <p className="text-sm text-gray-600">Chuỗi thắng</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Hiệu suất gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Trận đấu tháng này</span>
                <Badge variant="secondary">{stats.monthlyMatches}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chuỗi thắng tốt nhất</span>
                <Badge variant="secondary">{stats.bestStreak}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Vị trí xếp hạng</span>
                <Badge variant="secondary">#{stats.rankPosition}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Medal className="h-5 w-5 mr-2" />
              Thành tích nổi bật
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Thành viên tích cực</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="h-4 w-4 text-gold" />
                <span className="text-sm">Top 50 người chơi</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Fair Play Player</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index % 2 === 0 ? 'bg-green-500' : 'bg-red-500'
                  } text-white text-sm font-bold`}>
                    {index % 2 === 0 ? 'W' : 'L'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {index % 2 === 0 ? 'Thắng' : 'Thua'} vs {['Minh Hoàng', 'Đức Anh', 'Tuấn Anh', 'Hải Nam'][index]}
                    </p>
                    <p className="text-xs text-gray-600">
                      {[2, 5, 1, 3][index]} ngày trước
                    </p>
                  </div>
                </div>
                <Badge variant={index % 2 === 0 ? 'default' : 'secondary'} className="text-xs">
                  +{[15, -8, 12, -5][index]} ELO
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Profile Section with lazy loading
  const ProfileSection = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfilePage />
    </Suspense>
  );

  // Rankings Section with lazy loading
  const RankingsSection = () => (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Bảng xếp hạng ELO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Xem chi tiết bảng xếp hạng ELO và phân tích hiệu suất
            </p>
            <Button onClick={() => setActiveTab('rankings-detail')}>
              Xem chi tiết
            </Button>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );

  // Settings Section
  const SettingsSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Cài đặt tài khoản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Thông tin cá nhân</p>
                <p className="text-sm text-gray-600">Cập nhật thông tin profile</p>
              </div>
              <Button variant="outline" size="sm">
                Chỉnh sửa
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Cài đặt riêng tư</p>
                <p className="text-sm text-gray-600">Quản lý quyền riêng tư</p>
              </div>
              <Button variant="outline" size="sm">
                Cài đặt
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Thông báo</p>
                <p className="text-sm text-gray-600">Cài đặt thông báo</p>
              </div>
              <Button variant="outline" size="sm">
                Cài đặt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Profile - Sabo Pool</title>
        <meta name="description" content="Quản lý profile và xếp hạng người chơi" />
      </Helmet>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Profile & Xếp hạng</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin cá nhân và theo dõi thành tích</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Xếp hạng</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Cài đặt</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProfileOverview />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSection />
          </TabsContent>

          <TabsContent value="rankings">
            <RankingsSection />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlayerProfileHub;
