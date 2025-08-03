import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTournament } from '@/types/tournament-extended';
import {
  TournamentType,
  GameFormat,
  TournamentStatus,
} from '@/types/tournament-enums';
import { useAuth } from '@/hooks/useAuth';

interface TournamentGlobalContextType {
  // Core tournament data
  selectedTournamentId: string | null;
  tournaments: EnhancedTournament[];
  selectedTournament: EnhancedTournament | null;

  // Loading states
  loading: boolean;
  tournamentsLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  setSelectedTournamentId: (id: string | null) => void;
  refreshTournaments: () => Promise<void>;
  clearError: () => void;

  // Computed states
  availableTournaments: EnhancedTournament[];
}

const TournamentGlobalContext = createContext<
  TournamentGlobalContextType | undefined
>(undefined);

export const useTournamentGlobal = () => {
  const context = useContext(TournamentGlobalContext);
  if (!context) {
    throw new Error(
      'useTournamentGlobal must be used within TournamentGlobalProvider'
    );
  }
  return context;
};

interface TournamentGlobalProviderProps {
  children: React.ReactNode;
  clubId?: string;
}

export const TournamentGlobalProvider: React.FC<
  TournamentGlobalProviderProps
> = ({ children, clubId }) => {
  const { user } = useAuth();
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null);
  const [tournaments, setTournaments] = useState<EnhancedTournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchTournaments = useCallback(async () => {
    try {
      setTournamentsLoading(true);
      setError(null);

      console.log(
        '🔍 [TournamentGlobal] Fetching tournaments for clubId:',
        clubId
      );

      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          club:club_profiles(*),
          spa_points_config,
          elo_points_config
        `
        )
        .is('deleted_at', null)
        .in('status', [
          'completed',
          'registration_open',
          'registration_closed',
          'ongoing',
          'upcoming',
        ])
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      console.log(
        '📊 [TournamentGlobal] Raw tournaments data:',
        data?.length || 0
      );
      console.log(
        '📊 [TournamentGlobal] Raw tournaments:',
        data?.map(t => ({ id: t.id, name: t.name, club_id: t.club_id }))
      );

      // Transform to EnhancedTournament format
      const enhancedTournaments: EnhancedTournament[] = (data || []).map(
        tournament => ({
          ...tournament,
          tournament_type: tournament.tournament_type as TournamentType,
          game_format: tournament.game_format as GameFormat,
          status: tournament.status as TournamentStatus,
          contact_info:
            typeof tournament.contact_info === 'string'
              ? tournament.contact_info
              : JSON.stringify(tournament.contact_info || ''),
          min_rank_requirement: tournament.min_rank_requirement as
            | 'E'
            | 'F'
            | 'G'
            | 'H'
            | 'I'
            | 'K'
            | 'K+'
            | 'I+'
            | 'H+'
            | 'G+'
            | 'F+'
            | 'E+'
            | null,
          max_rank_requirement: tournament.max_rank_requirement as
            | 'E'
            | 'F'
            | 'G'
            | 'H'
            | 'I'
            | 'K'
            | 'K+'
            | 'I+'
            | 'H+'
            | 'G+'
            | 'F+'
            | 'E+'
            | null,
          tournament_start: tournament.start_date,
          tournament_end: tournament.end_date,
          club:
            tournament.club &&
            typeof tournament.club === 'object' &&
            !(tournament.club as any)?.error
              ? {
                  id: tournament.club.id,
                  name: tournament.club.club_name,
                  address: tournament.club.address || '',
                }
              : undefined,
          rewards: (() => {
            // Load totalPrize from tournament_prize_tiers table
            // This will be handled by the useTournamentRewardsManager hook

            // Default fallback calculation
            const defaultRewards = {
              totalPrize: tournament.prize_pool || 0,
              showPrizes: true,
              positions: [],
              specialAwards: [],
            };

            console.log(
              '🔄 [TournamentGlobal] Using default rewards:',
              defaultRewards
            );
            return defaultRewards;
          })(),
          eligible_ranks: [],
          allow_all_ranks: true,
          requires_approval: false,
          is_public: true,
          available_slots: Math.max(
            0,
            (tournament.max_participants || 0) -
              (tournament.current_participants || 0)
          ),
          registration_status: calculateRegistrationStatus(tournament),
          time_until_start: tournament.start_date
            ? calculateTimeUntilStart(tournament.start_date)
            : undefined,
        })
      );

      setTournaments(enhancedTournaments);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
    } finally {
      setTournamentsLoading(false);
    }
  }, []);

  const refreshTournaments = useCallback(async () => {
    try {
      console.log('🔄 [TournamentGlobal] Starting refreshTournaments...');
      setLoading(true);
      setError(null);

      await fetchTournaments();
      console.log(
        '✅ [TournamentGlobal] refreshTournaments completed successfully'
      );
    } catch (error) {
      console.error(
        '❌ [TournamentGlobal] Error in refreshTournaments:',
        error
      );
      setError(
        error instanceof Error ? error.message : 'Failed to refresh tournaments'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchTournaments]);

  // Initial load
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tournaments-global')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
        },
        () => {
          fetchTournaments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTournaments]);

  // Helper functions
  const calculateRegistrationStatus = (
    tournament: any
  ): 'not_started' | 'open' | 'closed' | 'ended' => {
    const now = new Date();
    const regStart = tournament.registration_start
      ? new Date(tournament.registration_start)
      : null;
    const regEnd = tournament.registration_end
      ? new Date(tournament.registration_end)
      : null;
    const tournamentEnd = tournament.tournament_end
      ? new Date(tournament.tournament_end)
      : null;

    if (tournamentEnd && now > tournamentEnd) return 'ended';
    if (regEnd && now > regEnd) return 'closed';
    if (regStart && now < regStart) return 'not_started';
    return 'open';
  };

  const calculateTimeUntilStart = (startTime: string): string => {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();

    if (diffMs <= 0) return 'Đã bắt đầu';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 0) return `${days} ngày ${hours} giờ`;
    return `${hours} giờ`;
  };

  // Computed values
  const selectedTournament = selectedTournamentId
    ? tournaments.find(t => t.id === selectedTournamentId) || null
    : null;

  const availableTournaments = clubId
    ? tournaments.filter(t => t.club_id === clubId)
    : tournaments;

  console.log('🔍 [TournamentGlobal] Debug filtering:', {
    clubId,
    totalTournaments: tournaments.length,
    availableTournaments: availableTournaments.length,
    tournamentsWithClubIds: tournaments.map(t => ({
      id: t.id,
      name: t.name,
      club_id: t.club_id,
    })),
  });

  const value: TournamentGlobalContextType = {
    selectedTournamentId,
    tournaments,
    selectedTournament,
    loading,
    tournamentsLoading,
    error,
    setSelectedTournamentId,
    refreshTournaments,
    clearError,
    availableTournaments,
  };

  return (
    <TournamentGlobalContext.Provider value={value}>
      {children}
    </TournamentGlobalContext.Provider>
  );
};
