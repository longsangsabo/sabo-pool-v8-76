/**
 * SABO Handicap System Utilities
 * Professional handicap calculation based on rank differences and stake amounts
 */

export type SaboRank =
  | 'K'
  | 'K+'
  | 'I'
  | 'I+'
  | 'H'
  | 'H+'
  | 'G'
  | 'G+'
  | 'F'
  | 'F+'
  | 'E'
  | 'E+';

export interface HandicapResult {
  isValid: boolean;
  errorMessage?: string;
  rankDifference: number;
  handicapChallenger: number;
  handicapOpponent: number;
  challengerRank: SaboRank;
  opponentRank: SaboRank;
  stakeAmount: number;
  explanation: string;
}

const RANK_VALUES: Record<SaboRank, number> = {
  K: 1,
  'K+': 2,
  I: 3,
  'I+': 4,
  H: 5,
  'H+': 6,
  G: 7,
  'G+': 8,
  F: 9,
  'F+': 10,
  E: 11,
  'E+': 12,
};

const RANK_NAMES: Record<SaboRank, string> = {
  K: 'Hạng K (Mới bắt đầu)',
  'K+': 'Hạng K+ (Khá)',
  I: 'Hạng I (Trung bình)',
  'I+': 'Hạng I+ (Trung bình khá)',
  H: 'Hạng H (Giỏi)',
  'H+': 'Hạng H+ (Giỏi hơn)',
  G: 'Hạng G (Rất giỏi)',
  'G+': 'Hạng G+ (Xuất sắc)',
  F: 'Hạng F (Chuyên nghiệp)',
  'F+': 'Hạng F+ (Chuyên nghiệp cao)',
  E: 'Hạng E (Bậc thầy)',
  'E+': 'Hạng E+ (Đại sư)',
};

/**
 * Calculate SABO handicap based on rank difference and stake amount
 */
export function calculateSaboHandicap(
  challengerRank: SaboRank,
  opponentRank: SaboRank,
  stakeAmount: number
): HandicapResult {
  const challengerValue = RANK_VALUES[challengerRank];
  const opponentValue = RANK_VALUES[opponentRank];
  const rankDiff = opponentValue - challengerValue;

  let handicapChallenger = 0;
  let handicapOpponent = 0;
  let isValid = true;
  let errorMessage = '';

  // Check if challenge is allowed (max 2 main ranks difference = 4 sub-ranks)
  if (Math.abs(rankDiff) > 4) {
    isValid = false;
    errorMessage =
      'Chênh lệch hạng quá lớn. Chỉ được thách đấu trong phạm vi ±2 hạng chính.';
  }

  // Calculate handicap based on rank difference and stake amount
  if (rankDiff > 0) {
    // Opponent is higher rank, give challenger handicap
    handicapChallenger = Math.max(
      0,
      Math.min(
        Math.abs(rankDiff),
        Math.floor(stakeAmount / (200 - rankDiff * 25))
      )
    );
  } else if (rankDiff < 0) {
    // Challenger is higher rank, give opponent handicap
    handicapOpponent = Math.max(
      0,
      Math.min(
        Math.abs(rankDiff),
        Math.floor(stakeAmount / (200 - Math.abs(rankDiff) * 25))
      )
    );
  }

  // Generate explanation
  let explanation = '';
  if (!isValid) {
    explanation = errorMessage;
  } else if (rankDiff === 0) {
    explanation = 'Cùng hạng - Không có handicap';
  } else if (handicapChallenger > 0) {
    explanation = `Bạn được cộng ${handicapChallenger} bàn do đối thủ hạng cao hơn`;
  } else if (handicapOpponent > 0) {
    explanation = `Đối thủ được cộng ${handicapOpponent} bàn do bạn hạng cao hơn`;
  } else {
    explanation = 'Chênh lệch nhỏ - Không có handicap';
  }

  return {
    isValid,
    errorMessage,
    rankDifference: rankDiff,
    handicapChallenger,
    handicapOpponent,
    challengerRank,
    opponentRank,
    stakeAmount,
    explanation,
  };
}

/**
 * Get rank display name
 */
export function getRankDisplayName(rank: SaboRank): string {
  return RANK_NAMES[rank] || rank;
}

/**
 * Get all available ranks
 */
export function getAllRanks(): SaboRank[] {
  return Object.keys(RANK_VALUES) as SaboRank[];
}

/**
 * Check if a rank string is valid
 */
export function isValidRank(rank: string): rank is SaboRank {
  return rank in RANK_VALUES;
}

/**
 * Compare two ranks (returns positive if rank1 > rank2)
 */
export function compareRanks(rank1: SaboRank, rank2: SaboRank): number {
  return RANK_VALUES[rank1] - RANK_VALUES[rank2];
}

/**
 * Format handicap display for UI
 */
export function formatHandicapDisplay(result: HandicapResult): {
  title: string;
  description: string;
  color: 'green' | 'blue' | 'red' | 'gray';
} {
  if (!result.isValid) {
    return {
      title: 'Không thể thách đấu',
      description: result.errorMessage || 'Lỗi không xác định',
      color: 'red',
    };
  }

  if (result.handicapChallenger > 0) {
    return {
      title: `Bạn +${result.handicapChallenger} bàn`,
      description: `Được cộng ${result.handicapChallenger} bàn do đối thủ hạng cao hơn`,
      color: 'green',
    };
  }

  if (result.handicapOpponent > 0) {
    return {
      title: `Đối thủ +${result.handicapOpponent} bàn`,
      description: `Đối thủ được cộng ${result.handicapOpponent} bàn do bạn hạng cao hơn`,
      color: 'blue',
    };
  }

  return {
    title: 'Không có handicap',
    description: 'Cùng trình độ hoặc chênh lệch không đáng kể',
    color: 'gray',
  };
}
