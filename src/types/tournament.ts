export interface Tournament {
  id: string;
  name: string;
  description?: string;
  tournament_type:
    | 'single_elimination'
    | 'double_elimination'
    | 'round_robin'
    | 'swiss';
  game_format: '8_ball' | '9_ball' | '10_ball' | 'straight_pool';
  max_participants: number;
  current_participants: number;
  registration_start: string;
  registration_end: string;
  tournament_start: string;
  tournament_end: string;
  club_id: string;
  venue_address?: string;
  entry_fee: number;
  prize_pool: number;
  first_prize: number;
  second_prize: number;
  third_prize: number;
  status:
    | 'registration_open'
    | 'registration_closed'
    | 'ongoing'
    | 'completed'
    | 'cancelled';
  management_status?: 'open' | 'locked' | 'ongoing' | 'completed';
  rules?: string;
  contact_info?: any;
  banner_image?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Extended properties for tournament configuration
  tier?: string;
  tier_level?: number;
  // Note: prize_distribution removed - using tournament_prize_tiers table
  spa_points_config?: {
    champion?: number;
    runner_up?: number;
    third_place?: number;
    top_8?: number;
    participation?: number;
  };
  elo_points_config?: {
    champion?: number;
    runner_up?: number;
    third_place?: number;
    top_8?: number;
    participation?: number;
  };
  physical_prizes?: any;
  min_rank_requirement?: string;
  max_rank_requirement?: string;
  rank_requirement?: string | string[];
  club?: Club;
}

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  user_id: string;
  registration_date: string;
  status: 'registered' | 'confirmed' | 'cancelled' | 'withdrawn';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  tournament?: Tournament;
  user?: UserProfile;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id: string;
  player2_id: string;
  score_player1?: number;
  score_player2?: number;
  winner_id?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  notes?: string;
  player1?: UserProfile;
  player2?: UserProfile;
}

export interface TournamentResult {
  id: string;
  tournament_id: string;
  user_id: string;
  final_position: number;
  elo_points_earned: number;
  spa_points_earned?: number;
  prize_money?: number;
  physical_rewards?: string[];
  performance_rating?: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  created_at: string;
  updated_at?: string;
  tournament?: Tournament;
  user?: UserProfile;
}

export interface Season {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  description?: string;
  total_prize_pool: number;
  total_tournaments: number;
  total_participants: number;
  created_at: string;
  updated_at: string;
}

export interface SeasonStanding {
  id: string;
  season_id: string;
  user_id: string;
  total_elo_points: number;
  tournaments_played: number;
  best_finish: number;
  total_prize_money: number;
  current_rank: number;
  previous_rank?: number;
  rank_change?: number;
  created_at: string;
  updated_at: string;
  season?: Season;
  user?: UserProfile;
}

export interface ClubStanding {
  id: string;
  club_id: string;
  user_id: string;
  total_elo_points: number;
  tournaments_played: number;
  best_finish: number;
  current_rank: number;
  previous_rank?: number;
  rank_change?: number;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  club?: Club;
  user?: UserProfile;
}

export interface TournamentTier {
  id: string;
  name: string;
  code: 'K' | 'I' | 'H' | 'G' | 'F' | 'E';
  description: string;
  elo_points: {
    first: number;
    second: number;
    third: number;
    fourth: number;
    top8: number;
    participation: number;
  };
  min_rank_requirement?: string;
  max_rank_requirement?: string;
  entry_fee_range: {
    min: number;
    max: number;
  };
  created_at: string;
}

export interface Club {
  id: string;
  name: string;
  address: string;
  description?: string;
  email?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  available_tables?: number;
  hourly_rate?: number;
  monthly_payment?: number;
  is_sabo_owned?: boolean;
  priority_score?: number;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  nickname?: string;
  avatar_url?: string;
  current_rank: string;
  ranking_points: number;
  matches_played: number;
  wins: number;
  losses: number;
  current_streak: number;
  bio?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  province_id?: string;
  district_id?: string;
  ward_id?: string;
  preferred_play_times?: string[];
  min_bet_points?: number;
  max_bet_points?: number;
  club_id?: string;
  preferred_club_id?: string;
  experience_years?: number;
  created_at: string;
  updated_at: string;
}

// Tournament tier definitions based on your specification
export const TOURNAMENT_TIERS: TournamentTier[] = [
  {
    id: '1',
    name: 'Giải Hạng K',
    code: 'K',
    description: 'Giải đấu cho người mới bắt đầu',
    elo_points: {
      first: 1000,
      second: 800,
      third: 600,
      fourth: 400,
      top8: 150,
      participation: 100,
    },
    entry_fee_range: { min: 50000, max: 200000 },
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Giải Hạng I',
    code: 'I',
    description: 'Giải đấu trung cấp',
    elo_points: {
      first: 1000,
      second: 800,
      third: 600,
      fourth: 400,
      top8: 150,
      participation: 100,
    },
    entry_fee_range: { min: 100000, max: 500000 },
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Giải Hạng H',
    code: 'H',
    description: 'Giải đấu nâng cao',
    elo_points: {
      first: 1100,
      second: 850,
      third: 650,
      fourth: 450,
      top8: 200,
      participation: 100,
    },
    entry_fee_range: { min: 200000, max: 800000 },
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Giải Hạng G',
    code: 'G',
    description: 'Giải đấu chuyên nghiệp',
    elo_points: {
      first: 1200,
      second: 900,
      third: 700,
      fourth: 500,
      top8: 250,
      participation: 100,
    },
    entry_fee_range: { min: 500000, max: 2000000 },
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Giải Hạng F',
    code: 'F',
    description: 'Giải đấu chuyên nghiệp',
    elo_points: {
      first: 1300,
      second: 1000,
      third: 800,
      fourth: 600,
      top8: 300,
      participation: 150,
    },
    entry_fee_range: { min: 1000000, max: 5000000 },
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Giải Hạng E',
    code: 'E',
    description: 'Giải đấu chuyên nghiệp cao cấp nhất',
    elo_points: {
      first: 1500,
      second: 1200,
      third: 1000,
      fourth: 800,
      top8: 400,
      participation: 200,
    },
    entry_fee_range: { min: 2000000, max: 10000000 },
    created_at: new Date().toISOString(),
  },
];

export interface TournamentFilters {
  status?: string;
  tournament_type?: string;
  game_format?: string;
  club_id?: string;
  date_from?: string;
  date_to?: string;
  tier?: string;
}

export interface SeasonFilters {
  status?: string;
  year?: number;
}

export interface ClubStandingFilters {
  club_id?: string;
  rank_range?: {
    min: number;
    max: number;
  };
}
