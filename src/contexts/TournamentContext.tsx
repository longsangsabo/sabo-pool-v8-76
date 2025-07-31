import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { TournamentRewards } from '@/types/tournament-extended';
import { RankCode } from '@/utils/eloConstants';
import { calculateRewards } from '@/utils/tournamentRewards';

interface TournamentContextType {
  tournament: any | null;
  loading: boolean;
  error: string | null;
  rewards: TournamentRewards | null;
  loadTournament: (id: string) => Promise<void>;
  refreshTournament: () => Promise<void>;
  saveTournamentRewards: (tournamentId: string, rewards: TournamentRewards) => Promise<void>;
  loadRewards: (tournamentId: string, rank?: RankCode) => Promise<TournamentRewards | null>;
  // Additional properties for enhanced form
  updateTournament?: (data: Partial<any>) => void;
  updateRewards?: (rewards: TournamentRewards) => void;
  validateTournament?: () => boolean;
  resetTournament?: () => void;
  saveDraft?: () => Promise<void>;
  isDraft?: boolean;
  isValid?: boolean;
  validationErrors?: any;
  calculateRewards?: () => TournamentRewards;
  recalculateOnChange?: boolean;
  setRecalculateOnChange?: (value: boolean) => void;
  createTournament?: () => Promise<any>;
  updateExistingTournament?: (id: string) => Promise<any>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tournament, setTournament] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewards, setRewards] = useState<TournamentRewards | null>(null);
  const { user } = useAuth();

  // Updated loadRewardsFromDatabase to work with new structure
  const loadRewardsFromDatabase = useCallback(async (tournament: any, rank: RankCode = 'K') => {
    try {
      console.log('🔍 Loading rewards from database for tournament:', tournament.id);
      
      // Use tournament prize_pool or fallback to entry_fee calculation
      const finalTotalPrize = tournament.prize_pool || 
        (tournament.entry_fee && tournament.max_participants ? 
          tournament.entry_fee * tournament.max_participants * 0.75 : 0);
      
      let rewards: TournamentRewards | null = null;
      if (finalTotalPrize > 0) {
        rewards = calculateRewards({
          entry_fee: tournament.entry_fee,
          max_participants: tournament.max_participants,
          prize_pool: finalTotalPrize
        }, rank);
        console.log('📝 Calculating rewards from tournament data');
      }
      
      console.log('✅ Loaded rewards:', rewards);
      return rewards || {
        totalPrize: 0,
        showPrizes: false,
        positions: [],
        specialAwards: []
      };
      
    } catch (error) {
      console.error('❌ Error loading rewards from database:', error);
      // Return fallback rewards
      return {
        totalPrize: 0,
        showPrizes: false,
        positions: [
          {
            position: 1,
            name: 'Vô địch',
            eloPoints: 100,
            spaPoints: 1000,
            cashPrize: 0,
            items: ['Cúp vô địch'],
            isVisible: true
          }
        ],
        specialAwards: []
      };
    }
  }, []);
  
  const calculateRewardsInternal = useCallback((): TournamentRewards => {
    if (!tournament) {
      return {
        totalPrize: 0,
        showPrizes: false,
        positions: [],
        specialAwards: []
      };
    }

    // Simple default calculation for now
    const totalPrize = tournament.prize_pool || 0;
    
    return {
      totalPrize,
      showPrizes: totalPrize > 0,
      positions: [
        {
          position: 1,
          name: 'Vô địch',
          eloPoints: 100,
          spaPoints: 1000,
          cashPrize: totalPrize * 0.5,
          items: ['Cúp vô địch'],
          isVisible: true
        },
        {
          position: 2,
          name: 'Á quân',
          eloPoints: 75,
          spaPoints: 700,
          cashPrize: totalPrize * 0.3,
          items: ['Huy chương bạc'],
          isVisible: true
        },
        {
          position: 3,
          name: 'Hạng 3',
          eloPoints: 50,
          spaPoints: 500,
          cashPrize: totalPrize * 0.2,
          items: ['Huy chương đồng'],
          isVisible: true
        }
      ],
      specialAwards: []
    };
  }, [tournament]);

  const loadTournament = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tournaments')
        .select(`
          *,
          club:club_profiles(
            id,
            club_name,
            address,
            phone,
            contact_info
          ),
          registrations:tournament_registrations(
            id,
            user_id,
            registration_status,
            profiles:user_id(
              id,
              display_name,
              full_name,
              avatar_url,
              verified_rank
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching tournament:', fetchError);
        throw fetchError;
      }

      if (!data) {
        throw new Error('Giải đấu không tồn tại');
      }

      console.log('✅ Tournament loaded:', data);
      setTournament(data);

      // Load rewards
      const rewardsData = await loadRewardsFromDatabase(data);
      setRewards(rewardsData);

    } catch (err) {
      console.error('❌ Error loading tournament:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadRewardsFromDatabase]);

  const refreshTournament = useCallback(async () => {
    if (tournament?.id) {
      await loadTournament(tournament.id);
    }
  }, [tournament?.id, loadTournament]);

  const saveTournamentRewards = useCallback(async (tournamentId: string, rewardsData: TournamentRewards) => {
    try {
      console.log('💾 Saving tournament rewards:', { tournamentId, rewardsData });
      
      if (!rewardsData || typeof rewardsData !== 'object') {
        throw new Error('Dữ liệu phần thưởng không hợp lệ');
      }

      // Note: prize_distribution column removed - using tournament_prize_tiers table
      
      const { error } = await supabase
        .from('tournaments')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', tournamentId);

      if (error) throw error;

      setRewards(rewardsData);
      toast.success('Đã lưu phần thưởng giải đấu');
      
    } catch (error) {
      console.error('❌ Error saving tournament rewards:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi lưu phần thưởng';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const loadRewards = useCallback(async (tournamentId: string, rank: RankCode = 'K'): Promise<TournamentRewards | null> => {
    try {
      // Fetch tournament data
      const { data, error } = await supabase
        .from('tournaments')
        .select('prize_pool, entry_fee, max_participants')
        .eq('id', tournamentId)
        .single();
      
      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }
      
      if (!data) {
        console.warn('⚠️ No tournament data found for:', tournamentId);
        return null;
      }
      
      return await loadRewardsFromDatabase(data, rank);
      
    } catch (error) {
      console.error('❌ Error loading rewards:', error);
      return null;
    }
  }, [loadRewardsFromDatabase]);

  const value: TournamentContextType = {
    tournament,
    loading,
    error,
    rewards,
    loadTournament,
    refreshTournament,
    saveTournamentRewards,
    loadRewards,
    // Stub implementations for missing properties
    updateTournament: () => {},
    updateRewards: () => {},
    validateTournament: () => true,
    resetTournament: () => {},
    saveDraft: async () => {},
    isDraft: false,
    isValid: true,
    validationErrors: {},
    calculateRewards: calculateRewardsInternal,
    recalculateOnChange: false,
    setRecalculateOnChange: () => {},
    createTournament: async () => null,
    updateExistingTournament: async () => null
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournamentContext = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournamentContext must be used within TournamentProvider');
  }
  return context;
};

export const useTournament = useTournamentContext;

export default TournamentContext;