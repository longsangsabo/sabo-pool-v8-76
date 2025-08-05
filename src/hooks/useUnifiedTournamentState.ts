import { useTournament } from './useTournament';
import { useTournamentRegistrations } from './useTournamentRegistrations';
import { useTournamentMatches } from './useTournamentMatches';
import { useModuleLoading } from '@/contexts/LoadingStateContext';
import { useModuleError } from '@/contexts/ErrorStateContext';
import { useAutoAdvancement } from './useAutoAdvancement';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified hook that combines all tournament-related functionality
 * This replaces the need for multiple hooks in components
 */
export const useUnifiedTournamentState = (tournamentId?: string) => {
  const tournament = useTournament();
  const { loading: registrationsLoading } = useModuleLoading('registrations');
  const { loading: matchesLoading } = useModuleLoading('matches');
  const { errors: registrationErrors } = useModuleError('registrations');
  const { errors: matchErrors } = useModuleError('matches');
  const { processAutomaticAdvancement, isProcessing: isAutoAdvancing } =
    useAutoAdvancement();

  // Use provided tournamentId or selected one
  const effectiveTournamentId = tournamentId || tournament.selectedTournamentId;

  // Get registrations for the tournament
  const registrations = useTournamentRegistrations(effectiveTournamentId || '');

  // Get matches for the tournament
  const matches = useTournamentMatches(effectiveTournamentId);

  // Process participants from registrations
  const participants = registrations.registrations
    .filter(r => r.registration_status === 'confirmed')
    .map((r, index) => ({
      id: r.user_id,
      name: r.player?.full_name || r.player?.display_name || 'Unknown Player',
      displayName:
        r.player?.display_name || r.player?.full_name || 'Unknown Player',
      rank:
        (r.player as any)?.verified_rank ||
        (r.player as any)?.current_rank ||
        'Unranked',
      avatarUrl: r.player?.avatar_url,
      elo: r.player?.elo || 1000,
      registrationOrder: (r as any)?.priority_order || index + 1,
    }))
    .sort((a, b) => {
      if (a.registrationOrder !== b.registrationOrder) {
        return a.registrationOrder - b.registrationOrder;
      }
      return b.elo - a.elo;
    });

  return {
    // Tournament data
    tournaments: tournament.tournaments,
    selectedTournament: tournament.selectedTournament,
    selectedTournamentId: effectiveTournamentId,
    setSelectedTournamentId: tournament.setSelectedTournamentId,

    // Loading states
    tournamentsLoading: tournament.tournamentsLoading,
    registrationsLoading,
    matchesLoading,
    isAnyLoading:
      tournament.isLoading ||
      registrationsLoading ||
      matchesLoading ||
      isAutoAdvancing,
    isAutoAdvancing,

    // Error states
    tournamentErrors: tournament.hookErrors,
    registrationErrors,
    matchErrors,
    hasErrors:
      tournament.hookErrors.length > 0 ||
      registrationErrors.length > 0 ||
      matchErrors.length > 0,

    // Data
    registrations: registrations.registrations,
    participants,
    matches: matches.matches,

    // Actions
    refreshTournaments: tournament.refreshTournaments,
    fetchRegistrations: registrations.fetchRegistrations,
    refetchMatches: matches.refetch,
    processAutomaticAdvancement,

    // Utility
    refreshAll: async () => {
      await tournament.refreshTournaments();
      registrations.fetchRegistrations();
      matches.refetch();

      // Auto-repair bracket if needed then advance
      if (effectiveTournamentId) {
        // First try bracket repair for consistency using new coordinator
        try {
          const { data: repairResult } = await supabase.rpc(
            'repair_double_elimination_bracket',
            {
              p_tournament_id: tournamentId,
            }
          );
          console.log('🔧 Bracket repair result:', repairResult);
        } catch (error) {
          console.warn('Repair attempt failed:', error);
        }

        // Then process auto advancement
        processAutomaticAdvancement(effectiveTournamentId);
      }
    },
  };
};
