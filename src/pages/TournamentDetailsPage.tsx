import { useParams, Navigate } from 'react-router-dom';
import { EnhancedTournamentDetailsModal } from '@/components/tournament/EnhancedTournamentDetailsModal';
import { useTournament } from '@/hooks/useTournament';
import { useEffect } from 'react';

export default function TournamentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { setSelectedTournamentId, selectedTournament } = useTournament();

  useEffect(() => {
    if (id) {
      setSelectedTournamentId(id);
    }
  }, [id, setSelectedTournamentId]);

  if (!id) {
    return <Navigate to='/tournaments' replace />;
  }

  return (
    <div className='min-h-screen bg-background'>
      <EnhancedTournamentDetailsModal
        tournament={
          selectedTournament
            ? {
                ...selectedTournament,
                club_id: selectedTournament.club_id || '',
                first_prize: 0,
                second_prize: 0,
                third_prize: 0,
                management_status: selectedTournament.management_status as
                  | 'open'
                  | 'ongoing'
                  | 'completed'
                  | 'locked'
                  | undefined,
                club: selectedTournament.club
                  ? {
                      ...selectedTournament.club,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }
                  : undefined,
              }
            : null
        }
        open={true}
        onOpenChange={() => window.history.back()}
      />
    </div>
  );
}
