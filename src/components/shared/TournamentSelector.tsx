import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, RefreshCw } from 'lucide-react';
import { useTournamentState } from '@/contexts/TournamentStateContext';
import { toast } from 'sonner';

interface TournamentSelectorProps {
  title?: string;
  showInfo?: boolean;
  className?: string;
}

export const TournamentSelector: React.FC<TournamentSelectorProps> = ({
  title = 'Chọn giải đấu',
  showInfo = true,
  className = '',
}) => {
  const {
    selectedTournamentId,
    setSelectedTournamentId,
    selectedTournament,
    tournaments,
    loading,
    participants,
    refreshAll,
  } = useTournamentState();

  const handleRefresh = async () => {
    await refreshAll();
    toast.success('Đã cập nhật dữ liệu');
  };

  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Trophy className='h-5 w-5' />
            {title}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Làm mới
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={selectedTournamentId}
          onValueChange={setSelectedTournamentId}
          disabled={loading}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Chọn giải đấu để quản lý...' />
          </SelectTrigger>
          <SelectContent className='max-h-96 overflow-y-auto'>
            {tournaments.map(tournament => (
              <SelectItem key={tournament.id} value={tournament.id}>
                <div className='flex items-center justify-between w-full min-w-[300px]'>
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>{tournament.name}</span>
                    <div className='text-xs text-muted-foreground'>
                      {tournament.tournament_type === 'single_elimination'
                        ? 'Loại trực tiếp'
                        : tournament.tournament_type === 'double_elimination'
                          ? 'Loại kép'
                          : tournament.tournament_type}
                    </div>
                  </div>
                  <div className='flex items-center gap-2 ml-4'>
                    <Badge variant='outline' className='text-xs'>
                      {tournament.current_participants || 0}/
                      {tournament.max_participants}
                    </Badge>
                    <Badge
                      variant={
                        tournament.status === 'completed'
                          ? 'default'
                          : tournament.status === 'ongoing'
                            ? 'destructive'
                            : tournament.status === 'cancelled'
                              ? 'secondary'
                              : 'outline'
                      }
                      className='text-xs'
                    >
                      {tournament.status === 'completed'
                        ? 'Hoàn thành'
                        : tournament.status === 'ongoing'
                          ? 'Đang chơi'
                          : tournament.status === 'cancelled'
                            ? 'Đã hủy'
                            : tournament.status === 'upcoming'
                              ? 'Sắp diễn ra'
                              : tournament.status === 'locked'
                                ? 'Đã khóa'
                                : tournament.status === 'registration_open'
                                  ? 'Đăng ký'
                                  : 'Sẵn sàng'}
                    </Badge>
                  </div>
                </div>
              </SelectItem>
            ))}
            {tournaments.length === 0 && (
              <SelectItem value='none' disabled>
                Chưa có giải đấu nào
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Tournament Info */}
        {selectedTournament && showInfo && (
          <div className='mt-4 p-4 bg-muted/50 rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <p className='font-semibold'>{selectedTournament.name}</p>
                <p className='text-sm text-muted-foreground'>
                  {selectedTournament.tournament_type === 'single_elimination'
                    ? 'Loại trực tiếp'
                    : selectedTournament.tournament_type ===
                        'double_elimination'
                      ? 'Loại kép'
                      : selectedTournament.tournament_type}
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4' />
                <span className='text-sm'>
                  {participants.length}/{selectedTournament.max_participants}{' '}
                  người tham gia
                </span>
              </div>
              <div>
                <Badge
                  variant={
                    selectedTournament.status === 'completed'
                      ? 'default'
                      : 'secondary'
                  }
                  className='text-xs'
                >
                  {selectedTournament.status === 'completed'
                    ? 'Đã hoàn thành'
                    : selectedTournament.status === 'ongoing'
                      ? 'Đang diễn ra'
                      : selectedTournament.status === 'locked'
                        ? 'Đã khóa đăng ký'
                        : selectedTournament.status === 'registration_open'
                          ? 'Sẵn sàng'
                          : selectedTournament.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
