import React from 'react';
import { PoolTable } from '../../../types/table.types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClubRole } from '../../hooks/useClubRole';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TableForm } from './TableForm';

interface TableGridProps {
  clubId: string;
}

const statusColors = {
  available: 'success',
  occupied: 'warning',
  maintenance: 'destructive',
  reserved: 'secondary',
} as const;

const statusLabels = {
  available: 'Trống',
  occupied: 'Đang sử dụng',
  maintenance: 'Bảo trì',
  reserved: 'Đã đặt',
} as const;

export const TableGrid: React.FC<TableGridProps> = ({ clubId }) => {
  const [tables, setTables] = React.useState<PoolTable[]>([]);
  const [selectedTable, setSelectedTable] = React.useState<PoolTable | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { permissions } = useClubRole({});

  React.useEffect(() => {
    const fetchTables = async () => {
      try {
        // TODO: Implement API call
        const response = await fetch(`/api/clubs/${clubId}/tables`);
        const data = await response.json();
        setTables(data);
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };

    fetchTables();
  }, [clubId]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {tables.map((table) => (
        <Card
          key={table.id}
          className={cn(
            'cursor-pointer hover:shadow-md transition-shadow',
            selectedTable?.id === table.id && 'ring-2 ring-primary'
          )}
          onClick={() => setSelectedTable(table)}
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <h3 className="text-xl font-semibold">Bàn {table.table_number}</h3>
              <Badge variant={statusColors[table.status]}>
                {statusLabels[table.status]}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {table.type} - {table.size}
              </p>
              <p className="font-medium">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(table.hourly_rate)}/giờ
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedTable && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bàn {selectedTable.table_number}</DialogTitle>
            </DialogHeader>
            {selectedTable.status === 'available' ? (
              <div className="space-y-4">
                <Button className="w-full" onClick={() => {}}>
                  Bắt đầu phiên chơi mới
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {}}>
                  Đặt trước
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Show current session or reservation info */}
              </div>
            )}
            {permissions.canManageClub && (
              <>
                <Button variant="outline" className="w-full" onClick={() => {}}>
                  Chỉnh sửa thông tin
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => {}}>
                  Đánh dấu bảo trì
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
