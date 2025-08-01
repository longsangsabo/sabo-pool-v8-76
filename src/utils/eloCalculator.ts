export interface EloConfig {
  k_factor: number;
  rating_floor: number;
  rating_ceiling: number;
  volatility_adjustment: boolean;
  streak_bonus: boolean;
  tournament_bonus: boolean;
  upset_bonus: boolean;
  quality_match_bonus: boolean;
}

export interface EloMatch {
  player1_rating: number;
  player2_rating: number;
  player1_matches: number;
  player2_matches: number;
  player1_streak: number;
  player2_streak: number;
  player1_volatility: number;
  player2_volatility: number;
}

export interface EloResult {
  player1_rating_change: number;
  player2_rating_change: number;
  expected_score_1: number;
  expected_score_2: number;
  k_factor_1: number;
  k_factor_2: number;
}

export interface PlayerStats {
  id: string;
  user_id: string;
  username: string;
  current_rating: number;
  wins: number;
  losses: number;
  draws: number;
  total_games: number;
  matches_played: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  elo_rating: number;
  rank: string;
  recent_form?: number;
  consistency_score?: number;
  rating_volatility?: number;
  highest_rating?: number;
  lowest_rating?: number;
  average_opponent_rating?: number;
}

// Basic Elo calculation function
export const calculateElo = (
  player1Rating: number,
  player2Rating: number,
  player1Won: boolean,
  kFactor: number = 32
): { newRating1: number; newRating2: number; ratingChange: number } => {
  const expectedScore1 =
    1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400));
  const actualScore1 = player1Won ? 1 : 0;

  const ratingChange = Math.round(kFactor * (actualScore1 - expectedScore1));

  return {
    newRating1: player1Rating + ratingChange,
    newRating2: player2Rating - ratingChange,
    ratingChange: Math.abs(ratingChange),
  };
};

// Alternative name for backward compatibility
export const calculateEloRating = (
  rating: number,
  opponentRating: number,
  result: 'win' | 'loss' | 'draw',
  kFactor: number = 32
): number => {
  const expectedScore = getExpectedScore(rating, opponentRating);
  let actualScore: number;

  switch (result) {
    case 'win':
      actualScore = 1;
      break;
    case 'loss':
      actualScore = 0;
      break;
    case 'draw':
      actualScore = 0.5;
      break;
  }

  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  return rating + ratingChange;
};

// Enhanced Elo calculation with advanced features
export const calculateAdvancedElo = (
  config: EloConfig,
  match: EloMatch,
  winner: 1 | 2
): EloResult => {
  const { k_factor } = config;

  // Calculate expected scores
  const ratingDiff = match.player2_rating - match.player1_rating;
  const expectedScore1 = 1 / (1 + Math.pow(10, ratingDiff / 400));
  const expectedScore2 = 1 - expectedScore1;

  // Determine actual scores
  const actualScore1 = winner === 1 ? 1 : 0;
  const actualScore2 = winner === 2 ? 1 : 0;

  // Calculate base K-factors
  let kFactor1 = getKFactor(match.player1_rating, match.player1_matches);
  let kFactor2 = getKFactor(match.player2_rating, match.player2_matches);

  // Apply modifiers based on config
  if (config.volatility_adjustment) {
    kFactor1 *= 1 + match.player1_volatility * 0.1;
    kFactor2 *= 1 + match.player2_volatility * 0.1;
  }

  // Calculate rating changes
  const ratingChange1 = Math.round(kFactor1 * (actualScore1 - expectedScore1));
  const ratingChange2 = Math.round(kFactor2 * (actualScore2 - expectedScore2));

  return {
    player1_rating_change: ratingChange1,
    player2_rating_change: ratingChange2,
    expected_score_1: expectedScore1,
    expected_score_2: expectedScore2,
    k_factor_1: kFactor1,
    k_factor_2: kFactor2,
  };
};

// Get K-factor based on rating and experience
export const getKFactor = (rating: number, matchesPlayed: number): number => {
  // New players (< 30 matches) get higher K-factor
  if (matchesPlayed < 30) return 40;

  // High-rated players get lower K-factor for stability
  if (rating >= 2400) return 16;
  if (rating >= 2100) return 24;

  // Standard K-factor for most players
  return 32;
};

// Calculate rating from rank
export const getRatingFromRank = (rank: string): number => {
  const rankRatings: { [key: string]: number } = {
    K1: 1000,
    K2: 1100,
    K3: 1200,
    D1: 1300,
    D2: 1400,
    D3: 1500,
    D4: 1600,
    D5: 1700,
    Dan1: 1800,
    Dan2: 1900,
    Dan3: 2000,
    Dan4: 2100,
    Dan5: 2200,
    Dan6: 2300,
    Dan7: 2400,
  };

  return rankRatings[rank] || 1000;
};

// Calculate rank from rating - SABO Pool Arena System
export const getRankFromRating = (rating: number): string => {
  if (rating >= 2800) return 'E+';
  if (rating >= 2600) return 'E';
  if (rating >= 2400) return 'F+';
  if (rating >= 2200) return 'F';
  if (rating >= 2000) return 'G+';
  if (rating >= 1800) return 'G';
  if (rating >= 1600) return 'H+';
  if (rating >= 1400) return 'H';
  if (rating >= 1200) return 'I+';
  if (rating >= 1000) return 'I';
  if (rating >= 800) return 'K+';
  return 'K';
};

// Get rank color for UI - SABO Pool Arena System
export const getRankColor = (rank: string): string => {
  switch (rank.charAt(0)) {
    case 'E':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'F':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'G':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'H':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'I':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'K':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Calculate expected win probability
export const calculateWinProbability = (
  rating1: number,
  rating2: number
): number => {
  return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
};

// Get expected score (alias for win probability)
export const getExpectedScore = (rating1: number, rating2: number): number => {
  return calculateWinProbability(rating1, rating2);
};

// Calculate rating volatility
export const calculateVolatility = (
  recentResults: number[],
  timeframe: number = 10
): number => {
  if (recentResults.length < 2) return 0;

  const recent = recentResults.slice(-timeframe);
  const mean = recent.reduce((sum, result) => sum + result, 0) / recent.length;
  const variance =
    recent.reduce((sum, result) => sum + Math.pow(result - mean, 2), 0) /
    recent.length;

  return Math.sqrt(variance);
};

// Additional utility functions for statistics
export const getRankProgression = (currentRank: string): string[] => {
  const ranks = [
    'K1',
    'K2',
    'K3',
    'D1',
    'D2',
    'D3',
    'D4',
    'D5',
    'Dan1',
    'Dan2',
    'Dan3',
    'Dan4',
    'Dan5',
    'Dan6',
    'Dan7',
  ];
  const currentIndex = ranks.indexOf(currentRank);
  return ranks.slice(currentIndex + 1);
};

export const calculateEloEfficiency = (
  ratingGained: number,
  matchesPlayed: number
): number => {
  if (matchesPlayed === 0) return 0;
  return ratingGained / matchesPlayed;
};

export const calculateRecentForm = (recentResults: boolean[]): number => {
  if (recentResults.length === 0) return 0;
  const wins = recentResults.filter(result => result).length;
  return (wins / recentResults.length) * 100;
};

export const calculateConsistencyScore = (ratingHistory: number[]): number => {
  if (ratingHistory.length < 2) return 100;

  const mean =
    ratingHistory.reduce((sum, rating) => sum + rating, 0) /
    ratingHistory.length;
  const variance =
    ratingHistory.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) /
    ratingHistory.length;
  const standardDeviation = Math.sqrt(variance);

  // Lower standard deviation = higher consistency
  // Normalize to 0-100 scale
  const consistencyScore = Math.max(0, 100 - (standardDeviation / mean) * 100);
  return Math.round(consistencyScore);
};

export const predictMatchResult = (
  player1Rating: number,
  player2Rating: number
): { player1WinProbability: number; player2WinProbability: number } => {
  const player1WinProbability = calculateWinProbability(
    player1Rating,
    player2Rating
  );
  const player2WinProbability = 1 - player1WinProbability;

  return {
    player1WinProbability,
    player2WinProbability,
  };
};
