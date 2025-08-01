export interface Season2 {
  id: string;
  season_name: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  total_participants: number;
  total_matches: number;
  registration_fee: number;
  prize_pool: number;
  description?: string;
}

export interface Season2LeaderboardEntry {
  id: string;
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string;
  elo_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  points: number;
  win_rate: number;
  form: string;
  total_elo_points: number;
  tournaments_played: number;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    current_rank: string;
    nickname?: string;
  };
}

export type Season2Leaderboard = Season2LeaderboardEntry[];

export interface Season2Stats {
  totalParticipants: number;
  totalMatches: number;
  totalPrizePool: number;
  averageRating: number;
  topRating: number;
  activeUsers: number;
}
