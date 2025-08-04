import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '../../../types/tournament.types';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trophy } from 'lucide-react';
import { useClubRole } from '../../../hooks/useClubRole';
import { Loading } from '../../common/Loading';
import { Error } from '../../common/Error';
import { Empty } from '../../common/Empty';

interface TournamentListProps {
  clubId: string;
}

const statusColors = {
  draft: 'secondary',
  scheduled: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
} as const;

export const TournamentList: React.FC<TournamentListProps> = ({ clubId }) => {
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const { permissions } = useClubRole({});

  React.useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call
        const response = await fetch(`/api/clubs/${clubId}/tournaments`);
        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, [clubId]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (tournaments.length === 0) {
    return (
      <Empty 
        message="Chưa có giải đấu nào"
        action={
          permissions.canManageTournaments && (
            <Button variant="outline" onClick={() => {}}>
              <Trophy className="h-4 w-4 mr-2" />
              Tạo giải đấu
            </Button>
          )
        }
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên giải đấu</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead>Số người tham gia</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tournaments.map((tournament) => (
          <TableRow key={tournament.id}>
            <TableCell>{tournament.name}</TableCell>
            <TableCell>
              {new Date(tournament.start_date).toLocaleDateString('vi-VN')}
              {tournament.end_date && ` - ${new Date(tournament.end_date).toLocaleDateString('vi-VN')}`}
            </TableCell>
            <TableCell>
              {tournament.max_participants ? `${0}/${tournament.max_participants}` : 'Không giới hạn'}
            </TableCell>
            <TableCell>
              <Badge variant={statusColors[tournament.status]}>
                {tournament.status === 'draft' && 'Nháp'}
                {tournament.status === 'scheduled' && 'Đã lên lịch'}
                {tournament.status === 'in_progress' && 'Đang diễn ra'}
                {tournament.status === 'completed' && 'Đã kết thúc'}
                {tournament.status === 'cancelled' && 'Đã hủy'}
              </Badge>
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button variant="ghost" size="icon">
                <Eye className="h-4 w-4" />
              </Button>
              {permissions.canManageTournaments && (
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
