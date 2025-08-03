// Database schema validation utility
// This ensures our code only references columns that actually exist in the database

export const SCHEMA_DEFINITIONS = {
  profiles: {
    columns: [
      'id',
      'user_id',
      'full_name',
      'display_name',
      'email',
      'phone',
      'avatar_url',
      'role',
      'skill_level',
      'verified_rank',
      'city',
      'district',
      'is_admin',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'user_id', 'full_name', 'email'],
  },
  challenges: {
    columns: [
      'id',
      'challenger_id',
      'opponent_id',
      'club_id',
      'bet_points',
      'race_to',
      'status',
      'challenger_final_score',
      'opponent_final_score',
      'challenger_submitted_score',
      'opponent_submitted_score',
      'challenger_score_submitted_at',
      'opponent_score_submitted_at',
      'score_confirmation_timestamp',
      'score_confirmation_status',
      'score_entered_by',
      'score_confirmed_by',
      'club_confirmed',
      'club_confirmed_by',
      'club_confirmed_at',
      'message',
      'location',
      'handicap_1_rank',
      'handicap_05_rank',
      'stake_amount',
      'stake_type',
      'scheduled_time',
      'responded_at',
      'response_message',
      'challenge_type',
      'is_open_challenge',
      'is_visible',
      'expires_at',
      'deleted_at',
      'admin_created_by',
      'admin_notes',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'challenger_id', 'bet_points'],
    // NOTE: challenges table does NOT have:
    // - winner_id (winner determined by score comparison)
    // - loser_id (loser determined by score comparison)
    // - completed_at (use score_confirmation_timestamp instead)
    // - challenger_score (use challenger_final_score instead)
    // - opponent_score (use opponent_final_score instead)
  },
  matches: {
    columns: [
      'id',
      'player1_id',
      'player2_id',
      'winner_id',
      'status',
      'score1',
      'score2',
      'match_date',
      'duration_minutes',
      'club_id',
      'table_number',
      'tournament_id',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'player1_id', 'player2_id', 'status'],
  },
  notifications: {
    columns: [
      'id',
      'user_id',
      'title',
      'message',
      'type',
      'read',
      'priority',
      'metadata',
      'url',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'user_id', 'title', 'message', 'type'],
  },
  clubs: {
    columns: [
      'id',
      'name',
      'address',
      'verified',
      'status',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'name'],
  },
  club_profiles: {
    columns: [
      'id',
      'user_id',
      'club_name',
      'address',
      'phone',
      'verification_status',
      'verified_at',
      'verified_by',
      'verification_notes',
      'operating_hours',
      'number_of_tables',
      'is_visible',
      'deleted_at',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'user_id', 'club_name', 'address', 'phone'],
  },
  tournaments: {
    columns: [
      'id',
      'name',
      'description',
      'tournament_type',
      'status',
      'registration_start',
      'registration_end',
      'tournament_start',
      'tournament_end',
      'max_participants',
      'entry_fee',
      'prize_pool',
      'club_id',
      'created_by',
      'tournament_format',
      'rules',
      'banner_image',
      'is_visible',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'name', 'tournament_type', 'status'],
  },
  tournament_registrations: {
    columns: [
      'id',
      'tournament_id',
      'player_id',
      'registration_status',
      'payment_status',
      'status',
      'registration_date',
      'added_by_admin',
      'admin_notes',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'tournament_id', 'player_id'],
  },
  tournament_matches: {
    columns: [
      'id',
      'tournament_id',
      'round_number',
      'match_number',
      'player1_id',
      'player2_id',
      'winner_id',
      'loser_id',
      'player1_score',
      'player2_score',
      'status',
      'scheduled_time',
      'started_at',
      'completed_at',
      'is_third_place_match',
      'match_notes',
      'live_stream_url',
      'bracket_type',
      'match_stage',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'tournament_id', 'round_number', 'match_number'],
    // SABO CONSTRAINTS:
    // - round_number: 1,2,3,101,102,103,201,202,250,300 ONLY
    // - bracket_type: 'winners','losers','semifinals','finals' ONLY
    // - Total matches per tournament: 27 (SABO structure)
  },
  tournament_seeding: {
    columns: [
      'id',
      'tournament_id',
      'user_id',
      'seed_position',
      'seeding_method',
      'created_at',
      'updated_at',
    ],
    required: ['tournament_id', 'user_id', 'seed_position'],
  },
  wallets: {
    columns: [
      'id',
      'user_id',
      'balance',
      'points_balance',
      'status',
      'created_at',
      'updated_at',
    ],
    required: ['id', 'user_id'],
  },
  player_rankings: {
    columns: [
      'id',
      'player_id',
      'user_id',
      'elo_points',
      'elo',
      'spa_points',
      'total_matches',
      'wins',
      'losses',
      'win_streak',
      'longest_win_streak',
      'rank_points',
      'verified_rank',
      'verified_at',
      'verified_by',
      'club_verified',
      'is_visible',
      'created_at',
      'updated_at',
    ],
    required: ['player_id'],
  },
} as const;

/**
 * Validates if a column exists in a table schema
 */
export function validateColumn(table: string, column: string): boolean {
  const tableSchema =
    SCHEMA_DEFINITIONS[table as keyof typeof SCHEMA_DEFINITIONS];
  if (!tableSchema) {
    console.warn(`Table '${table}' not found in schema definitions`);
    return false;
  }

  const exists = tableSchema.columns.includes(column as any);
  if (!exists) {
    console.error(
      `Column '${column}' does not exist in table '${table}'. Available columns:`,
      [...tableSchema.columns]
    );
  }

  return exists;
}

/**
 * Validates if required columns are present for a table operation
 */
export function validateRequiredColumns(
  table: string,
  columns: string[]
): boolean {
  const tableSchema =
    SCHEMA_DEFINITIONS[table as keyof typeof SCHEMA_DEFINITIONS];
  if (!tableSchema) {
    console.warn(`Table '${table}' not found in schema definitions`);
    return false;
  }

  const missingRequired = tableSchema.required.filter(
    col => !columns.includes(col)
  );
  if (missingRequired.length > 0) {
    console.error(
      `Missing required columns for table '${table}':`,
      missingRequired
    );
    return false;
  }

  return true;
}

/**
 * Gets all available columns for a table
 */
export function getTableColumns(table: string): string[] {
  const tableSchema =
    SCHEMA_DEFINITIONS[table as keyof typeof SCHEMA_DEFINITIONS];
  return tableSchema ? [...tableSchema.columns] : [];
}

/**
 * Gets required columns for a table
 */
export function getRequiredColumns(table: string): string[] {
  const tableSchema =
    SCHEMA_DEFINITIONS[table as keyof typeof SCHEMA_DEFINITIONS];
  return tableSchema ? [...tableSchema.required] : [];
}

/**
 * Development helper: Log schema mismatches
 */
export function logSchemaMismatch(
  table: string,
  attemptedColumn: string,
  suggestedColumns?: string[]
) {
  console.group(`🚨 Schema Mismatch Detected`);
  console.error(
    `Attempted to use column '${attemptedColumn}' on table '${table}'`
  );
  console.log(`Available columns:`, getTableColumns(table));
  if (suggestedColumns?.length) {
    console.log(`Suggested alternatives:`, suggestedColumns);
  }
  console.groupEnd();
}

/**
 * Runtime schema validation for development
 */
export function validateSchemaUsage() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Schema Validation Active');
    console.log('Available tables:', Object.keys(SCHEMA_DEFINITIONS));
  }
}

// Development helper - call this to validate schemas during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).validateSchema = {
    validateColumn,
    validateRequiredColumns,
    getTableColumns,
    getRequiredColumns,
    logSchemaMismatch,
    SCHEMA_DEFINITIONS,
  };
}
