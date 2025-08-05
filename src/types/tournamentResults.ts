// Tournament Results Types
export interface TournamentResultWithPlayer {
  user_id: string;
  full_name: string;
  display_name: string;
  avatar_url: string;
  verified_rank: string;
  final_position: number;
  total_matches: number;
  wins: number;
  losses: number;
  win_percentage: number;
  spa_points_earned: number;
  elo_points_awarded: number;
  prize_amount: number;
  physical_rewards?: string[];
  placement_type?: string;
  id?: string;
}
