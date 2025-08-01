// SABO Challenge types
export interface SaboChallengePlayer {
  id: string;
  username: string;
  display_name: string;
  current_elo: number;
  current_rank: string;
  spa_points: number;
  avatar_url?: string | null;
}

export interface RackResult {
  rack_number: number;
  winner_id: string;
  challenger_total: number;
  opponent_total: number;
  timestamp: string;
}

export interface SaboChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  stake_amount: number;
  race_to: number;
  handicap_challenger: number;
  handicap_opponent: number;
  status:
    | 'pending'
    | 'accepted'
    | 'declined'
    | 'in_progress'
    | 'completed'
    | 'expired';
  created_at: string;
  expires_at: string;
  accepted_at?: string;
  started_at?: string;
  score_confirmation_timestamp?: string;
  challenger_final_score: number;
  opponent_final_score: number;
  winner_id?: string;
  rack_history: RackResult[];

  // Player info (optional, loaded via join)
  challenger?: SaboChallengePlayer;
  opponent?: SaboChallengePlayer;
}
