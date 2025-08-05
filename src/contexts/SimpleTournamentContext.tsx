import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { RewardsService } from '@/services/RewardsService';
import { TournamentRewards } from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';

interface Tournament {
  id: string;
  created_at: string;
  created_by: string;
  description: string;
  entry_fee: number;
  game_format: string;
  has_third_place_match: boolean;
  management_status: string;
  max_participants: number;
  name: string;
  prize_pool: number;
  registration_end: string;
  registration_start: string;
  rules: string;
  status: string;
  tier_level: number;
  tournament_end: string;
  tournament_start: string;
  tournament_type: string;
  updated_at: string;
  venue_address: string;
  club_id: string;
  banner_image: string;
  contact_info: string;
  first_prize: number;
  second_prize: number;
  third_prize: number;
  // Note: prize_distribution removed - using tournament_prize_tiers
  club_name: string;
  club_address: string;
  current_participants: number;
}

interface SimpleTournamentContextType {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  selectedTournamentId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refreshTournaments: () => Promise<void>;
  calculateRewards: (
    tournamentId: string,
    rank?: RankCode
  ) => TournamentRewards;
  saveTournamentRewards: (
    tournamentId: string,
    rewards: TournamentRewards
  ) => Promise<boolean>;
}

const SimpleTournamentContext = createContext<
  SimpleTournamentContextType | undefined
>(undefined);

export const SimpleTournamentProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTournaments = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select(
          `
          *,
          registrations:tournament_registrations(count)
        `
        )
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const processedTournaments = data.map(tournament => ({
        ...tournament,
        current_participants: tournament.registrations?.length || 0,
        club_name: 'Unknown Club',
        club_address: 'Unknown Address',
        banner_image: (tournament as any).banner_image || '',
        allow_all_ranks: tournament.allow_all_ranks || false,
      }));

      setTournaments(processedTournaments);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch tournaments'
      );
      toast.error('Lỗi khi tải danh sách giải đấu');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshTournaments = useCallback(async () => {
    await fetchTournaments();
  }, [fetchTournaments]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Updated calculateRewards to use RewardsService
  const calculateRewards = useCallback(
    (tournamentId: string, rank: RankCode = 'K'): TournamentRewards => {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        console.warn(
          'Tournament not found for rewards calculation:',
          tournamentId
        );
        return {
          positions: [],
          specialAwards: [],
          totalPrize: 0,
          showPrizes: true,
        }; // Simple fallback
      }

      // Use the TournamentRewardsManager hook to load rewards from tournament_prize_tiers
      console.log(
        '🔄 [SimpleTournamentContext] Loading rewards from tournament_prize_tiers'
      );

      function calculateDefaultRewards(
        tournament: Tournament
      ): TournamentRewards {
        return {
          positions: [
            {
              position: 1,
              name: 'Vô địch',
              cashPrize: tournament.prize_pool * 0.5,
              eloPoints: 100,
              spaPoints: 500,
              items: [],
              isVisible: true,
            },
            {
              position: 2,
              name: 'Á quân',
              cashPrize: tournament.prize_pool * 0.3,
              eloPoints: 75,
              spaPoints: 300,
              items: [],
              isVisible: true,
            },
          ],
          specialAwards: [],
          totalPrize: tournament.prize_pool || 0,
          showPrizes: true,
        };
      }

      const calculatedRewards = calculateDefaultRewards(tournament);
      return calculatedRewards;
    },
    [tournaments]
  );

  // New function to save tournament rewards
  const saveTournamentRewards = useCallback(
    async (
      tournamentId: string,
      rewards: TournamentRewards
    ): Promise<boolean> => {
      try {
        console.log('💾 Saving tournament rewards:', { tournamentId, rewards });

        // Simple validation
        if (!rewards || typeof rewards !== 'object') {
          console.error('❌ Invalid rewards data:', rewards);
          toast.error('Dữ liệu phần thưởng không hợp lệ');
          return false;
        }

        console.log('✅ Rewards validation passed, updating database...');

        const { error } = await supabase
          .from('tournaments')
          .update({
            // Note: saving to tournament_prize_tiers instead
            prize_pool: rewards.totalPrize,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tournamentId);

        if (error) {
          console.error('❌ Database update error:', error);
          throw error;
        }

        console.log('✅ Database updated successfully');

        // Update local state
        setTournaments(prevTournaments =>
          prevTournaments.map(tournament =>
            tournament.id === tournamentId
              ? {
                  ...tournament,
                  // Note: saving to tournament_prize_tiers instead
                  prize_pool: rewards.totalPrize,
                  updated_at: new Date().toISOString(),
                }
              : tournament
          )
        );

        console.log('✅ Local state updated');
        toast.success('Đã lưu phần thưởng giải đấu');
        return true;
      } catch (error) {
        console.error('❌ Error saving tournament rewards:', error);
        toast.error('Lỗi khi lưu phần thưởng giải đấu');
        return false;
      }
    },
    []
  );

  const selectedTournament =
    tournaments.find(t => t.id === selectedTournamentId) || null;

  const value: SimpleTournamentContextType = {
    tournaments,
    selectedTournament,
    selectedTournamentId,
    setSelectedTournamentId,
    loading,
    error,
    refreshTournaments,
    calculateRewards,
    saveTournamentRewards,
  };

  return (
    <SimpleTournamentContext.Provider value={value}>
      {children}
    </SimpleTournamentContext.Provider>
  );
};

export const useSimpleTournament = () => {
  const context = useContext(SimpleTournamentContext);
  if (!context) {
    throw new Error(
      'useSimpleTournament must be used within SimpleTournamentProvider'
    );
  }
  return context;
};

// Also export as useTournament for compatibility
export const useTournament = useSimpleTournament;
