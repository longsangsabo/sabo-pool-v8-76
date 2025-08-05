/**
 * SMART TOURNAMENT SYSTEM - FUNCTION RESOLVER
 * Enterprise-grade function mapping and validation service
 * Prevents function mismatch errors and provides intelligent fallbacks
 */

import { supabase } from '@/integrations/supabase/client';

// Tournament function name constants - UPDATED WITH ACTUALLY EXISTING FUNCTIONS
export const TOURNAMENT_FUNCTIONS = {
  // Double Elimination Functions (✅ VERIFIED EXISTING)
  DOUBLE_ELIMINATION_BRACKET: 'generate_complete_tournament_bracket',
  DOUBLE_ELIMINATION_ENHANCED: 'create_double_elimination_bracket_enhanced',
  ADVANCED_BRACKET: 'generate_advanced_tournament_bracket',

  // Winner Advancement (✅ VERIFIED EXISTING)
  ADVANCE_WINNER: 'advance_winner_to_next_round',
  ADVANCE_WINNER_ENHANCED: 'advance_winner_to_next_round_enhanced',

  // Tournament Management (✅ VERIFIED EXISTING)
  COMPLETE_BRACKET: 'generate_complete_tournament_bracket',
  FORCE_START: 'force_start_tournament',
  FORCE_COMPLETE_STATUS: 'force_complete_tournament_status',
  CALCULATE_RESULTS: 'calculate_tournament_results',
  PROCESS_COMPLETION: 'process_tournament_completion',

  // Legacy Function Names (For Backward Compatibility)
  VALIDATE_BRACKET: 'generate_complete_tournament_bracket', // Fallback to existing function
  SINGLE_ELIMINATION_BRACKET: 'generate_complete_tournament_bracket', // Legacy alias
  SINGLE_ELIMINATION_ADVANCE: 'advance_winner_to_next_round', // Legacy alias

  // Challenge System (✅ VERIFIED EXISTING)
  COMPLETE_CHALLENGE: 'complete_challenge_match',
  COMPLETE_CHALLENGE_BONUSES: 'complete_challenge_match_with_bonuses',

  // Automation & Recovery (✅ VERIFIED EXISTING)
  FIX_PROGRESSION: 'fix_all_tournament_progression',
  MANAGE_STATE: 'manage_tournament_state',
  RECOVER_AUTOMATION: 'recover_tournament_automation',
  GET_AUTOMATION_STATUS: 'get_tournament_automation_status',

  // Tournament Status Management (✅ VERIFIED EXISTING)
  AUTO_UPDATE_STATUS: 'auto_update_single_tournament_status',
  TOURNAMENTS_NEEDING_ATTENTION: 'get_tournaments_needing_attention',
  CHECK_TRIGGERS: 'check_automation_triggers_status',
  CLEANUP_LOGS: 'cleanup_old_automation_logs',

  // Match & Score Management (✅ VERIFIED EXISTING)
  SUBMIT_SCORE: 'submit_match_score',
  VERIFY_RESULT: 'verify_match_result',
  EMERGENCY_COMPLETE: 'emergency_complete_tournament_match',
  EDIT_SCORE: 'edit_confirmed_score',

  // Notification & Stats (✅ VERIFIED EXISTING)
  GET_NOTIFICATION_STATS: 'get_notification_stats',
  MARK_NOTIFICATIONS_READ: 'mark_notifications_read',
} as const;

export type TournamentFunction =
  (typeof TOURNAMENT_FUNCTIONS)[keyof typeof TOURNAMENT_FUNCTIONS];

/**
 * Function existence cache to avoid repeated database queries
 */
const functionCache = new Map<string, boolean>();

/**
 * Validates if a Supabase function exists
 */
export async function validateFunction(
  functionName: TournamentFunction
): Promise<boolean> {
  if (functionCache.has(functionName)) {
    return functionCache.get(functionName)!;
  }

  try {
    const { data, error } = await supabase.rpc('pg_get_function_name' as any, {
      function_name: functionName,
    });

    // If function doesn't exist, RPC will error
    const exists = !error;
    functionCache.set(functionName, exists);
    return exists;
  } catch {
    // Function doesn't exist
    functionCache.set(functionName, false);
    return false;
  }
}

/**
 * Smart function caller with automatic fallbacks
 */
export async function callTournamentFunction<T = any>(
  functionName: TournamentFunction,
  params: Record<string, any> = {},
  fallbacks: TournamentFunction[] = []
): Promise<{ data: T | null; error: any; usedFunction: string }> {
  // Try primary function first
  try {
    const { data, error } = await supabase.rpc(functionName as any, params);

    if (!error) {
      return { data: data as T, error: null, usedFunction: functionName };
    }

    // If error is function not found, try fallbacks
    if (
      error.message?.includes('function') &&
      error.message?.includes('does not exist')
    ) {
      console.warn(`Function ${functionName} not found, trying fallbacks...`);

      for (const fallback of fallbacks) {
        try {
          const { data: fallbackData, error: fallbackError } =
            await supabase.rpc(fallback as any, params);

          if (!fallbackError) {
            console.info(`Successfully used fallback function: ${fallback}`);
            return {
              data: fallbackData as T,
              error: null,
              usedFunction: fallback,
            };
          }
        } catch (fallbackErr) {
          console.warn(`Fallback ${fallback} also failed:`, fallbackErr);
          continue;
        }
      }
    }

    return { data: null, error, usedFunction: functionName };
  } catch (callError) {
    console.error(`Error calling function ${functionName}:`, callError);
    return { data: null, error: callError, usedFunction: functionName };
  }
}

/**
 * Tournament type specific function mappings - UPDATED WITH EXISTING FUNCTIONS
 */
export const TOURNAMENT_TYPE_FUNCTIONS = {
  single_elimination: {
    generateBracket: TOURNAMENT_FUNCTIONS.COMPLETE_BRACKET,
    advanceWinner: TOURNAMENT_FUNCTIONS.ADVANCE_WINNER,
    fallbacks: [TOURNAMENT_FUNCTIONS.ADVANCED_BRACKET] as TournamentFunction[],
  },
  double_elimination: {
    generateBracket: TOURNAMENT_FUNCTIONS.DOUBLE_ELIMINATION_BRACKET,
    advanceWinner: TOURNAMENT_FUNCTIONS.ADVANCE_WINNER_ENHANCED,
    fallbacks: [TOURNAMENT_FUNCTIONS.ADVANCED_BRACKET] as TournamentFunction[],
  },
  round_robin: {
    generateBracket: TOURNAMENT_FUNCTIONS.ADVANCED_BRACKET,
    advanceWinner: TOURNAMENT_FUNCTIONS.ADVANCE_WINNER,
    fallbacks: [TOURNAMENT_FUNCTIONS.COMPLETE_BRACKET] as TournamentFunction[],
  },
} as const;

/**
 * Get appropriate function for tournament type with intelligent fallbacks
 */
export function getFunctionForTournamentType(
  tournamentType: keyof typeof TOURNAMENT_TYPE_FUNCTIONS,
  operation: 'generateBracket' = 'generateBracket'
): { primary: TournamentFunction; fallbacks: TournamentFunction[] } {
  const config = TOURNAMENT_TYPE_FUNCTIONS[tournamentType];

  if (!config) {
    // Default to single elimination if unknown type
    return {
      primary: TOURNAMENT_FUNCTIONS.COMPLETE_BRACKET,
      fallbacks: [TOURNAMENT_FUNCTIONS.ADVANCED_BRACKET],
    };
  }

  return {
    primary: config.generateBracket,
    fallbacks: config.fallbacks,
  };
}

/**
 * Preload and validate all tournament functions
 */
export async function preloadTournamentFunctions(): Promise<{
  available: string[];
  missing: string[];
  total: number;
}> {
  const allFunctions = Object.values(TOURNAMENT_FUNCTIONS);
  const results = await Promise.allSettled(
    allFunctions.map(fn => validateFunction(fn))
  );

  const available: string[] = [];
  const missing: string[] = [];

  results.forEach((result, index) => {
    const functionName = allFunctions[index];
    if (result.status === 'fulfilled' && result.value) {
      available.push(functionName);
    } else {
      missing.push(functionName);
    }
  });

  console.info(
    `Tournament Functions Status: ${available.length}/${allFunctions.length} available`
  );
  if (missing.length > 0) {
    console.warn('Missing functions:', missing);
  }

  return {
    available,
    missing,
    total: allFunctions.length,
  };
}
