/**
 * Relationship Mapping System
 * Tự động hóa việc quản lý foreign key relationships trong Supabase
 */

export interface RelationshipMapping {
  table: string;
  foreignKey: string;
  referencedTable: string;
  referencedColumn: string;
  standardName: string;
}

// Mapping chuẩn cho tất cả relationships trong hệ thống
export const RELATIONSHIP_MAPPINGS: Record<string, RelationshipMapping> = {
  // Challenges relationships
  challenges_challenger: {
    table: 'challenges',
    foreignKey: 'challenger_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!challenger_id',
  },
  challenges_opponent: {
    table: 'challenges',
    foreignKey: 'opponent_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!opponent_id',
  },
  challenges_club: {
    table: 'challenges',
    foreignKey: 'club_id',
    referencedTable: 'club_profiles',
    referencedColumn: 'id',
    standardName: 'club_profiles!club_id',
  },

  // Matches relationships
  matches_player1: {
    table: 'matches',
    foreignKey: 'player1_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!player1_id',
  },
  matches_player2: {
    table: 'matches',
    foreignKey: 'player2_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!player2_id',
  },
  matches_winner: {
    table: 'matches',
    foreignKey: 'winner_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!winner_id',
  },
  matches_club: {
    table: 'matches',
    foreignKey: 'club_id',
    referencedTable: 'club_profiles',
    referencedColumn: 'id',
    standardName: 'club_profiles!club_id',
  },

  // Tournament relationships
  tournaments_creator: {
    table: 'tournaments',
    foreignKey: 'created_by',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!created_by',
  },
  tournaments_club: {
    table: 'tournaments',
    foreignKey: 'club_id',
    referencedTable: 'club_profiles',
    referencedColumn: 'id',
    standardName: 'club_profiles!club_id',
  },

  // Tournament registrations
  tournament_registrations_player: {
    table: 'tournament_registrations',
    foreignKey: 'user_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!user_id',
  },
  tournament_registrations_tournament: {
    table: 'tournament_registrations',
    foreignKey: 'tournament_id',
    referencedTable: 'tournaments',
    referencedColumn: 'id',
    standardName: 'tournaments!tournament_id',
  },

  // Match results
  match_results_player1: {
    table: 'match_results',
    foreignKey: 'player1_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!player1_id',
  },
  match_results_player2: {
    table: 'match_results',
    foreignKey: 'player2_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!player2_id',
  },
  match_results_winner: {
    table: 'match_results',
    foreignKey: 'winner_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!winner_id',
  },

  // Notifications
  notifications_user: {
    table: 'notifications',
    foreignKey: 'user_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!user_id',
  },

  // Club profiles
  club_profiles_user: {
    table: 'club_profiles',
    foreignKey: 'user_id',
    referencedTable: 'profiles',
    referencedColumn: 'user_id',
    standardName: 'profiles!user_id',
  },
};

/**
 * Lấy relationship name chuẩn cho một bảng và foreign key
 */
export function getStandardRelationship(
  table: string,
  foreignKey: string
): string {
  const key = `${table}_${foreignKey.replace('_id', '')}`;
  const mapping = RELATIONSHIP_MAPPINGS[key];

  if (!mapping) {
    console.warn(
      `No standard relationship mapping found for ${table}.${foreignKey}`
    );
    return `${mapping?.referencedTable || 'unknown'}!${foreignKey}`;
  }

  return mapping.standardName;
}

/**
 * Tạo query select với relationships chuẩn
 */
export function buildSelectWithRelationships(
  baseSelect: string,
  relationships: Array<{
    alias: string;
    table: string;
    foreignKey: string;
    fields: string[];
  }>
): string {
  let selectQuery = baseSelect;

  relationships.forEach(rel => {
    const standardRel = getStandardRelationship(rel.table, rel.foreignKey);
    const fieldsStr = rel.fields.join(',\n            ');

    selectQuery += `,
          ${rel.alias}:${standardRel}(
            ${fieldsStr}
          )`;
  });

  return selectQuery;
}

/**
 * Validate relationship consistency
 */
export function validateRelationships(codeContent: string): Array<{
  line: number;
  issue: string;
  suggestion: string;
}> {
  const issues: Array<{ line: number; issue: string; suggestion: string }> = [];
  const lines = codeContent.split('\n');

  lines.forEach((line, index) => {
    // Tìm các pattern relationship không chuẩn
    const relationshipPattern = /(\w+):(\w+)!(\w+)/g;
    let match;

    while ((match = relationshipPattern.exec(line)) !== null) {
      const [fullMatch, alias, table, foreignKey] = match;

      // Kiểm tra xem có mapping chuẩn không
      const expectedRel = getStandardRelationship('challenges', foreignKey);
      if (fullMatch !== `${alias}:${expectedRel}`) {
        issues.push({
          line: index + 1,
          issue: `Non-standard relationship: ${fullMatch}`,
          suggestion: `Use: ${alias}:${expectedRel}`,
        });
      }
    }
  });

  return issues;
}

/**
 * Auto-fix relationships trong code
 */
export function autoFixRelationships(codeContent: string): string {
  let fixedContent = codeContent;

  // Fix challenges relationships
  fixedContent = fixedContent.replace(
    /profiles!challenges_challenger_id_fkey/g,
    'profiles!challenger_id'
  );
  fixedContent = fixedContent.replace(
    /profiles!challenges_opponent_id_fkey/g,
    'profiles!opponent_id'
  );
  fixedContent = fixedContent.replace(
    /user_profiles!challenges_challenger_id_fkey/g,
    'profiles!challenger_id'
  );
  fixedContent = fixedContent.replace(
    /user_profiles!challenges_opponent_id_fkey/g,
    'profiles!opponent_id'
  );

  // Fix club relationships
  fixedContent = fixedContent.replace(/clubs!/g, 'club_profiles!');

  return fixedContent;
}
