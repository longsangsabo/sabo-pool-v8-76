import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { 
  Users, 
  Trophy, 
  Settings, 
  BarChart3, 
  Table, 
  CheckCircle,
  Plus,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  Star
} from 'lucide-react';

// Simple CLB Management component without external dependencies
const SimpleCLBManagement = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  // Mock data
  const stats = {
    totalMembers: 156,
    activeTournaments: 3,
    totalTables: 12,
    tablesInUse: 8,
    monthlyRevenue: 15600000,
    pendingVerifications: 7,
    memberGrowth: 12.5,
    revenueGrowth: 8.2
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Tổng thành viên</p>
                <h3 className="text-2xl font-bold mt-1">{stats.totalMembers}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.memberGrowth}% tháng này
                </div>
              </div>
              <div className="text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Doanh thu tháng</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(stats.monthlyRevenue)}</h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  +{stats.revenueGrowth}% tháng trước
                </div>
              </div>
              <div className="text-muted-foreground bg-green-50 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Bàn đang sử dụng</p>
                <h3 className="text-2xl font-bold mt-1">{stats.tablesInUse}/{stats.totalTables}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Tỷ lệ {Math.round((stats.tablesInUse/stats.totalTables)*100)}%
                </p>
              </div>
              <div className="text-muted-foreground bg-purple-50 p-3 rounded-lg">
                <Table className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Giải đấu hoạt động</p>
                <h3 className="text-2xl font-bold mt-1">{stats.activeTournaments}</h3>
                <p className="text-xs text-muted-foreground mt-1">Đang diễn ra</p>
              </div>
              <div className="text-muted-foreground bg-yellow-50 p-3 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Thao tác nhanh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 flex-col">
              <Plus className="w-6 h-6 mb-2" />
              Thêm thành viên
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Trophy className="w-6 h-6 mb-2" />
              Tạo giải đấu
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Table className="w-6 h-6 mb-2" />
              Quản lý bàn
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <CheckCircle className="w-6 h-6 mb-2" />
              Xem xác thực
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MembersTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Quản lý thành viên ({stats.totalMembers})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Thành viên {i}</h4>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline">Cao cấp</Badge>
                    {i === 1 && <Badge>Admin</Badge>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const TournamentsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Quản lý giải đấu ({stats.activeTournaments})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { name: 'Giải CLB Mùa Xuân 2025', status: 'ongoing', progress: 65 },
            { name: 'Giải Nhanh Cuối Tuần', status: 'upcoming', progress: 0 },
            { name: 'Giải Tết Nguyên Đán', status: 'completed', progress: 100 }
          ].map((tournament, i) => (
            <Card key={i} className="p-4 border-l-4 border-l-yellow-400">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{tournament.name}</h4>
                  <Badge className={
                    tournament.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                    tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {tournament.status === 'ongoing' ? 'Đang diễn ra' :
                     tournament.status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Xem</Button>
                  <Button variant="outline" size="sm">Sửa</Button>
                </div>
              </div>
              {tournament.status === 'ongoing' && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ</span>
                    <span>{tournament.progress}%</span>
                  </div>
                  <Progress value={tournament.progress} className="h-2" />
                </div>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const VerificationTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Yêu cầu xác thực ({stats.pendingVerifications})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 border-l-4 border-l-orange-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-medium">Nguyễn Văn {String.fromCharCode(64 + i)}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">Hiện tại: Trung cấp</Badge>
                      <Badge>Yêu cầu: Cao cấp</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-green-600">Duyệt</Button>
                  <Button variant="outline" size="sm" className="text-red-600">Từ chối</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CLB Navigation Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sabo Pool Club</h1>
                  <p className="text-sm text-gray-500">CLB Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Hoạt động
              </Badge>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{stats.totalMembers} thành viên</span>
              </div>
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Cài đặt
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CLB Content */}
      <div className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              Thành viên
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Trophy className="w-4 h-4" />
              Giải đấu
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Table className="w-4 h-4" />
              Bàn chơi
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <CheckCircle className="w-4 h-4" />
              Xác thực
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="tournaments">
          <TournamentsTab />
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                Quản lý bàn chơi ({stats.totalTables})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({length: stats.totalTables}, (_, i) => (
                  <Card key={i} className="p-4 text-center">
                    <Table className="w-8 h-8 mx-auto mb-2" />
                    <h4 className="font-medium">Bàn {i + 1}</h4>
                    <Badge className={i < stats.tablesInUse ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                      {i < stats.tablesInUse ? 'Đang sử dụng' : 'Trống'}
                    </Badge>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <VerificationTab />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Cài đặt CLB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Thông tin CLB</h4>
                  <p className="text-sm text-muted-foreground">Sabo Pool Club</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Địa chỉ</h4>
                  <p className="text-sm text-muted-foreground">Số 123, Đường ABC, Quận 1, TP.HCM</p>
                </div>
                <Button>Cập nhật thông tin</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default SimpleCLBManagement;
