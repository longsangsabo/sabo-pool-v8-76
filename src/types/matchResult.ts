export interface MatchResultData {
  id: string;
  match_id?: string;
  tournament_id?: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  loser_id?: string;

  // Score tracking
  player1_score: number;
  player2_score: number;
  total_frames: number;
  match_format:
    | 'race_to_5'
    | 'race_to_7'
    | 'race_to_9'
    | 'race_to_10'
    | 'race_to_11';

  // ELO and ranking
  player1_elo_before: number;
  player2_elo_before: number;
  player1_elo_after: number;
  player2_elo_after: number;
  player1_elo_change: number;
  player2_elo_change: number;

  // Result verification
  result_status: 'pending' | 'verified' | 'disputed' | 'rejected';
  verification_method?: 'manual' | 'qr_code' | 'referee' | 'auto';
  verified_at?: string;
  verified_by?: string;

  // Player confirmations
  player1_confirmed: boolean;
  player2_confirmed: boolean;
  player1_confirmed_at?: string;
  player2_confirmed_at?: string;

  // Match details
  match_date: string;
  duration_minutes?: number;
  club_id?: string;
  referee_id?: string;

  // Additional stats
  player1_stats?: {
    longest_run?: number;
    total_shots?: number;
    potting_percentage?: number;
    safety_shots?: number;
    fouls?: number;
  };
  player2_stats?: {
    longest_run?: number;
    total_shots?: number;
    potting_percentage?: number;
    safety_shots?: number;
    fouls?: number;
  };
  match_notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;

  // Related data
  player1?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
    elo?: number;
  };
  player2?: {
    id: string;
    display_name: string;
    avatar_url?: string;
    verified_rank?: string;
    elo?: number;
  };
  club?: {
    id: string;
    club_name: string;
    address: string;
  };
  referee?: {
    id: string;
    display_name: string;
  };
  tournament?: {
    id: string;
    name: string;
  };
}

export interface MatchResultFormData {
  tournament_id?: string;
  player1_id: string;
  player2_id: string;
  player1_score: number;
  player2_score: number;
  match_format:
    | 'race_to_5'
    | 'race_to_7'
    | 'race_to_9'
    | 'race_to_10'
    | 'race_to_11';
  match_date: string;
  duration_minutes?: number;
  club_id?: string;
  referee_id?: string;
  player1_stats?: {
    longest_run?: number;
    total_shots?: number;
    potting_percentage?: number;
    safety_shots?: number;
    fouls?: number;
  };
  player2_stats?: {
    longest_run?: number;
    total_shots?: number;
    potting_percentage?: number;
    safety_shots?: number;
    fouls?: number;
  };
  match_notes?: string;
}

export interface MatchDispute {
  id: string;
  match_result_id: string;
  disputed_by: string;
  dispute_reason: string;
  dispute_details?: string;
  evidence_urls?: string[];
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  admin_response?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;

  // Related data
  match_result?: MatchResultData;
  disputer?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface EloHistoryEntry {
  id: string;
  user_id: string;
  match_result_id: string;
  elo_before: number;
  elo_after: number;
  elo_change: number;
  rank_before?: string;
  rank_after?: string;
  opponent_id?: string;
  opponent_elo?: number;
  match_result: 'win' | 'loss' | 'draw';
  k_factor: number;
  created_at: string;

  // Related data
  opponent?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface RankingSnapshot {
  id: string;
  user_id: string;
  snapshot_date: string;
  elo_rating: number;
  rank_position?: number;
  rank_tier: string;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
  current_streak: number;
  peak_elo?: number;
  created_at: string;

  // Related data
  player?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface EloCalculationResult {
  success: boolean;
  player1_elo_change: number;
  player2_elo_change: number;
  player1_new_elo: number;
  player2_new_elo: number;
  expected_score1: number;
  expected_score2: number;
  k_factor1: number;
  k_factor2: number;
}

export interface MatchVerificationResult {
  success: boolean;
  elo_calculation?: EloCalculationResult;
  error?: string;
}
