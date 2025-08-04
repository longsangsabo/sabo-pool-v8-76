import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';

interface TablesStatusProps {
  clubId: string;
}

export const TablesStatus: React.FC<TablesStatusProps> = ({ clubId }) => {
  // TODO: Fetch real table status data
  const tables = [
    { id: 1, status: 'occupied', player: 'Nguyễn Văn A', startTime: '14:30' },
    { id: 2, status: 'available', player: null, startTime: null },
    { id: 3, status: 'occupied', player: 'Trần Thị B', startTime: '15:00' },
    { id: 4, status: 'reserved', player: 'Lê Văn C', startTime: '16:00' },
    { id: 5, status: 'available', player: null, startTime: null },
    { id: 6, status: 'occupied', player: 'Phạm Thị D', startTime: '14:45' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-red-500';
      case 'reserved':
        return 'bg-yellow-500';
      case 'available':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'Đang sử dụng';
      case 'reserved':
        return 'Đã đặt';
      case 'available':
        return 'Trống';
      default:
        return 'Không xác định';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái bàn chơi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Bàn {table.id}</span>
                <Badge className={`${getStatusColor(table.status)} text-white`}>
                  {getStatusText(table.status)}
                </Badge>
              </div>
              {table.player && (
                <div className="text-sm text-muted-foreground">
                  {table.player}
                </div>
              )}
              {table.startTime && (
                <div className="text-xs text-muted-foreground">
                  Từ {table.startTime}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
