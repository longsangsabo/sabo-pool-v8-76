import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Users,
  Calendar,
  Settings,
  Play,
  Square,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tournament } from '../../types/tournament.types';
import { format } from 'date-fns';

interface TournamentListProps {
  tournaments: Tournament[];
  onSelect: (tournament: Tournament) => void;
  onStart: (id: string) => void;
  onEnd: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TournamentList({
  tournaments,
  onSelect,
  onStart,
  onEnd,
  onDelete,
}: TournamentListProps) {
  if (!tournaments.length) {
    return (
      <div className="text-center py-6">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">Chưa có giải đấu nào</p>
        <p className="text-sm text-muted-foreground">
          Tạo giải đấu mới để bắt đầu
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'upcoming': { label: 'Sắp diễn ra', variant: 'default' },
      'registration_open': { label: 'Đang mở đăng ký', variant: 'success' },
      'registration_closed': { label: 'Đã đóng đăng ký', variant: 'warning' },
      'ongoing': { label: 'Đang diễn ra', variant: 'primary' },
      'completed': { label: 'Đã kết thúc', variant: 'secondary' },
      'cancelled': { label: 'Đã hủy', variant: 'destructive' },
    };

    const status_info = statusMap[status] || { label: status, variant: 'default' };
    return (
      <Badge variant={status_info.variant as any}>{status_info.label}</Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên giải đấu</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Người tham gia</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => (
            <TableRow key={tournament.id}>
              <TableCell className="font-medium">
                {tournament.name}
              </TableCell>
              <TableCell>
                {getStatusBadge(tournament.status)}
              </TableCell>
              <TableCell>
                {tournament.current_participants}/{tournament.max_participants}
              </TableCell>
              <TableCell>
                {format(new Date(tournament.tournament_start), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(tournament)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                {tournament.status === 'registration_closed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStart(tournament.id)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                {tournament.status === 'ongoing' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEnd(tournament.id)}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                )}
                {['upcoming', 'registration_open'].includes(tournament.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(tournament.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
