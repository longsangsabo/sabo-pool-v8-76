import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Activity,
  TrendingUp,
  MessageSquare,
  Trophy,
  Target
} from 'lucide-react';

// Import existing components
import UserDashboard from '@/features/user/components/dashboard/UserDashboard';
import { useAuth } from '@/hooks/useAuth';

// Analytics component (placeholder for now)
const AnalyticsTab = () => (
  <div className="compact-section space-y-4">
    <div className="compact-grid compact-grid-cols-4">
      <Card className="compact-card">
        <CardHeader className="compact-card-header flex flex-row items-center justify-between space-y-0">
          <CardTitle className="responsive-text-sm font-medium">
            Tổng trận đã chơi
          </CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="compact-card-content">
          <div className="responsive-text-xl font-bold">127</div>
          <p className="text-xs text-muted-foreground">
            +12% so với tháng trước
          </p>
        </CardContent>
      </Card>
      
      <Card className="compact-card">
        <CardHeader className="compact-card-header flex flex-row items-center justify-between space-y-0">
          <CardTitle className="responsive-text-sm font-medium">
            Tỷ lệ thắng
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="compact-card-content">
          <div className="responsive-text-xl font-bold">73%</div>
          <p className="text-xs text-muted-foreground">
            +5% so với tháng trước
          </p>
        </CardContent>
      </Card>

      <Card className="compact-card">
        <CardHeader className="compact-card-header flex flex-row items-center justify-between space-y-0">
          <CardTitle className="responsive-text-sm font-medium">
            Thách đấu đã gửi
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="compact-card-content">
          <div className="responsive-text-xl font-bold">42</div>
          <p className="text-xs text-muted-foreground">
            +3 tuần này
          </p>
        </CardContent>
      </Card>

      <Card className="compact-card">
        <CardHeader className="compact-card-header flex flex-row items-center justify-between space-y-0">
          <CardTitle className="responsive-text-sm font-medium">
            Ranking hiện tại
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="compact-card-content">
          <div className="responsive-text-xl font-bold">#23</div>
          <p className="text-xs text-muted-foreground">
            Tăng 5 bậc
          </p>
        </CardContent>
      </Card>
    </div>

    <Card className="compact-card">
      <CardHeader className="compact-card-header">
        <CardTitle className="compact-title">Biểu đồ hiệu suất</CardTitle>
      </CardHeader>
      <CardContent className="compact-card-content">
        <div className="h-48 md:h-64 flex items-center justify-center text-muted-foreground">
          📊 Biểu đồ hiệu suất sẽ được hiển thị ở đây
        </div>
      </CardContent>
    </Card>
  </div>
);

// Feed component (placeholder for now)
const FeedTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm">
              <strong>Nguyễn Văn A</strong> đã thắng tournament "SABO Cup 2025"
            </p>
            <p className="text-xs text-muted-foreground">2 giờ trước</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm">
              <strong>Trần Thị B</strong> đã gửi thách đấu cho <strong>Lê Văn C</strong>
            </p>
            <p className="text-xs text-muted-foreground">5 giờ trước</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm">
              <strong>CLB Billiards Pro</strong> đã tạo tournament mới
            </p>
            <p className="text-xs text-muted-foreground">1 ngày trước</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bạn bè đang online</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <span className="text-sm">Nguyễn Văn A</span>
            </div>
            <Badge variant="secondary" className="text-xs">Đang chơi</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              <span className="text-sm">Trần Thị B</span>
            </div>
            <Badge variant="outline" className="text-xs">Online</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Community component (placeholder for now)
const CommunityTab = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cộng đồng SABO</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">Thành viên</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">56</p>
              <p className="text-sm text-muted-foreground">Giải đấu</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">892</p>
              <p className="text-sm text-muted-foreground">Tin nhắn hôm nay</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thảo luận nổi bật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-primary-foreground">A</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Mẹo cải thiện kỹ thuật cơ</p>
                <p className="text-xs text-muted-foreground">15 bình luận • 2 giờ trước</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <span className="text-xs text-secondary-foreground">B</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Giải đấu CLB tuần tới</p>
                <p className="text-xs text-muted-foreground">8 bình luận • 4 giờ trước</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </div>
);

const DashboardHub: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900'>
        <Helmet>
          <title>SABO Pool Arena - Trang chủ</title>
          <meta name='description' content='Hệ thống quản lý và đặt bàn bi-a SABO Pool Arena' />
        </Helmet>
        
        <header className='bg-green-800 border-b border-green-700'>
          <div className='container mx-auto px-4 py-4'>
            <div className='flex items-center space-x-3'>
              <div className='w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center'>
                <span className='text-2xl'>🎱</span>
              </div>
              <div>
                <h1 className='text-xl font-bold text-yellow-400'>
                  SABO Pool Arena
                </h1>
                <p className='text-green-200 text-sm'>
                  Chào mừng bạn đến với trang chủ
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className='container mx-auto px-4 py-8'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-white mb-4'>
              Chào Mừng Đến SABO Pool Arena
            </h2>
            <p className='text-green-200 mb-6'>
              Hệ thống quản lý và đặt bàn bi-a hiện đại, chuyên nghiệp
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="compact-container compact-layout desktop-high-density">
      <Helmet>
        <title>SABO Arena - Dashboard</title>
        <meta name='description' content='Dashboard tổng hợp - SABO Pool Arena' />
      </Helmet>

      <div className="mb-4 md:mb-6">
        <h1 className="compact-title">Dashboard</h1>
        <p className="compact-subtitle">
          Tổng quan hoạt động và thông tin cá nhân
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 md:space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-9 md:h-10">
          <TabsTrigger value="dashboard" className="compact-nav-item flex items-center gap-1">
            <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline responsive-text-xs">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="compact-nav-item flex items-center gap-1">
            <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline responsive-text-xs">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="compact-nav-item flex items-center gap-1">
            <Activity className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline responsive-text-xs">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="compact-nav-item flex items-center gap-1">
            <Users className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline responsive-text-xs">Community</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-3 md:space-y-4 mobile-compact">
          <UserDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-3 md:space-y-4 mobile-compact">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="feed" className="space-y-3 md:space-y-4 mobile-compact">
          <FeedTab />
        </TabsContent>

        <TabsContent value="community" className="space-y-3 md:space-y-4 mobile-compact">
          <CommunityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardHub;
