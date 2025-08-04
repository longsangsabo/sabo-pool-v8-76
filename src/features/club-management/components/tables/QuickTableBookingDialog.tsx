import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTableManagement } from '../../hooks/useTableManagement';
import { toast } from '@/components/ui/use-toast';

interface QuickTableBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  tableNumber: number;
}

export function QuickTableBookingDialog({
  open,
  onOpenChange,
  tableId,
  tableNumber,
}: QuickTableBookingDialogProps) {
  const { createBooking, loading } = useTableManagement();
  const [formData, setFormData] = React.useState({
    player_name: '',
    start_time: '',
    end_time: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBooking(tableId, {
        player_name: formData.player_name,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        player_id: '', // Optional, can be added later
      });
      toast({
        title: 'Success',
        description: `Đã đặt bàn ${tableNumber} thành công`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Không thể đặt bàn',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt bàn {tableNumber}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="player_name">Tên người chơi</Label>
            <Input
              id="player_name"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="start_time">Thời gian bắt đầu</Label>
            <Input
              id="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_time">Thời gian kết thúc</Label>
            <Input
              id="end_time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang đặt bàn...' : 'Đặt bàn'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
