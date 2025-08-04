import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Table as TableIcon, 
  Clock, 
  Users, 
  Play, 
  Pause, 
  Settings,
  Plus,
  Calendar,
  Timer,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Filter
} from 'lucide-react';

interface Table {
  id: string;
  name: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  current_session?: {
    player1: string;
    player2: string;
    start_time: string;
    duration: number;
    game_type: 'practice' | 'match' | 'tournament';
    score?: string;
  };
  hourly_rate: number;
  total_revenue_today: number;
  usage_hours_today: number;
  next_reservation?: {
    player: string;
    time: string;
    duration: number;
  };
}

interface Reservation {
  id: string;
  table_id: string;
  player_name: string;
  start_time: string;
  duration: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_cost: number;
  created_at: string;
}

export const EnhancedTableManagement = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data
  const tables: Table[] = [
    {
      id: '1',
      name: 'Bàn VIP 1',
      status: 'occupied',
      current_session: {
        player1: 'Nguyễn Văn A',
        player2: 'Trần Văn B',
        start_time: '2024-01-20T14:00:00Z',
        duration: 120,
        game_type: 'match',
        score: '3-2'
      },
      hourly_rate: 150000,
      total_revenue_today: 600000,
      usage_hours_today: 6,
      next_reservation: {
        player: 'Lê Thị C',
        time: '2024-01-20T17:00:00Z',
        duration: 90
      }
    },
    {
      id: '2',
      name: 'Bàn số 2',
      status: 'available',
      hourly_rate: 100000,
      total_revenue_today: 400000,
      usage_hours_today: 4
    },
    {
      id: '3',
      name: 'Bàn số 3',
      status: 'reserved',
      hourly_rate: 100000,
      total_revenue_today: 300000,
      usage_hours_today: 3,
      next_reservation: {
        player: 'Phạm Văn D',
        time: '2024-01-20T16:30:00Z',
        duration: 60
      }
    },
    {
      id: '4',
      name: 'Bàn số 4',
      status: 'maintenance',
      hourly_rate: 100000,
      total_revenue_today: 0,
      usage_hours_today: 0
    }
  ];

  const reservations: Reservation[] = [
    {
      id: '1',
      table_id: '1',
      player_name: 'Lê Thị C',
      start_time: '2024-01-20T17:00:00Z',
      duration: 90,
      status: 'confirmed',
      total_cost: 225000,
      created_at: '2024-01-20T10:00:00Z'
    },
    {
      id: '2',
      table_id: '3',
      player_name: 'Phạm Văn D',
      start_time: '2024-01-20T16:30:00Z',
      duration: 60,
      status: 'confirmed',
      total_cost: 100000,
      created_at: '2024-01-20T09:30:00Z'
    }
  ];

  const getStatusBadge = (status: Table['status']) => {
    const variants = {
      available: { variant: 'default' as const, text: 'Có thể sử dụng', icon: CheckCircle, color: 'text-green-600' },
      occupied: { variant: 'destructive' as const, text: 'Đang sử dụng', icon: Play, color: 'text-red-600' },
      reserved: { variant: 'secondary' as const, text: 'Đã đặt', icon: Clock, color: 'text-blue-600' },
      maintenance: { variant: 'outline' as const, text: 'Bảo trì', icon: AlertCircle, color: 'text-orange-600' }
    };
    
    const { variant, text, icon: Icon } = variants[status];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getGameTypeBadge = (type: string) => {
    const variants = {
      practice: { variant: 'outline' as const, text: 'Luyện tập' },
      match: { variant: 'default' as const, text: 'Đấu thực' },
      tournament: { variant: 'destructive' as const, text: 'Giải đấu' }
    };
    
    const { variant, text } = variants[type as keyof typeof variants] || variants.practice;
    return <Badge variant={variant}>{text}</Badge>;
  };

  const BookingForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Đặt bàn mới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="table">Chọn bàn</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn bàn có sẵn" />
              </SelectTrigger>
              <SelectContent>
                {tables.filter(t => t.status === 'available').map(table => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name} - {table.hourly_rate.toLocaleString()}đ/giờ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="player">Tên người chơi</Label>
            <Input placeholder="Nhập tên người đặt bàn" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Ngày</Label>
            <Input type="date" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Giờ bắt đầu</Label>
            <Input type="time" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Thời lượng (phút)</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Chọn thời lượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 phút</SelectItem>
                <SelectItem value="60">1 giờ</SelectItem>
                <SelectItem value="90">1.5 giờ</SelectItem>
                <SelectItem value="120">2 giờ</SelectItem>
                <SelectItem value="180">3 giờ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowBookingForm(false)}>
            Hủy
          </Button>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Đặt bàn
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TableCard = ({ table }: { table: Table }) => (
    <Card className={`hover:shadow-md transition-all cursor-pointer ${
      selectedTable === table.id ? 'ring-2 ring-blue-500' : ''
    }`} onClick={() => setSelectedTable(selectedTable === table.id ? null : table.id)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-lg">{table.name}</h4>
              <p className="text-sm text-muted-foreground">
                {table.hourly_rate.toLocaleString()}đ/giờ
              </p>
            </div>
            {getStatusBadge(table.status)}
          </div>

          {/* Current Session */}
          {table.current_session && (
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Đang sử dụng</span>
                {getGameTypeBadge(table.current_session.game_type)}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{table.current_session.player1} vs {table.current_session.player2}</span>
                  {table.current_session.score && (
                    <Badge variant="outline">{table.current_session.score}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  {new Date(table.current_session.start_time).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {table.current_session.duration} phút
                </div>
              </div>
            </div>
          )}

          {/* Next Reservation */}
          {table.next_reservation && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Lịch tiếp theo</span>
              </div>
              <div className="text-sm">
                <div>{table.next_reservation.player}</div>
                <div className="text-muted-foreground">
                  {new Date(table.next_reservation.time).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {table.next_reservation.duration} phút
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span>Hôm nay: {table.total_revenue_today.toLocaleString()}đ</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-blue-600" />
              <span>Sử dụng: {table.usage_hours_today}h</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {table.status === 'available' && (
              <>
                <Button size="sm" className="flex-1">
                  <Play className="h-3 w-3 mr-1" />
                  Bắt đầu
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Đặt trước
                </Button>
              </>
            )}
            {table.status === 'occupied' && (
              <Button size="sm" variant="destructive" className="flex-1">
                <Pause className="h-3 w-3 mr-1" />
                Kết thúc
              </Button>
            )}
            {table.status === 'maintenance' && (
              <Button size="sm" variant="outline" className="flex-1">
                <Settings className="h-3 w-3 mr-1" />
                Hoàn tất bảo trì
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const totalRevenue = tables.reduce((sum, table) => sum + table.total_revenue_today, 0);
  const totalUsageHours = tables.reduce((sum, table) => sum + table.usage_hours_today, 0);
  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quản lý bàn chơi</h2>
          <p className="text-muted-foreground">Theo dõi và quản lý việc sử dụng bàn billiards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {viewMode === 'grid' ? 'Xem danh sách' : 'Xem lưới'}
          </Button>
          <Button onClick={() => setShowBookingForm(!showBookingForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Đặt bàn
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bàn có sẵn</p>
                <p className="text-2xl font-bold text-green-600">{availableTables}</p>
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
                <p className="text-2xl font-bold text-red-600">{occupiedTables}</p>
              </div>
              <Play className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Doanh thu hôm nay</p>
                <p className="text-lg font-bold text-blue-600">{totalRevenue.toLocaleString()}đ</p>
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
                <p className="text-2xl font-bold text-purple-600">{totalUsageHours}h</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Form */}
      {showBookingForm && <BookingForm />}

      {/* Tables Grid/List */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {tables.map(table => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>

      {/* Recent Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lịch đặt bàn gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reservations.map(reservation => (
              <div key={reservation.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{reservation.player_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Bàn {tables.find(t => t.id === reservation.table_id)?.name} - 
                    {new Date(reservation.start_time).toLocaleDateString('vi-VN')} 
                    {new Date(reservation.start_time).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{reservation.total_cost.toLocaleString()}đ</div>
                  <Badge variant={reservation.status === 'confirmed' ? 'default' : 'secondary'}>
                    {reservation.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTableManagement;
