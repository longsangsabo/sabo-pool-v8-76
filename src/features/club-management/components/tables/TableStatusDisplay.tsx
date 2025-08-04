import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table2 } from 'lucide-react';

interface TableStatus {
  id: string;
  number: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentSession?: {
    startTime: string;
    playerName?: string;
  };
  nextBooking?: {
    startTime: string;
    playerName: string;
  };
}

interface TableStatusDisplayProps {
  tables: TableStatus[];
  onTableClick?: (tableId: string) => void;
}

const statusColors = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
  maintenance: 'bg-gray-500',
};

const statusLabels = {
  available: 'Trống',
  occupied: 'Đang sử dụng',
  reserved: 'Đã đặt trước',
  maintenance: 'Bảo trì',
};

export function TableStatusDisplay({ tables, onTableClick }: TableStatusDisplayProps) {
  const getTimeDisplay = (time: string) => {
    return new Date(time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => (
        <Card
          key={table.id}
          className={`cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => onTableClick?.(table.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Table2 className="w-5 h-5" />
                <span className="font-medium">Bàn {table.number}</span>
              </div>
              <Badge className={statusColors[table.status]}>
                {statusLabels[table.status]}
              </Badge>
            </div>
            {table.currentSession && (
              <div className="text-sm text-gray-600">
                <p>Bắt đầu: {getTimeDisplay(table.currentSession.startTime)}</p>
                {table.currentSession.playerName && (
                  <p>Người chơi: {table.currentSession.playerName}</p>
                )}
              </div>
            )}
            {table.nextBooking && (
              <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                <p>Đặt tiếp theo: {getTimeDisplay(table.nextBooking.startTime)}</p>
                <p>Người đặt: {table.nextBooking.playerName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
