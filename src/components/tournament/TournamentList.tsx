import { TournamentCard } from './TournamentCard';
import { useUnifiedTournamentState } from '@/hooks/useUnifiedTournamentState';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function TournamentList() {
  const { tournaments, isAnyLoading, hasErrors } = useUnifiedTournamentState();

  if (isAnyLoading) {
    return (
      <div className='flex justify-center py-8'>
        <LoadingSpinner />
      </div>
    );
  }

  if (hasErrors) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Có lỗi xảy ra khi tải danh sách giải đấu. Vui lòng thử lại sau.
        </AlertDescription>
      </Alert>
    );
  }

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground text-lg'>
          Chưa có giải đấu nào được tổ chức
        </p>
        <p className='text-muted-foreground text-sm mt-2'>
          Hãy quay lại sau để xem các giải đấu mới nhất
        </p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {tournaments.map(tournament => (
        <TournamentCard key={tournament.id} tournament={tournament as any} />
      ))}
    </div>
  );
}
