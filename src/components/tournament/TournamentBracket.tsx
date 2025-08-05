import React from 'react';
import { useTournaments } from '@/hooks/useTournaments';
import { SingleEliminationBracket } from '../tournaments/SingleEliminationBracket';
import { OptimizedTournamentBracket } from '../tournaments/OptimizedTournamentBracket';

import { SABODoubleEliminationViewer } from '../../tournaments/sabo/SABODoubleEliminationViewer';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TournamentBracketProps {
  tournamentId: string;
  adminMode?: boolean;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournamentId,
  adminMode = false,
}) => {
  const { tournaments, loading } = useTournaments();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Đang tải giải đấu...</span>
      </div>
    );
  }

  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center gap-2 text-destructive'>
            <AlertCircle className='h-5 w-5' />
            <p>Không tìm thấy giải đấu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log('🎯 Tournament Debug:', {
    id: tournament.id,
    name: tournament.name,
    type: tournament.tournament_type,
    status: tournament.status,
  });

  // Check if user is club owner for this tournament
  const isClubOwner =
    user && tournament.club_id && user.id === tournament.created_by;

  // Conditional rendering based on tournament type
  console.log('🎯 Tournament Type Detection:', {
    tournamentType: tournament.tournament_type,
    name: tournament.name,
    id: tournament.id,
  });

  // Enhanced tournament type detection - support both enum and string formats
  const tournamentType =
    tournament.tournament_type?.toString?.().toLowerCase() ||
    'single_elimination';

  console.log('🎯 Enhanced Tournament Type Detection:', {
    originalType: tournament.tournament_type,
    normalizedType: tournamentType,
    name: tournament.name,
    id: tournament.id,
  });

  if (
    tournamentType.includes('single') ||
    tournamentType === 'single_elimination'
  ) {
    console.log(
      '✅ Rendering Enhanced Single Elimination Bracket for:',
      tournament.name
    );
    return (
      <OptimizedTournamentBracket
        tournamentId={tournamentId}
        isClubOwner={isClubOwner || adminMode}
        adminMode={adminMode}
      />
    );
  } else if (
    tournamentType.includes('double') ||
    tournamentType === 'double_elimination'
  ) {
    console.log(
      '✅ Rendering SABO Double Elimination Bracket for:',
      tournament.name
    );
    return (
      <SABODoubleEliminationViewer
        tournamentId={tournamentId}
        isClubOwner={isClubOwner || adminMode}
        adminMode={adminMode}
      />
    );
  } else {
    // Fallback - default to Single Elimination for better compatibility
    console.log(
      '⚠️ Unknown tournament type, defaulting to Single Elimination for:',
      tournament.name
    );
    return (
      <OptimizedTournamentBracket
        tournamentId={tournamentId}
        isClubOwner={isClubOwner || adminMode}
        adminMode={adminMode}
      />
    );
  }
};
