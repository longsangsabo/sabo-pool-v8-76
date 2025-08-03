export interface SeasonHistory {
  id: string;
  user_id: string;
  season_name: string;
  season_year: number;
  final_rank: number;
  final_points: number;
  ranking_points: number; // Add missing property
  matches_played: number;
  wins: number;
  losses: number;
  peak_rank?: number;
  created_at: string;
  updated_at: string;

  // Joined data
  profiles?: {
    nickname?: string;
    full_name?: string;
    avatar_url?: string;
  };

  // Add nickname directly for easier access
  nickname?: string;
}

export interface SeasonHistoryFilters {
  season_name?: string;
  season_year?: number;
  user_id?: string;
  min_rank?: number;
  max_rank?: number;
  club_id?: string;
  nickname?: string;
}

export interface CurrentSeason {
  season_name: string;
  season_year: number;
  start_date: string;
  end_date: string;
  status: 'ongoing' | 'completed' | 'upcoming';
  total_participants: number;
  days_remaining?: number; // Add missing property
}

export interface SeasonProgress {
  user_rank: number;
  total_participants: number;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  rating_change: number;
  progress_percentage?: number; // Add missing property
  days_elapsed?: number; // Add missing property
  days_remaining?: number; // Add missing property
}

export interface SeasonStats {
  season_name: string;
  season_year: number;
  total_players: number;
  highest_points: number;
  average_points: number;
  lowest_points: number;
}

export interface SeasonComparison {
  current_season: {
    season_name: string;
    season_year: number;
    rank: number;
    points: number;
    matches_played: number;
    total_players: number; // Add missing property
    highest_points: number; // Add missing property
    average_points: number; // Add missing property
  };
  previous_season: {
    season_name: string;
    season_year: number;
    rank: number;
    points: number;
    matches_played: number;
    total_players: number; // Add missing property
    highest_points: number; // Add missing property
    average_points: number; // Add missing property
  };
  improvement: {
    rank_change: number;
    points_change: number;
    matches_change: number;
  };
  top_players_change: Array<{
    // Add missing property
    nickname: string;
    current_rank: number;
    previous_rank?: number;
    current_points: number;
    previous_points?: number;
    rank_change: number;
    points_change: number;
  }>;
}

export interface PlayerHistoryResponse {
  player_history: SeasonHistory[];
  total_seasons: number;
}

export interface BestSeasonData {
  season_name: string;
  season_year: number;
  best_rank: number;
  points: number;
  matches_played: number;
  win_rate: number;
}

export interface UserBestSeason {
  season_name: string;
  season_year: number;
  final_rank: number;
  ranking_points: number;
  achievement_level: string;
}
