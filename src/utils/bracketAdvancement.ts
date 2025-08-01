import { supabase } from '@/integrations/supabase/client';

export interface AdvancementResult {
  success: boolean;
  error?: string;
  data?: any;
}

export const advanceWinner = async (
  matchId: string
): Promise<AdvancementResult> => {
  try {
    // First, get the tournament ID from the match
    const { data: matchData, error: matchError } = await supabase
      .from('tournament_matches')
      .select('tournament_id')
      .eq('id', matchId)
      .single();

    if (matchError || !matchData?.tournament_id) {
      console.error('❌ Error getting tournament ID for match:', matchError);
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
      console.error('❌ Error advancing winner:', error);
      return {
        success: false,
        error: error.message || 'Failed to advance winner',
      };
    }

    if (data && typeof data === 'object' && 'error' in data) {
      console.error('❌ Function returned error:', (data as any).error);
      return {
        success: false,
        error: String((data as any).error),
      };
    }

    console.log('✅ Successfully advanced winner:', data);
    return {
      success: true,
      data: data,
    };
  } catch (err) {
    console.error('❌ Exception in advanceWinner:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

export const fixAllTournamentProgression = async (
  tournamentId: string
): Promise<AdvancementResult> => {
  try {
    console.log('🔧 Starting comprehensive tournament fix for:', tournamentId);

    const { data, error } = await supabase.rpc(
      'fix_all_tournament_progression',
      {
        p_tournament_id: tournamentId,
      }
    );

    if (error) {
      console.error('❌ Error fixing tournament progression:', error);
      return {
        success: false,
        error: error.message || 'Failed to fix tournament progression',
      };
    }

    if (data && typeof data === 'object' && 'error' in data) {
      console.error('❌ Function returned error:', data.error);
      return {
        success: false,
        error: String(data.error),
      };
    }

    console.log('✅ Tournament progression fixed:', data);
    return {
      success: true,
      data: data,
    };
  } catch (err) {
    console.error('❌ Exception in fixAllTournamentProgression:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};

// Auto-fix tournament progression when loading tournament data
export const autoFixTournamentProgression = async (
  tournamentId: string
): Promise<void> => {
  try {
    console.log('🔄 Auto-checking tournament progression for:', tournamentId);

    // Check if tournament needs fixing by looking for inconsistencies
    const { data: matches, error } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('match_number', { ascending: true });

    if (error || !matches) {
      console.error('❌ Error fetching matches for auto-fix:', error);
      return;
    }

    // Check for progression issues
    let needsFix = false;
    const roundGroups = matches.reduce(
      (acc, match) => {
        if (!acc[match.round_number]) acc[match.round_number] = [];
        acc[match.round_number].push(match);
        return acc;
      },
      {} as Record<number, any[]>
    );

    const rounds = Object.keys(roundGroups).map(Number).sort();

    for (let i = 0; i < rounds.length - 1; i++) {
      const currentRound = roundGroups[rounds[i]];
      const nextRound = roundGroups[rounds[i + 1]];

      const completedInCurrent = currentRound.filter(
        m => m.winner_id && m.status === 'completed'
      );
      const emptyInNext = nextRound.filter(m => !m.player1_id || !m.player2_id);

      if (completedInCurrent.length > 0 && emptyInNext.length > 0) {
        needsFix = true;
        console.log(
          `🔧 Found progression issue: Round ${rounds[i]} -> ${rounds[i + 1]}`
        );
        break;
      }
    }

    if (needsFix) {
      console.log('🔧 Auto-fixing tournament progression...');
      await fixAllTournamentProgression(tournamentId);
    } else {
      console.log('✅ Tournament progression is consistent');
    }
  } catch (err) {
    console.error('❌ Error in auto-fix tournament progression:', err);
  }
};
