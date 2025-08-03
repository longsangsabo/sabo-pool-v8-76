import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// SABO Challenge interface matching the challenges table
export interface SaboChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  stake_amount: number;
  race_to: number;
  handicap_1_rank: number;
  handicap_05_rank: number;
  message?: string;
  status:
    | 'pending'
    | 'accepted'
    | 'declined'
    | 'ongoing'
    | 'completed'
    | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  completed_at?: string;
  challenger_final_score?: number;
  opponent_final_score?: number;
  winner_id?: string;

  // Relations
  challenger?: {
    id: string;
    full_name: string;
    display_name?: string;
    current_elo: number;
    current_rank: string;
    avatar_url?: string;
  };
  opponent?: {
    id: string;
    full_name: string;
    display_name?: string;
    current_elo: number;
    current_rank: string;
    avatar_url?: string;
  };
}

interface CreateChallengeData {
  opponent_id: string;
  stake_amount: number;
  message?: string;
}

// SABO Race-to mapping
const RACE_TO_TABLE = {
  100: 8,
  200: 12,
  300: 14,
  400: 16,
  500: 18,
  600: 22,
};

// SABO Handicap mapping
const HANDICAP_TABLE = {
  100: { main_rank: 1, sub_rank: 0.5 },
  200: { main_rank: 1.5, sub_rank: 1 },
  300: { main_rank: 2, sub_rank: 1.5 },
  400: { main_rank: 2.5, sub_rank: 1.5 },
  500: { main_rank: 3, sub_rank: 2 },
  600: { main_rank: 3.5, sub_rank: 2.5 },
};

const MAIN_RANKS = ['K', 'I', 'H', 'G', 'F', 'E'];

export function useSaboChallenges() {
  const [challenges, setChallenges] = useState<SaboChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Helper: Parse rank into main and sub components
  const parseRank = (rank: string) => {
    const mainRank = rank.replace('+', '');
    const hasPlus = rank.includes('+');
    return { mainRank, hasPlus, mainIndex: MAIN_RANKS.indexOf(mainRank) };
  };

  // Helper: Calculate handicap between two players
  const calculateHandicap = (
    challengerRank: string,
    opponentRank: string,
    stake: number
  ) => {
    const challenger = parseRank(challengerRank);
    const opponent = parseRank(opponentRank);

    const rankDiff = Math.abs(challenger.mainIndex - opponent.mainIndex);
    if (rankDiff > 1) {
      throw new Error(
        `Invalid challenge: Can only challenge within ±1 main rank. Difference: ${rankDiff}`
      );
    }

    let handicapChallenger = 0;
    let handicapOpponent = 0;

    if (rankDiff === 1) {
      const handicapAmount =
        HANDICAP_TABLE[stake as keyof typeof HANDICAP_TABLE].main_rank;
      if (challenger.mainIndex > opponent.mainIndex) {
        handicapOpponent = handicapAmount;
      } else {
        handicapChallenger = handicapAmount;
      }
    } else if (rankDiff === 0 && challenger.hasPlus !== opponent.hasPlus) {
      const handicapAmount =
        HANDICAP_TABLE[stake as keyof typeof HANDICAP_TABLE].sub_rank;
      if (challenger.hasPlus && !opponent.hasPlus) {
        handicapOpponent = handicapAmount;
      } else if (!challenger.hasPlus && opponent.hasPlus) {
        handicapChallenger = handicapAmount;
      }
    }

    return { handicapChallenger, handicapOpponent };
  };

  // Helper: Validate stake amount
  const validateStake = (stake: number): boolean => {
    return Object.keys(RACE_TO_TABLE).map(Number).includes(stake);
  };

  // Fetch challenges from database
  const fetchChallenges = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('challenges')
        .select(
          `
          *,
          challenger:profiles!challenger_id(
            user_id, full_name, display_name, avatar_url
          ),
          opponent:profiles!opponent_id(
            user_id, full_name, display_name, avatar_url
          )
        `
        )
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform to SaboChallenge format with proper type casting
      const transformedData: SaboChallenge[] = (data || []).map(
        (item: any) => ({
          id: item.id,
          challenger_id: item.challenger_id,
          opponent_id: item.opponent_id || '',
          stake_amount: item.bet_points || 0,
          race_to: item.race_to || 8,
          handicap_1_rank: item.handicap_1_rank || 0,
          handicap_05_rank: item.handicap_05_rank || 0,
          message: item.message,
          status: item.status as any,
          created_at: item.created_at,
          expires_at: item.expires_at || '',
          accepted_at: item.responded_at,
          score_confirmation_timestamp: item.score_confirmation_timestamp,
          challenger_final_score: item.challenger_final_score || 0,
          opponent_final_score: item.opponent_final_score || 0,
          winner_id: undefined, // Not in challenges table yet
          challenger: item.challenger
            ? {
                id: item.challenger.user_id,
                full_name: item.challenger.full_name,
                display_name: item.challenger.display_name,
                current_elo: 1000, // Default value
                current_rank: 'K', // Default value
                avatar_url: item.challenger.avatar_url,
              }
            : undefined,
          opponent: item.opponent
            ? {
                id: item.opponent.user_id,
                full_name: item.opponent.full_name,
                display_name: item.opponent.display_name,
                current_elo: 1000, // Default value
                current_rank: 'K', // Default value
                avatar_url: item.opponent.avatar_url,
              }
            : undefined,
        })
      );

      setChallenges(transformedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch challenges';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create new SABO challenge
  const createChallenge = async (challengeData: CreateChallengeData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      if (!validateStake(challengeData.stake_amount)) {
        throw new Error(
          'Invalid stake amount. Must be 100, 200, 300, 400, 500, or 600 SPA'
        );
      }

      // Calculate race-to (simplified without rank checking for now)
      const raceTo =
        RACE_TO_TABLE[challengeData.stake_amount as keyof typeof RACE_TO_TABLE];

      // Default handicap values for now (can be enhanced later)
      const handicapChallenger = 0;
      const handicapOpponent = 0;

      // Create challenge using existing table structure
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      const newChallenge = {
        challenger_id: user.id,
        opponent_id: challengeData.opponent_id,
        bet_points: challengeData.stake_amount,
        race_to: raceTo,
        handicap_1_rank: handicapChallenger.toString(),
        handicap_05_rank: handicapOpponent.toString(),
        message: challengeData.message,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('challenges')
        .insert([newChallenge])
        .select(
          `
          *,
          challenger:profiles!challenger_id(
            user_id, full_name, display_name, avatar_url
          ),
          opponent:profiles!opponent_id(
            user_id, full_name, display_name, avatar_url
          )
        `
        )
        .single();

      if (insertError) throw insertError;

      // Transform and add to state
      const transformedChallenge: SaboChallenge = {
        id: data.id,
        challenger_id: data.challenger_id,
        opponent_id: data.opponent_id || '',
        stake_amount: (data as any).bet_points || 0,
        race_to: (data as any).race_to || 8,
        handicap_1_rank: (data as any).handicap_1_rank || 0,
        handicap_05_rank: (data as any).handicap_05_rank || 0,
        message: (data as any).message || data.challenge_message || '',
        status: data.status as any,
        created_at: data.created_at,
        expires_at:
          (data as any).expires_at ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        challenger: (data as any).challenger
          ? {
              id: (data as any).challenger.user_id,
              full_name: (data as any).challenger.full_name,
              display_name: (data as any).challenger.display_name,
              current_elo: 1000,
              current_rank: 'K',
              avatar_url: (data as any).challenger.avatar_url,
            }
          : undefined,
        opponent: (data as any).opponent
          ? {
              id: (data as any).opponent.user_id,
              full_name: (data as any).opponent.full_name,
              display_name: (data as any).opponent.display_name,
              current_elo: 1000,
              current_rank: 'K',
              avatar_url: (data as any).opponent.avatar_url,
            }
          : undefined,
      };

      setChallenges(prev => [transformedChallenge, ...prev]);
      toast.success(
        `Challenge created! Race-to ${raceTo} with handicap: You ${handicapChallenger} - Opponent ${handicapOpponent}`
      );

      return transformedChallenge;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Accept challenge
  const acceptChallenge = async (challengeId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('challenges')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', challengeId)
        .eq('opponent_id', user.id)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Challenge not found or already processed');

      setChallenges(prev =>
        prev.map(challenge =>
          challenge.id === challengeId
            ? {
                ...challenge,
                status: 'accepted',
                accepted_at: data.responded_at,
              }
            : challenge
        )
      );

      toast.success('Challenge accepted!');
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to accept challenge';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('challenges_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
          filter: `or(challenger_id.eq.${user.id},opponent_id.eq.${user.id})`,
        },
        () => fetchChallenges()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  return {
    challenges,
    loading,
    error,
    fetchChallenges,
    createChallenge,
    acceptChallenge,
    // Helper functions for UI
    calculateHandicap,
    validateStake,
    RACE_TO_TABLE,
    HANDICAP_TABLE,
  };
}
