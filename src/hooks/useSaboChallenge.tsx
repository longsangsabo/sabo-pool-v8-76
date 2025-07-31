import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculateSaboHandicap, type SaboRank, type HandicapResult } from '@/utils/saboHandicap';

export interface SaboChallengeData {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenge_type: 'sabo' | 'standard';
  race_to: number;
  bet_points: number;
  handicap_data?: {
    challenger_rank: SaboRank;
    opponent_rank: SaboRank;
    handicap_challenger: number;
    handicap_opponent: number;
    rank_difference: number;
    explanation: string;
  };
  status: string;
  created_at: string;
  challenger?: {
    full_name: string;
    current_rank: SaboRank;
    avatar_url?: string;
  };
  opponent?: {
    full_name: string;
    current_rank: SaboRank;
    avatar_url?: string;
  };
}

export function useSaboChallenge() {
  const { user } = useAuth();
  const [userRank, setUserRank] = useState<SaboRank>('K');

  useEffect(() => {
    if (user) {
      fetchUserRank();
    }
  }, [user]);

  const fetchUserRank = async () => {
    if (!user) return;
    
    try {
      // Mock data since current_rank column doesn't exist in profiles
      setUserRank('K');
    } catch (error) {
      console.error('Error fetching user rank:', error);
      setUserRank('K');
    }
  };

  const calculateHandicapForOpponent = (
    opponentRank: SaboRank,
    stakeAmount: number
  ): HandicapResult => {
    return calculateSaboHandicap(userRank, opponentRank, stakeAmount);
  };

  const fetchSaboChallenges = async (): Promise<SaboChallengeData[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          challenger_id,
          opponent_id,
          challenge_type,
          race_to,
          bet_points,
          handicap_data,
          status,
          created_at
        `)
        .eq('challenge_type', 'sabo')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any[])?.map(item => ({
        ...item,
        handicap_data: item.handicap_data as any
      })) as SaboChallengeData[] || [];
    } catch (error) {
      console.error('Error fetching SABO challenges:', error);
      return [];
    }
  };

  const isValidSaboOpponent = (opponentRank: SaboRank): boolean => {
    const result = calculateHandicapForOpponent(opponentRank, 500); // Test with medium stake
    return result.isValid;
  };

  const getSaboHandicapExplanation = (handicapData: any): string => {
    if (!handicapData) return 'Không có dữ liệu handicap';
    
    if (handicapData.handicap_challenger > 0) {
      return `Challenger được cộng ${handicapData.handicap_challenger} bàn`;
    } else if (handicapData.handicap_opponent > 0) {
      return `Opponent được cộng ${handicapData.handicap_opponent} bàn`;
    } else {
      return 'Không có handicap';
    }
  };

  return {
    userRank,
    calculateHandicapForOpponent,
    fetchSaboChallenges,
    isValidSaboOpponent,
    getSaboHandicapExplanation,
    refreshUserRank: fetchUserRank
  };
}