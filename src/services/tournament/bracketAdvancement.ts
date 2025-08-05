/**
 * TOURNAMENT BRACKET ADVANCEMENT SERVICE
 * Handles automatic winner progression in tournament brackets
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdvancementResult {
  success: boolean;
  error?: string;
  winner_id?: string;
  advanced_to_round?: number;
  advanced_to_match?: number;
  tournament_complete?: boolean;
  message?: string;
}

/**
 * Advance winner to next round for single elimination tournaments
 */
export async function advanceWinnerToNextRound(
  matchId: string,
  forceAdvance: boolean = false
): Promise<AdvancementResult> {
  try {
    console.log('🎯 Using new fixed advance function for match:', matchId);

    // Get tournament ID first
    const { data: matchData, error: matchError } = await supabase
      .from('tournament_matches')
      .select('tournament_id')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData?.tournament_id) {
      console.error('❌ Error getting tournament ID:', matchError);
      return {
        success: false,
        error: 'Could not find tournament for match',
      };
    }

    // Use proper repair function with tournament ID
    const { data, error } = await supabase.rpc(
      'repair_double_elimination_bracket',
      {
        p_tournament_id: matchData.tournament_id,
      }
    );

    if (error) {
      console.error('❌ Error in advance_winner_to_next_round:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('✅ Advancement result:', data);
    return data as unknown as AdvancementResult;
  } catch (error: any) {
    console.error('❌ Exception in advanceWinnerToNextRound:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if tournament has any incomplete matches before a specific round
 */
export async function checkTournamentReadiness(
  tournamentId: string,
  beforeRound: number
): Promise<{ ready: boolean; incompleteMatches: number }> {
  try {
    const { data: incompleteMatches, error } = await supabase
      .from('tournament_matches')
      .select('id, round_number, match_number, status')
      .eq('tournament_id', tournamentId)
      .lt('round_number', beforeRound)
      .neq('status', 'completed');

    if (error) {
      console.error('❌ Error checking tournament readiness:', error);
      return { ready: false, incompleteMatches: 0 };
    }

    return {
      ready: incompleteMatches.length === 0,
      incompleteMatches: incompleteMatches.length,
    };
  } catch (error) {
    console.error('❌ Exception checking tournament readiness:', error);
    return { ready: false, incompleteMatches: 0 };
  }
}

/**
 * Fix bracket progression for existing tournaments with completed matches
 */
export async function fixBracketProgression(
  tournamentId: string
): Promise<AdvancementResult> {
  try {
    console.log('🔧 Fixing bracket progression for tournament:', tournamentId);

    // Get all completed matches that need advancement
    const { data: completedMatches, error: matchError } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed')
      .not('winner_id', 'is', null)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true });

    if (matchError) {
      console.error('❌ Error fetching completed matches:', matchError);
      return { success: false, error: matchError.message };
    }

    console.log(
      '🎯 Found completed matches to process:',
      completedMatches?.length || 0
    );

    // Process each completed match for advancement
    let successCount = 0;
    const errors: string[] = [];

    for (const match of completedMatches || []) {
      try {
        const result = await advanceWinnerToNextRound(match.id, true);
        if (result.success) {
          successCount++;
          console.log(
            `✅ Advanced winner from Round ${match.round_number} Match ${match.match_number}`
          );
        } else {
          errors.push(
            `Round ${match.round_number} Match ${match.match_number}: ${result.error}`
          );
        }
      } catch (error: any) {
        errors.push(
          `Round ${match.round_number} Match ${match.match_number}: ${error.message}`
        );
      }
    }

    if (errors.length > 0) {
      console.warn('⚠️ Some advancements failed:', errors);
    }

    return {
      success: successCount > 0,
      message:
        errors.length > 0
          ? `Đã sửa ${successCount} trận, ${errors.length} lỗi`
          : `Đã sửa thành công ${successCount} trận đấu`,
    };
  } catch (error: any) {
    console.error('❌ Exception in fixBracketProgression:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Auto-advance all completed matches in a tournament
 */
export async function autoAdvanceCompletedMatches(
  tournamentId: string
): Promise<void> {
  console.log(
    '🔄 Auto-advancing completed matches for tournament:',
    tournamentId
  );

  try {
    const result = await fixBracketProgression(tournamentId);
    if (result.success) {
      console.log('✅ Auto-advancement completed:', result.message);
    } else {
      console.error('❌ Auto-advancement failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Exception in autoAdvanceCompletedMatches:', error);
  }
}
