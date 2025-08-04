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
  Star,
  Target,
  Zap,
  Swords,
  Calendar,
  Upload,
  Shield,
  Eye,
  XCircle,
  MessageSquare,
  Pause,
  Download,
  Save,
  Bell,
  Edit,
  RefreshCw
} from 'lucide-react';

const SimpleCLBManagement = () => {
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
                <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Thành viên
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Giải đấu
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Thử thách
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Bàn chơi
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Xác minh
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Cài đặt
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
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
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
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
          </TabsContent>

          {/* Other tabs */}
          <TabsContent value="tournaments">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Quản lý giải đấu</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo giải đấu
                </Button>
              </div>
              
              {/* Quick Tournament Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Đang diễn ra</p>
                        <p className="text-2xl font-bold text-green-600">2</p>
                      </div>
                      <Trophy className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Sắp tới</p>
                        <p className="text-2xl font-bold text-blue-600">3</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng giải thưởng</p>
                        <p className="text-lg font-bold text-yellow-600">15M VNĐ</p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tournament List with Enhanced Features */}
              <div className="space-y-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">Giải vô địch CLB tháng 1</h4>
                          <Badge className="bg-green-100 text-green-800">Đang diễn ra</Badge>
                          <Badge variant="outline">Loại trực tiếp</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            18/32 người
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            100K VNĐ
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            3M VNĐ giải thưởng
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Xem bracket</Button>
                        <Button size="sm">Quản lý</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">Giải giao hữu cuối tuần</h4>
                          <Badge className="bg-blue-100 text-blue-800">Đăng ký</Badge>
                          <Badge variant="outline">Vòng tròn</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            12/16 người
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            50K VNĐ
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            800K VNĐ giải thưởng
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Đăng ký</Button>
                        <Button size="sm">Chi tiết</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="challenges">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Hệ thống thử thách</h3>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo thử thách
                </Button>
              </div>
              
              {/* Challenge Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Chờ phản hồi</p>
                        <p className="text-2xl font-bold text-orange-600">5</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Đang diễn ra</p>
                        <p className="text-2xl font-bold text-blue-600">3</p>
                      </div>
                      <Zap className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Hoàn thành</p>
                        <p className="text-2xl font-bold text-green-600">24</p>
                      </div>
                      <Trophy className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng thưởng</p>
                        <p className="text-lg font-bold text-yellow-600">2.5M VNĐ</p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Challenges */}
              <div className="space-y-4">
                <h4 className="font-medium">Thử thách hiện tại</h4>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Swords className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold">Nguyễn Văn A</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-semibold">Trần Văn B</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">Xếp hạng</Badge>
                          <Badge className="bg-orange-100 text-orange-800">Chờ phản hồi</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            25 Elo
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            100K VNĐ
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            20/01/2024 14:00
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Từ chối</Button>
                        <Button size="sm">Chấp nhận</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Swords className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">Lê Thị C</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-semibold">Phạm Văn D</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-800">Giao hữu</Badge>
                          <Badge className="bg-green-100 text-green-800">Đã chấp nhận</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            50K VNĐ
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            18/01/2024 16:00
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Zap className="h-4 w-4 mr-1" />
                          Bắt đầu
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tables">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Quản lý bàn chơi</h3>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Xem thống kê
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Đặt bàn
                  </Button>
                </div>
              </div>
              
              {/* Quick Table Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Bàn có sẵn</p>
                        <p className="text-2xl font-bold text-green-600">3</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Đang sử dụng</p>
                        <p className="text-2xl font-bold text-red-600">2</p>
                      </div>
                      <Activity className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
                        <p className="text-lg font-bold text-blue-600">1.2M VNĐ</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Giờ sử dụng</p>
                        <p className="text-2xl font-bold text-purple-600">18h</p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Table Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">Bàn VIP 1</h4>
                          <p className="text-sm text-muted-foreground">150K VNĐ/giờ</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Đang sử dụng</Badge>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-800">Đang sử dụng</span>
                          <Badge variant="outline">Đấu thực</Badge>
                        </div>
                        <div className="text-sm">
                          <div>Nguyễn Văn A vs Trần Văn B</div>
                          <div className="text-muted-foreground">14:00 - 120 phút</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span>Hôm nay: 600K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>Sử dụng: 6h</span>
                        </div>
                      </div>
                      
                      <Button size="sm" variant="destructive" className="w-full">
                        <Pause className="h-3 w-3 mr-1" />
                        Kết thúc
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">Bàn số 2</h4>
                          <p className="text-sm text-muted-foreground">100K VNĐ/giờ</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Có thể sử dụng</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span>Hôm nay: 400K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>Sử dụng: 4h</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Activity className="h-3 w-3 mr-1" />
                          Bắt đầu
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          Đặt trước
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">Bàn số 3</h4>
                          <p className="text-sm text-muted-foreground">100K VNĐ/giờ</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Đã đặt</Badge>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Lịch tiếp theo</span>
                        </div>
                        <div className="text-sm">
                          <div>Phạm Văn D</div>
                          <div className="text-muted-foreground">16:30 - 60 phút</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span>Hôm nay: 300K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-blue-600" />
                          <span>Sử dụng: 3h</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="verification">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Hệ thống xác minh cấp độ</h3>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Star className="h-4 w-4 mr-2" />
                    Xem tiêu chuẩn
                  </Button>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Gửi yêu cầu
                  </Button>
                </div>
              </div>
              
              {/* Verification Stats */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Chờ duyệt</p>
                        <p className="text-2xl font-bold text-orange-600">3</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Cần xem lại</p>
                        <p className="text-2xl font-bold text-blue-600">1</p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Đã hoàn thành</p>
                        <p className="text-2xl font-bold text-green-600">8</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Tổng yêu cầu</p>
                        <p className="text-2xl font-bold text-purple-600">12</p>
                      </div>
                      <Shield className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Verification Requests */}
              <div className="space-y-4">
                <h4 className="font-medium">Yêu cầu gần đây</h4>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Nguyễn Văn A</h4>
                          <p className="text-sm text-muted-foreground">Trung cấp → Cao cấp</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-orange-100 text-orange-800">Chờ duyệt</Badge>
                          <Badge variant="outline">Video demo</Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Elo hiện tại: 1650</span>
                          <span>Yêu cầu: 1800</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="h-2 rounded-full bg-blue-500" style={{ width: '92%' }}></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Duyệt
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1">
                          <XCircle className="h-3 w-3 mr-1" />
                          Từ chối
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Xem
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">Lê Văn C</h4>
                          <p className="text-sm text-muted-foreground">Mới bắt đầu → Trung cấp</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge className="bg-blue-100 text-blue-800">Cần xem lại</Badge>
                          <Badge variant="outline">Demo trực tiếp</Badge>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">Ghi chú từ Expert 1:</span>
                        </div>
                        <p className="text-sm text-blue-800">Cần thể hiện thêm kỹ thuật side spin.</p>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Xem lại
                        </Button>
                        <Button size="sm" className="flex-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hoàn thành
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Cài đặt CLB nâng cao</h3>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Sao lưu cài đặt
                  </Button>
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu thay đổi
                  </Button>
                </div>
              </div>

              {/* Quick Settings Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Giá bàn VIP</p>
                        <p className="text-lg font-bold text-green-600">150K/giờ</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Giờ hoạt động</p>
                        <p className="text-lg font-bold text-blue-600">8:00-23:00</p>
                      </div>
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Thông báo</p>
                        <p className="text-lg font-bold text-purple-600">Đã bật</p>
                      </div>
                      <Bell className="h-6 w-6 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Xác minh</p>
                        <p className="text-lg font-bold text-orange-600">Tự động</p>
                      </div>
                      <Shield className="h-6 w-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Categories */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Thông tin CLB
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tên CLB:</span>
                        <span className="text-sm font-medium">Sabo Pool Club</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Địa điểm:</span>
                        <span className="text-sm font-medium">Hà Nội, Việt Nam</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Liên hệ:</span>
                        <span className="text-sm font-medium">024-1234-5678</span>
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        <Edit className="h-3 w-3 mr-2" />
                        Chỉnh sửa thông tin
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Cài đặt giá cả
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bàn VIP:</span>
                        <span className="text-sm font-medium">150,000 VNĐ/giờ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Bàn thường:</span>
                        <span className="text-sm font-medium">100,000 VNĐ/giờ</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Phí giải đấu:</span>
                        <span className="text-sm font-medium">50K - 500K VNĐ</span>
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        <Edit className="h-3 w-3 mr-2" />
                        Cập nhật giá
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Thông báo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <Badge variant="default">Đã bật</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">SMS:</span>
                        <Badge variant="secondary">Tắt</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Push:</span>
                        <Badge variant="default">Đã bật</Badge>
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        <Bell className="h-3 w-3 mr-2" />
                        Quản lý thông báo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Giải đấu & Thử thách
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Người tối đa:</span>
                        <span className="text-sm font-medium">64 người</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Thể thức mặc định:</span>
                        <span className="text-sm font-medium">Loại trực tiếp</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tự động bracket:</span>
                        <Badge variant="default">Đã bật</Badge>
                      </div>
                      <Button size="sm" className="w-full mt-3">
                        <Trophy className="h-3 w-3 mr-2" />
                        Cài đặt giải đấu
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Tùy chọn nâng cao
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Xác minh cấp độ</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">Tự động duyệt người mới</span>
                          <Badge variant="default">Đã bật</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">Yêu cầu video minh chứng</span>
                          <Badge variant="default">Đã bật</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">Elo tối thiểu thách đấu</span>
                          <span className="text-sm font-medium">1200</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Phân chia giải thưởng</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <span className="text-sm">Giải nhất</span>
                          <span className="text-sm font-bold text-yellow-600">50%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">Giải nhì</span>
                          <span className="text-sm font-bold">30%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="text-sm">Giải ba</span>
                          <span className="text-sm font-bold text-orange-600">20%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Thao tác hệ thống
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <Download className="h-6 w-6 mb-2" />
                      Sao lưu dữ liệu
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Upload className="h-6 w-6 mb-2" />
                      Khôi phục
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      Xuất báo cáo
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <RefreshCw className="h-6 w-6 mb-2" />
                      Làm mới hệ thống
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimpleCLBManagement;
