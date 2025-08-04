import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  User, 
  Calendar,
  Play,
  Pause,
  Square,
  Settings
} from 'lucide-react';

interface TableStatus {
  id: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentPlayer?: string;
  startTime?: string;
  reservedBy?: string;
  reservedTime?: string;
  hourlyRate: number;
}

interface TableManagementProps {
  clubId: string;
}

export const TableManagement: React.FC<TableManagementProps> = ({ clubId }) => {
  const [tables, setTables] = useState<TableStatus[]>([
    {
      id: 1,
      status: 'occupied',
      currentPlayer: 'Nguyễn Văn A',
      startTime: '14:30',
      hourlyRate: 50000,
    },
    {
      id: 2,
      status: 'available',
      hourlyRate: 50000,
    },
    {
      id: 3,
      status: 'occupied',
      currentPlayer: 'Trần Thị B',
      startTime: '15:00',
      hourlyRate: 50000,
    },
    {
      id: 4,
      status: 'reserved',
      reservedBy: 'Lê Văn C',
      reservedTime: '16:00',
      hourlyRate: 50000,
    },
    {
      id: 5,
      status: 'available',
      hourlyRate: 50000,
    },
    {
      id: 6,
      status: 'maintenance',
      hourlyRate: 50000,
    },
    {
      id: 7,
      status: 'occupied',
      currentPlayer: 'Phạm Thị D',
      startTime: '14:45',
      hourlyRate: 60000,
    },
    {
      id: 8,
      status: 'available',
      hourlyRate: 60000,
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'maintenance': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Đang sử dụng';
      case 'reserved': return 'Đã đặt';
      case 'maintenance': return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Play className="h-4 w-4" />;
      case 'occupied': return <Pause className="h-4 w-4" />;
      case 'reserved': return <Clock className="h-4 w-4" />;
      case 'maintenance': return <Settings className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const getCurrentDuration = (startTime?: string) => {
    if (!startTime) return '';
    const start = new Date();
    const [hours, minutes] = startTime.split(':');
    start.setHours(parseInt(hours), parseInt(minutes), 0);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const handleTableAction = (tableId: number, action: string) => {
    // TODO: Implement table actions (start, stop, reserve, etc.)
    console.log(`Table ${tableId}: ${action}`);
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    utilization: Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100),
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Tổng bàn</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-muted-foreground">Trống</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
            <div className="text-sm text-muted-foreground">Đang sử dụng</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <div className="text-sm text-muted-foreground">Đã đặt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.utilization}%</div>
            <div className="text-sm text-muted-foreground">Tỷ lệ sử dụng</div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Trạng thái bàn chơi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Bàn {table.id}</h3>
                  <Badge className={`${getStatusColor(table.status)} text-white`}>
                    {getStatusIcon(table.status)}
                    <span className="ml-1">{getStatusText(table.status)}</span>
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Giá:</span>
                    <span className="font-medium">
                      {table.hourlyRate.toLocaleString()}đ/h
                    </span>
                  </div>

                  {table.status === 'occupied' && (
                    <>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{table.currentPlayer}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Từ {table.startTime}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Thời gian: {getCurrentDuration(table.startTime)}
                      </div>
                    </>
                  )}

                  {table.status === 'reserved' && (
                    <>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{table.reservedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Lúc {table.reservedTime}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {table.status === 'available' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleTableAction(table.id, 'start')}
                    >
                      Bắt đầu chơi
                    </Button>
                  )}

                  {table.status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleTableAction(table.id, 'stop')}
                    >
                      Kết thúc
                    </Button>
                  )}

                  {table.status === 'reserved' && (
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleTableAction(table.id, 'start')}
                      >
                        Bắt đầu
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTableAction(table.id, 'cancel')}
                      >
                        Hủy
                      </Button>
                    </div>
                  )}

                  {table.status === 'available' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleTableAction(table.id, 'reserve')}
                    >
                      Đặt bàn
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
